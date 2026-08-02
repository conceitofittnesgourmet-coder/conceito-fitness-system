const Pedido = require("../models/pedido");
const Produto = require("../models/produto");
const Cliente = require("../models/cliente");
const ContaPagar = require("../models/contapagar");
const ContaReceber = require("../models/contareceber");
const MovimentacaoFinanceira = require("../models/movimentacaofinanceira");
const Compra = require("../models/compra");
const MateriaPrima = require("../models/materiaprima");
const { dataBrParaInicio, dataBrParaFim, inicioMesSaoPaulo, pagamentosDoPedido, filtroEmpresa } = require("../services/vendasMetricsService");

function montarPeriodo(query) {
  const hoje = new Date();
  const inicio = query.inicio ? dataBrParaInicio(query.inicio) : inicioMesSaoPaulo(hoje);
  const fim = query.fim ? dataBrParaFim(query.fim) : hoje;
  return { inicio, fim };
}

function numero(valor) {
  return Number(valor || 0);
}

exports.relatorioGeral = async (req, res) => {
  try {
    const { inicio, fim } = montarPeriodo(req.query);
    const empresa = filtroEmpresa(req);

    const pedidos = await Pedido.find({
  ...empresa,
  createdAt: {
    $gte: inicio,
    $lte: fim,
  },
  status: {
    $ne: "cancelado",
  },
}).sort({
  createdAt: -1,
});

    const contasPagar = await ContaPagar.find({
      ...empresa, createdAt: { $gte: inicio, $lte: fim },
    }).sort({ createdAt: -1 });

    const contasReceber = await ContaReceber.find({
      ...empresa, createdAt: { $gte: inicio, $lte: fim },
    }).sort({ createdAt: -1 });

    const movimentacoes = await MovimentacaoFinanceira.find({
      ...empresa, data: { $gte: inicio, $lte: fim },
    }).sort({ createdAt: -1 });

    const compras = await Compra.find({
      ...empresa, createdAt: { $gte: inicio, $lte: fim },
    })
      .populate("fornecedor")
      .populate("itens.materiaPrima")
      .sort({ createdAt: -1 });

    const materias = await MateriaPrima.find({ ...empresa, ativo: true }).sort({ nome: 1 });
    const produtos = await Produto.find({ ...empresa, ativo: true }).sort({ nome: 1 });
    const clientes = await Cliente.find(empresa).sort({ createdAt: -1 }).limit(20);

    let faturamento = 0;
    let custoTotal = 0;
    let lucroTotal = 0;

    const produtosVendidos = {};
    const produtosLucrativos = {};
    const vendasPorPagamento = {};

    pedidos.forEach((pedido) => {
      const totalPedido = numero(pedido.total);
      faturamento += totalPedido;

      pagamentosDoPedido(pedido).forEach(({ forma, valor }) => {
        vendasPorPagamento[forma] = numero(vendasPorPagamento[forma]) + numero(valor);
      });

      pedido.produtos?.forEach((item) => {
        const nome = item.nome || "Produto";
        const quantidade = numero(item.quantidade || 1);
        const preco = numero(item.precoUnitario ?? item.preco);
        const custo = numero(item.custoNaVenda ?? item.custo);

        produtosVendidos[nome] =
          numero(produtosVendidos[nome]) + quantidade;

        const custoVenda = custo * quantidade;
        const lucroVenda = (preco - custo) * quantidade;

        custoTotal += custoVenda;
        lucroTotal += lucroVenda;

        produtosLucrativos[nome] =
          numero(produtosLucrativos[nome]) + lucroVenda;
      });
    });

    const entradas = movimentacoes
      .filter((m) => m.tipo === "entrada")
      .reduce((acc, m) => acc + numero(m.valor), 0);

    const saidas = movimentacoes
      .filter((m) => m.tipo === "saida")
      .reduce((acc, m) => acc + numero(m.valor), 0);

    const totalCompras = compras.reduce(
      (acc, compra) => acc + numero(compra.valorTotal),
      0
    );

    const contasPagarTotal = contasPagar.reduce(
      (acc, conta) => acc + numero(conta.valor),
      0
    );

    const contasReceberTotal = contasReceber.reduce(
      (acc, conta) => acc + numero(conta.valor),
      0
    );

    const totalPedidos = pedidos.length;

    const ticketMedio =
      totalPedidos > 0 ? faturamento / totalPedidos : 0;

    const margemLucro =
      faturamento > 0
        ? Number(((lucroTotal / faturamento) * 100).toFixed(2))
        : 0;

    const topProdutosVendidos = Object.entries(produtosVendidos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([nome, quantidade]) => ({
        nome,
        quantidade,
      }));

    const topProdutosLucrativos = Object.entries(produtosLucrativos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([nome, lucro]) => ({
        nome,
        lucro: Number(lucro.toFixed(2)),
      }));

    const estoqueBaixo = materias.filter(
      (m) => numero(m.estoqueAtual) <= numero(m.estoqueMinimo)
    );

    return res.json({
      success: true,

      periodo: {
        inicio,
        fim,
      },

      resumo: {
        faturamento: Number(faturamento.toFixed(2)),
        custoTotal: Number(custoTotal.toFixed(2)),
        lucroTotal: Number(lucroTotal.toFixed(2)),
        margemLucro,
        totalPedidos,
        ticketMedio: Number(ticketMedio.toFixed(2)),
        entradas: Number(entradas.toFixed(2)),
        saidas: Number(saidas.toFixed(2)),
        saldo: Number((entradas - saidas).toFixed(2)),
        totalCompras: Number(totalCompras.toFixed(2)),
        contasPagarTotal: Number(contasPagarTotal.toFixed(2)),
        contasReceberTotal: Number(contasReceberTotal.toFixed(2)),
        totalProdutos: produtos.length,
        totalClientes: await Cliente.countDocuments(empresa),
        estoqueBaixo: estoqueBaixo.length,
      },

      vendasPorPagamento,
      topProdutosVendidos,
      topProdutosLucrativos,

      topClientes: clientes.map((cliente) => ({
        nome: cliente.nome || "Cliente",
        telefone: cliente.telefone || "",
        email: cliente.email || "",
        gasto: numero(cliente.gasto || cliente.totalGasto),
        pontos: numero(cliente.pontos),
        cashback: numero(cliente.cashback),
        clube: cliente.clube || cliente.nivel || "-",
      })),

      estoqueBaixo,

      pedidos: pedidos.slice(0, 50),
      compras: compras.slice(0, 50),
      contasPagar: contasPagar.slice(0, 50),
      contasReceber: contasReceber.slice(0, 50),
      movimentacoes: movimentacoes.slice(0, 80),
    });
  } catch (error) {
    console.log("ERRO RELATÓRIO GERAL:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};