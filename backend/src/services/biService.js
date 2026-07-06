const Pedido = require("../models/pedido");
const Produto = require("../models/produto");
const Cliente = require("../models/cliente");

function normalizarForma(valor) {
  return String(valor || "NAO_INFORMADO").toUpperCase();
}

function somarPagamento(pagamentos, fallbackForma, fallbackValor) {
  if (Array.isArray(pagamentos) && pagamentos.length > 0) {
    return pagamentos.map((p) => ({
      forma: normalizarForma(p.forma),
      valor: Number(p.valor || 0),
    }));
  }

  return [
    {
      forma: normalizarForma(fallbackForma || "PIX"),
      valor: Number(fallbackValor || 0),
    },
  ];
}

async function gerarBI() {
  const hoje = new Date();

  const inicioHoje = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate()
  );

  const inicioSemana = new Date();
  inicioSemana.setDate(hoje.getDate() - 7);

  const inicioMes = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    1
  );

  const [pedidos, produtos, clientes] = await Promise.all([
    Pedido.find({ status: { $ne: "cancelado" } }),
    Produto.find(),
    Cliente.find().sort({ gasto: -1 }).limit(20),
  ]);

  let faturamento = 0;
  let faturamentoHoje = 0;
  let faturamentoSemana = 0;
  let faturamentoMes = 0;
  let maiorVenda = 0;

  let lucroTotal = 0;
  let custoTotal = 0;

  const pagamentos = {
    pix: 0,
    credito: 0,
    debito: 0,
    dinheiro: 0,
    outros: 0,
  };

  const produtosVendidos = {};
  const produtosLucrativos = {};
  const vendasPorHora = {};
  const vendasPorDiaSemana = {};
  const categorias = {};

  pedidos.forEach((pedido) => {
    const total = Number(pedido.total || 0);
    const dataPedido = new Date(pedido.createdAt);

    faturamento += total;

    if (total > maiorVenda) maiorVenda = total;

    if (dataPedido >= inicioHoje) faturamentoHoje += total;
    if (dataPedido >= inicioSemana) faturamentoSemana += total;
    if (dataPedido >= inicioMes) faturamentoMes += total;

    const hora = String(dataPedido.getHours()).padStart(2, "0") + "h";
    vendasPorHora[hora] = (vendasPorHora[hora] || 0) + total;

    const dia = dataPedido.toLocaleDateString("pt-BR", {
      weekday: "long",
    });

    vendasPorDiaSemana[dia] =
      (vendasPorDiaSemana[dia] || 0) + total;

    somarPagamento(
      pedido.pagamentos,
      pedido.pagamento,
      total
    ).forEach((p) => {
      if (p.forma === "PIX") pagamentos.pix += p.valor;
      else if (p.forma === "CREDITO") pagamentos.credito += p.valor;
      else if (p.forma === "DEBITO") pagamentos.debito += p.valor;
      else if (p.forma === "DINHEIRO") pagamentos.dinheiro += p.valor;
      else pagamentos.outros += p.valor;
    });

    pedido.produtos?.forEach((produto) => {
      const nome = produto.nome || "Produto";
      const quantidade = Number(produto.quantidade || 1);
      const precoVenda = Number(produto.preco || 0);
      const custoProduto = Number(produto.custo || 0);
      const categoria = produto.categoria || "Sem categoria";

      produtosVendidos[nome] =
        (produtosVendidos[nome] || 0) + quantidade;

      categorias[categoria] =
        (categorias[categoria] || 0) + precoVenda * quantidade;

      const lucroProduto =
        (precoVenda - custoProduto) * quantidade;

      const custoVenda = custoProduto * quantidade;

      lucroTotal += lucroProduto;
      custoTotal += custoVenda;

      produtosLucrativos[nome] =
        (produtosLucrativos[nome] || 0) + lucroProduto;
    });
  });

  const totalPedidos = pedidos.length;

  const ticketMedio =
    totalPedidos > 0 ? faturamento / totalPedidos : 0;

  const margemLucro =
    faturamento > 0
      ? Number(((lucroTotal / faturamento) * 100).toFixed(2))
      : 0;

  const topProdutos = Object.entries(produtosVendidos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([nome, quantidade]) => ({ nome, quantidade }));

  const topProdutosLucrativos = Object.entries(produtosLucrativos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([nome, lucro]) => ({
      nome,
      lucro: Number(lucro.toFixed(2)),
    }));

  const topCategorias = Object.entries(categorias)
    .sort((a, b) => b[1] - a[1])
    .map(([nome, valor]) => ({
      nome,
      valor: Number(valor.toFixed(2)),
    }));

  const topClientes = clientes.map((c) => ({
    nome: c.nome,
    telefone: c.telefone,
    gasto: Number(c.gasto || 0),
    clube: c.clube,
    pontos: c.pontos || 0,
    cashback: c.cashback || 0,
  }));

  const insights = [];

  if (ticketMedio < 50 && totalPedidos > 0) {
    insights.push("O ticket médio está abaixo de R$ 50,00. Avalie combos e adicionais no PDV.");
  }

  if (pagamentos.pix > pagamentos.credito && pagamentos.pix > pagamentos.dinheiro) {
    insights.push("PIX é a principal forma de pagamento. Vale destacar essa opção no atendimento.");
  }

  if (topProdutos[0]) {
    insights.push(`O produto mais vendido é ${topProdutos[0].nome}. Use ele como destaque em campanhas.`);
  }

  if (margemLucro < 40 && faturamento > 0) {
    insights.push("A margem de lucro está abaixo de 40%. Revise CMV e precificação dos produtos.");
  }

  return {
    faturamento,
    faturamentoHoje,
    faturamentoSemana,
    faturamentoMes,
    totalPedidos,
    totalProdutos: produtos.length,
    totalClientes: clientes.length,
    ticketMedio,
    maiorVenda,
    custoTotal,
    lucroTotal,
    margemLucro,
    pagamentos,
    topProdutos,
    topProdutosLucrativos,
    topCategorias,
    topClientes,
    vendasPorHora,
    vendasPorDiaSemana,
    ia: {
      insights,
    },
  };
}

module.exports = {
  gerarBI,
};