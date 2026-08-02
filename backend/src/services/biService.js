const Pedido = require("../models/pedido");
const Produto = require("../models/produto");
const Cliente = require("../models/cliente");
const {
  inicioDiaSaoPaulo, inicioMesSaoPaulo, filtroVendaValida,
  pagamentosDoPedido, partesSaoPaulo, numero,
} = require("./vendasMetricsService");

async function gerarBI({ empresa } = {}) {
  const agora = new Date();
  const inicioHoje = inicioDiaSaoPaulo(agora);
  const inicioMes = inicioMesSaoPaulo(agora);
  const inicioSemana = new Date(inicioHoje.getTime() - 6 * 86400000);
  const escopo = empresa ? { empresa } : {};

  const [pedidosMes, pedidosSemana, produtos, totalClientes, clientes] = await Promise.all([
    Pedido.find({ ...escopo, ...filtroVendaValida(), createdAt: { $gte: inicioMes, $lte: agora } }).lean(),
    Pedido.find({ ...escopo, ...filtroVendaValida(), createdAt: { $gte: inicioSemana, $lte: agora } }).lean(),
    Produto.find(escopo).lean(),
    Cliente.countDocuments(escopo),
    Cliente.find(escopo).sort({ gasto: -1 }).limit(20).lean(),
  ]);

  let faturamentoMes = 0, faturamentoHoje = 0, faturamentoSemana = 0;
  let maiorVenda = 0, lucroTotal = 0, custoTotal = 0;
  const pagamentos = { pix: 0, credito: 0, debito: 0, dinheiro: 0, outros: 0 };
  const produtosVendidos = {}, produtosLucrativos = {}, vendasPorHora = {}, vendasPorDiaSemana = {}, categorias = {};

  for (const pedido of pedidosSemana) faturamentoSemana += numero(pedido.total);

  for (const pedido of pedidosMes) {
    const total = numero(pedido.total);
    const partes = partesSaoPaulo(pedido.createdAt);
    faturamentoMes += total;
    if (new Date(pedido.createdAt) >= inicioHoje) faturamentoHoje += total;
    maiorVenda = Math.max(maiorVenda, total);

    const hora = `${String(partes.hora).padStart(2, "0")}h`;
    vendasPorHora[hora] = numero(vendasPorHora[hora]) + total;
    const nomesDias = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
    const dia = nomesDias[partes.semana];
    vendasPorDiaSemana[dia] = numero(vendasPorDiaSemana[dia]) + total;

    for (const p of pagamentosDoPedido(pedido)) {
      if (p.forma === "PIX") pagamentos.pix += p.valor;
      else if (["CREDITO", "CRÉDITO"].includes(p.forma)) pagamentos.credito += p.valor;
      else if (["DEBITO", "DÉBITO"].includes(p.forma)) pagamentos.debito += p.valor;
      else if (p.forma === "DINHEIRO") pagamentos.dinheiro += p.valor;
      else pagamentos.outros += p.valor;
    }

    for (const item of pedido.produtos || []) {
      const nome = item.nome || "Produto";
      const quantidade = numero(item.quantidade || 1);
      const preco = numero(item.precoUnitario ?? item.preco);
      const custo = numero(item.custoNaVenda ?? item.custo);
      const categoria = item.categoria || "Sem categoria";
      produtosVendidos[nome] = numero(produtosVendidos[nome]) + quantidade;
      categorias[categoria] = numero(categorias[categoria]) + preco * quantidade;
      custoTotal += custo * quantidade;
      const lucro = (preco - custo) * quantidade;
      lucroTotal += lucro;
      produtosLucrativos[nome] = numero(produtosLucrativos[nome]) + lucro;
    }
  }

  const totalPedidos = pedidosMes.length;
  const ticketMedio = totalPedidos ? faturamentoMes / totalPedidos : 0;
  const margemLucro = faturamentoMes ? (lucroTotal / faturamentoMes) * 100 : 0;
  const topProdutos = Object.entries(produtosVendidos).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([nome,quantidade])=>({nome,quantidade}));
  const topProdutosLucrativos = Object.entries(produtosLucrativos).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([nome,lucro])=>({nome,lucro:Number(lucro.toFixed(2))}));
  const topCategorias = Object.entries(categorias).sort((a,b)=>b[1]-a[1]).map(([nome,valor])=>({nome,valor:Number(valor.toFixed(2))}));
  const insights = [];
  if (!totalPedidos) insights.push("Nenhuma venda registrada no mês atual.");
  else if (ticketMedio < 50) insights.push("O ticket médio do mês está abaixo de R$ 50,00. Avalie combos e adicionais no PDV.");
  if (topProdutos[0]) insights.push(`O produto mais vendido no mês é ${topProdutos[0].nome}.`);

  return {
    periodo: { inicio: inicioMes, fim: agora, tipo: "mes_atual" },
    faturamento: faturamentoMes, faturamentoHoje, faturamentoSemana, faturamentoMes,
    totalPedidos, totalProdutos: produtos.length, totalClientes, ticketMedio, maiorVenda,
    custoTotal, lucroTotal, margemLucro, pagamentos, topProdutos, topProdutosLucrativos,
    topCategorias, topClientes: clientes.map(c=>({nome:c.nome,telefone:c.telefone,gasto:numero(c.gasto),clube:c.clube,pontos:numero(c.pontos),cashback:numero(c.cashback)})),
    vendasPorHora, vendasPorDiaSemana, ia: { insights },
  };
}
module.exports = { gerarBI };
