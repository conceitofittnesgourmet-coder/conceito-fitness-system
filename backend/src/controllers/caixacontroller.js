const Caixa = require("../models/caixa");
const Pedido = require("../models/pedido");
const {
  filtroEmpresa,
  filtroVendaValida,
  inicioDiaSaoPaulo,
  resumirPedidos,
} = require("../services/vendasMetricsService");

function filtroDoUsuario(req) {
  return filtroEmpresa(req);
}

async function buscarPedidosDoCaixa(caixa, req) {
  if (!caixa) return [];
  const fim = caixa.fechadoEm || new Date();
  return Pedido.find({
    ...filtroDoUsuario(req),
    ...filtroVendaValida(),
    $or: [
      { caixa: caixa._id },
      { caixa: null, createdAt: { $gte: caixa.abertoEm, $lte: fim } },
      { caixa: { $exists: false }, createdAt: { $gte: caixa.abertoEm, $lte: fim } },
    ],
  }).sort({ createdAt: -1 });
}

exports.caixaAtual = async (req, res) => {
  try {
    const caixa = await Caixa.findOne({ ...filtroDoUsuario(req), status: "aberto" }).sort({ abertoEm: -1 });
    return res.json({ success: true, caixa });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.abrirCaixa = async (req, res) => {
  try {
    const filtro = filtroDoUsuario(req);
    const caixaAberto = await Caixa.findOne({ ...filtro, status: "aberto" });
    if (caixaAberto) return res.status(400).json({ success: false, message: "Já existe um caixa aberto." });

    const caixa = await Caixa.create({
      ...filtro,
      saldoInicial: Number(req.body.saldoInicial || 0),
      operador: req.body.operador || req.usuario?.nome || "Administrador",
      status: "aberto",
      abertoEm: new Date(),
    });
    return res.status(201).json({ success: true, caixa });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.fecharCaixa = async (req, res) => {
  try {
    const caixa = await Caixa.findOne({ ...filtroDoUsuario(req), status: "aberto" }).sort({ abertoEm: -1 });
    if (!caixa) return res.status(404).json({ success: false, message: "Nenhum caixa aberto encontrado." });

    const pedidos = await buscarPedidosDoCaixa(caixa, req);
    const vendas = resumirPedidos(pedidos);
    const totalSangrias = (caixa.sangrias || []).reduce((a, s) => a + Number(s.valor || 0), 0);
    const totalSuprimentos = (caixa.suprimentos || []).reduce((a, s) => a + Number(s.valor || 0), 0);
    const saldoEsperado = Number(caixa.saldoInicial || 0) + vendas.dinheiro + totalSuprimentos - totalSangrias;
    const valorContado = Number(req.body.valorContado || 0);

    Object.assign(caixa, {
      totalVendas: vendas.total,
      totalPix: vendas.pix,
      totalCredito: vendas.credito,
      totalDebito: vendas.debito,
      totalDinheiro: vendas.dinheiro,
      totalOutros: vendas.outros,
      quantidadePedidos: vendas.quantidadePedidos,
      ticketMedio: vendas.ticketMedio,
      maiorVenda: vendas.maiorVenda,
      valorContado,
      diferencaFechamento: valorContado - saldoEsperado,
      observacaoFechamento: req.body.observacao || "",
      status: "fechado",
      fechadoEm: new Date(),
    });
    await caixa.save();
    return res.json({ success: true, caixa, resumo: { ...vendas, totalSangrias, totalSuprimentos, saldoAtual: saldoEsperado } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.registrarSangria = async (req, res) => {
  try {
    const caixa = await Caixa.findOne({ ...filtroDoUsuario(req), status: "aberto" });
    if (!caixa) return res.status(404).json({ success: false, message: "Nenhum caixa aberto." });
    caixa.sangrias.push({ valor: Number(req.body.valor || 0), motivo: req.body.motivo || "Sangria" });
    await caixa.save();
    return res.json({ success: true, caixa });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.registrarSuprimento = async (req, res) => {
  try {
    const caixa = await Caixa.findOne({ ...filtroDoUsuario(req), status: "aberto" });
    if (!caixa) return res.status(404).json({ success: false, message: "Nenhum caixa aberto." });
    caixa.suprimentos.push({ valor: Number(req.body.valor || 0), motivo: req.body.motivo || "Suprimento" });
    await caixa.save();
    return res.json({ success: true, caixa });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.resumoCaixa = async (req, res) => {
  try {
    const filtro = filtroDoUsuario(req);
    const caixa = await Caixa.findOne({ ...filtro, status: "aberto" }).sort({ abertoEm: -1 });
    if (!caixa) {
      return res.json({ success: true, caixa: null, pedidos: [], resumo: { total: 0, pix: 0, credito: 0, debito: 0, dinheiro: 0, outros: 0, quantidadePedidos: 0, ticketMedio: 0, maiorVenda: 0, totalSangrias: 0, totalSuprimentos: 0, saldoAtual: 0 } });
    }
    const pedidos = await buscarPedidosDoCaixa(caixa, req);
    const vendas = resumirPedidos(pedidos);
    const totalSangrias = (caixa.sangrias || []).reduce((a, s) => a + Number(s.valor || 0), 0);
    const totalSuprimentos = (caixa.suprimentos || []).reduce((a, s) => a + Number(s.valor || 0), 0);
    return res.json({
      success: true, caixa, pedidos,
      resumo: { ...vendas, totalSangrias, totalSuprimentos, saldoAtual: Number(caixa.saldoInicial || 0) + vendas.dinheiro + totalSuprimentos - totalSangrias },
    });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.historicoCaixas = async (req, res) => {
  try {
    const caixas = await Caixa.find(filtroDoUsuario(req)).sort({ abertoEm: -1 }).limit(50);
    return res.json({ success: true, caixas });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
