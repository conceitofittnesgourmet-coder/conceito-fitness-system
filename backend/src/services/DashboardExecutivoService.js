const Pedido = require("../models/pedido");
const Produto = require("../models/produto");
const Cliente = require("../models/cliente");
const CmvProducao = require("../models/cmvproducao");
const OrdemProducao = require("../models/ordemproducao");

function numero(valor) {
  const n = Number(valor || 0);
  return Number.isFinite(n) ? n : 0;
}

function arredondar(valor, casas = 2) {
  const fator = 10 ** casas;
  return Math.round((numero(valor) + Number.EPSILON) * fator) / fator;
}

function inicioDoDia(data) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function criarFaixa(dias) {
  const fim = new Date();
  const inicio = inicioDoDia(fim);
  inicio.setDate(inicio.getDate() - Math.max(0, dias - 1));
  return { inicio, fim };
}

function statusValidoPedido(status) {
  return !["cancelado", "cancelada", "estornado", "estornada"].includes(
    String(status || "").toLowerCase()
  );
}

function custoItem(item) {
  return numero(item.custoNaVenda ?? item.custo ?? 0);
}

function precoItem(item) {
  return numero(item.precoUnitario ?? item.preco ?? 0);
}

function dataKey(data) {
  return data.toISOString().slice(0, 10);
}

function formatarDia(data) {
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

async function gerarDashboardExecutivo({ dias = 30 } = {}) {
  const periodo = Math.min(365, Math.max(7, Number(dias) || 30));
  const { inicio, fim } = criarFaixa(periodo);
  const inicioAnterior = new Date(inicio);
  inicioAnterior.setDate(inicioAnterior.getDate() - periodo);

  const [pedidosPeriodo, pedidosAnterior, produtos, totalClientes, cmvProduzido, ordensAtivas] = await Promise.all([
    Pedido.find({ createdAt: { $gte: inicio, $lte: fim } }).lean(),
    Pedido.find({ createdAt: { $gte: inicioAnterior, $lt: inicio } }).lean(),
    Produto.find({}).lean(),
    Cliente.countDocuments(),
    CmvProducao.find({ dataProducao: { $gte: inicio, $lte: fim } }).lean(),
    OrdemProducao.find({ status: { $in: ["aberta", "em_producao"] } }).lean(),
  ]);

  const pedidosValidos = pedidosPeriodo.filter((pedido) => statusValidoPedido(pedido.status));
  const pedidosValidosAnterior = pedidosAnterior.filter((pedido) => statusValidoPedido(pedido.status));

  const diasSerie = [];
  const mapaSerie = {};
  for (let i = 0; i < periodo; i += 1) {
    const data = new Date(inicio);
    data.setDate(inicio.getDate() + i);
    const key = dataKey(data);
    mapaSerie[key] = { dia: formatarDia(data), faturamento: 0, cmv: 0, lucro: 0, pedidos: 0 };
    diasSerie.push(mapaSerie[key]);
  }

  let faturamento = 0;
  let custoVendido = 0;
  let quantidadeVendida = 0;
  const ranking = new Map();
  const vendasPorHora = new Map();

  for (const pedido of pedidosValidos) {
    const total = numero(pedido.total);
    const data = new Date(pedido.createdAt);
    const key = dataKey(data);
    faturamento += total;

    if (mapaSerie[key]) {
      mapaSerie[key].faturamento += total;
      mapaSerie[key].pedidos += 1;
    }

    const hora = `${String(data.getHours()).padStart(2, "0")}h`;
    vendasPorHora.set(hora, (vendasPorHora.get(hora) || 0) + 1);

    for (const item of pedido.produtos || []) {
      const quantidade = numero(item.quantidade || 1);
      const preco = precoItem(item);
      const custo = custoItem(item);
      const receita = preco * quantidade;
      const cmv = custo * quantidade;
      const lucro = receita - cmv;
      const id = String(item.produtoId || item.nome || "produto");
      const atual = ranking.get(id) || {
        produtoId: item.produtoId || null,
        nome: item.nome || "Produto",
        quantidade: 0,
        faturamento: 0,
        cmv: 0,
        lucro: 0,
      };

      atual.quantidade += quantidade;
      atual.faturamento += receita;
      atual.cmv += cmv;
      atual.lucro += lucro;
      ranking.set(id, atual);
      custoVendido += cmv;
      quantidadeVendida += quantidade;

      if (mapaSerie[key]) mapaSerie[key].cmv += cmv;
    }
  }

  for (const item of diasSerie) {
    item.faturamento = arredondar(item.faturamento);
    item.cmv = arredondar(item.cmv);
    item.lucro = arredondar(item.faturamento - item.cmv);
  }

  const faturamentoAnterior = pedidosValidosAnterior.reduce((soma, pedido) => soma + numero(pedido.total), 0);
  const lucroBruto = faturamento - custoVendido;
  const margemBruta = faturamento > 0 ? (lucroBruto / faturamento) * 100 : 0;
  const ticketMedio = pedidosValidos.length > 0 ? faturamento / pedidosValidos.length : 0;
  const variacaoFaturamento = faturamentoAnterior > 0
    ? ((faturamento - faturamentoAnterior) / faturamentoAnterior) * 100
    : faturamento > 0 ? 100 : 0;

  const rankingProdutos = [...ranking.values()]
    .map((item) => ({
      ...item,
      quantidade: arredondar(item.quantidade, 3),
      faturamento: arredondar(item.faturamento),
      cmv: arredondar(item.cmv),
      lucro: arredondar(item.lucro),
      margem: item.faturamento > 0 ? arredondar((item.lucro / item.faturamento) * 100) : 0,
    }))
    .sort((a, b) => b.lucro - a.lucro);

  const produtosEstoqueBaixo = produtos
    .filter((produto) => numero(produto.estoque) <= numero(produto.estoqueMinimo))
    .map((produto) => ({
      id: produto._id,
      nome: produto.nome,
      estoque: arredondar(produto.estoque, 3),
      estoqueMinimo: arredondar(produto.estoqueMinimo, 3),
    }))
    .sort((a, b) => a.estoque - b.estoque)
    .slice(0, 10);

  const produtosMargemCritica = produtos
    .filter((produto) => numero(produto.preco) > 0)
    .map((produto) => {
      const lucro = numero(produto.preco) - numero(produto.custo);
      const margem = (lucro / numero(produto.preco)) * 100;
      return { id: produto._id, nome: produto.nome, margem: arredondar(margem), preco: numero(produto.preco), custo: numero(produto.custo) };
    })
    .filter((produto) => produto.margem < 30)
    .sort((a, b) => a.margem - b.margem)
    .slice(0, 10);

  const custoProduzido = cmvProduzido.reduce((soma, item) => soma + numero(item.custoTotal), 0);
  const unidadesProduzidas = cmvProduzido.reduce((soma, item) => soma + numero(item.quantidadeProduzida), 0);

  const alertas = [];
  if (produtosEstoqueBaixo.length) alertas.push({ tipo: "estoque", nivel: "critico", mensagem: `${produtosEstoqueBaixo.length} produto(s) com estoque baixo.` });
  if (produtosMargemCritica.length) alertas.push({ tipo: "margem", nivel: "atencao", mensagem: `${produtosMargemCritica.length} produto(s) com margem inferior a 30%.` });
  if (ordensAtivas.length) alertas.push({ tipo: "producao", nivel: "informativo", mensagem: `${ordensAtivas.length} ordem(ns) de produção em aberto.` });
  if (!pedidosValidos.length) alertas.push({ tipo: "vendas", nivel: "informativo", mensagem: "Nenhuma venda registrada no período selecionado." });

  return {
    periodo: { dias: periodo, inicio, fim },
    kpis: {
      faturamento: arredondar(faturamento),
      faturamentoAnterior: arredondar(faturamentoAnterior),
      variacaoFaturamento: arredondar(variacaoFaturamento),
      pedidos: pedidosValidos.length,
      ticketMedio: arredondar(ticketMedio),
      cmvVendido: arredondar(custoVendido),
      lucroBruto: arredondar(lucroBruto),
      margemBruta: arredondar(margemBruta),
      quantidadeVendida: arredondar(quantidadeVendida, 3),
      totalProdutos: produtos.length,
      totalClientes,
      custoProduzido: arredondar(custoProduzido),
      unidadesProduzidas: arredondar(unidadesProduzidas, 3),
      ordensAtivas: ordensAtivas.length,
    },
    series: {
      vendas: diasSerie,
      pedidosPorHora: [...vendasPorHora.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([hora, total]) => ({ hora, total })),
    },
    rankings: {
      porLucro: rankingProdutos.slice(0, 10),
      porQuantidade: [...rankingProdutos].sort((a, b) => b.quantidade - a.quantidade).slice(0, 10),
      porMargem: [...rankingProdutos].filter((item) => item.faturamento > 0).sort((a, b) => b.margem - a.margem).slice(0, 10),
    },
    alertas,
    estoqueBaixo: produtosEstoqueBaixo,
    margemCritica: produtosMargemCritica,
  };
}

module.exports = { gerarDashboardExecutivo };
