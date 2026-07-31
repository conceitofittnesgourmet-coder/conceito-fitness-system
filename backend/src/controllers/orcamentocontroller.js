const ConversaoOrcamentoService = require("../services/ConversaoOrcamentoService");
const Orcamento = require("../models/orcamento");

function gerarNumero() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const aleatorio = Math.floor(1000 + Math.random() * 9000);
  return `ORC-${ano}-${Date.now().toString().slice(-6)}${aleatorio}`;
}

exports.listar = async (req, res, next) => {
  try {
    const filtro = {};
    if (req.query.status) filtro.status = req.query.status;
    if (req.query.busca) {
      const busca = new RegExp(String(req.query.busca).trim(), "i");
      filtro.$or = [{ numero: busca }, { cliente: busca }, { telefone: busca }];
    }
    const orcamentos = await Orcamento.find(filtro).sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, orcamentos });
  } catch (error) { next(error); }
};

exports.buscar = async (req, res, next) => {
  try {
    const orcamento = await Orcamento.findById(req.params.id);
    if (!orcamento) return res.status(404).json({ success: false, message: "Orçamento não encontrado" });
    res.json({ success: true, orcamento });
  } catch (error) { next(error); }
};

exports.criar = async (req, res, next) => {
  try {
    const orcamento = await Orcamento.create({ ...req.body, numero: req.body.numero || gerarNumero(), timeline: [{ tipo: "criado", titulo: "Orçamento criado", descricao: "Orçamento registrado no sistema.", usuario: req.usuario?.nome || req.usuario?.email || "Sistema" }] });
    res.status(201).json({ success: true, message: "Orçamento criado", orcamento });
  } catch (error) { next(error); }
};

exports.atualizar = async (req, res, next) => {
  try {
    const orcamento = await Orcamento.findById(req.params.id);
    if (!orcamento) return res.status(404).json({ success: false, message: "Orçamento não encontrado" });
    Object.assign(orcamento, req.body, { numero: orcamento.numero });
    if (req.body.status === "aprovado" && !orcamento.aprovadoEm) orcamento.aprovadoEm = new Date();
    orcamento.timeline.push({ tipo: "atualizado", titulo: "Orçamento atualizado", descricao: req.body.status ? `Status alterado para ${req.body.status}.` : "Dados do orçamento atualizados.", usuario: req.usuario?.nome || req.usuario?.email || "Sistema" });
    await orcamento.save();
    res.json({ success: true, message: "Orçamento atualizado", orcamento });
  } catch (error) { next(error); }
};

exports.excluir = async (req, res, next) => {
  try {
    const orcamento = await Orcamento.findById(req.params.id);
    if (!orcamento) return res.status(404).json({ success: false, message: "Orçamento não encontrado" });
    if (["aprovado", "convertido"].includes(orcamento.status)) {
      return res.status(409).json({ success: false, message: "Orçamento aprovado ou convertido não pode ser excluído" });
    }
    await orcamento.deleteOne();
    res.json({ success: true, message: "Orçamento excluído" });
  } catch (error) { next(error); }
};

exports.resumo = async (req, res, next) => {
  try {
    const [totais] = await Orcamento.aggregate([
      { $group: { _id: null, quantidade: { $sum: 1 }, valorTotal: { $sum: "$total" }, aprovados: { $sum: { $cond: [{ $in: ["$status", ["aprovado", "convertido"]] }, 1, 0] } }, pendentes: { $sum: { $cond: [{ $in: ["$status", ["rascunho", "enviado"]] }, 1, 0] } } } }
    ]);
    res.json({ success: true, resumo: totais || { quantidade: 0, valorTotal: 0, aprovados: 0, pendentes: 0 } });
  } catch (error) { next(error); }
};

exports.inspecionarConversao = async (req, res, next) => {
  try {
    const resultado = await ConversaoOrcamentoService.inspecionar(req.params.id, req.usuario?.empresa);
    res.json({ success: true, ...resultado });
  } catch (error) { next(error); }
};

exports.converter = async (req, res, next) => {
  try {
    const resultado = await ConversaoOrcamentoService.converter({ id: req.params.id, empresa: req.usuario?.empresa, usuario: req.usuario, dados: req.body || {} });
    res.status(201).json({ success: true, message: "Orçamento convertido com sucesso.", ...resultado });
  } catch (error) {
    if (error.detalhes) return res.status(error.statusCode || 400).json({ success: false, message: error.message, validacao: error.detalhes });
    next(error);
  }
};
