const OrdemProducao = require("../models/ordemproducao");
const Produto = require("../models/produto");
const FichaTecnica = require("../models/fichatecnica");

const TRANSICOES = {
  aberta: ["em_producao", "cancelada"],
  em_producao: ["concluida", "cancelada"],
  concluida: [],
  cancelada: [],
};

function erro(mensagem, statusCode = 400) {
  const e = new Error(mensagem);
  e.statusCode = statusCode;
  return e;
}

function usuarioNome(usuario) {
  return usuario?.nome || usuario?.email || "Sistema";
}

function gerarCodigo() {
  const agora = new Date();
  const data = agora.toISOString().slice(0, 10).replace(/-/g, "");
  const sufixo = `${agora.getTime()}`.slice(-6);
  const aleatorio = Math.floor(Math.random() * 90 + 10);
  return `OP-${data}-${sufixo}${aleatorio}`;
}

async function listar({ empresa, status, busca, limite = 100 } = {}) {
  const filtro = {};
  if (empresa) filtro.empresa = empresa;
  if (status) filtro.status = status;
  if (busca) {
    const produtos = await Produto.find({ nome: { $regex: busca, $options: "i" } }).select("_id").lean();
    filtro.$or = [
      { codigo: { $regex: busca, $options: "i" } },
      { responsavel: { $regex: busca, $options: "i" } },
      { produto: { $in: produtos.map((p) => p._id) } },
    ];
  }

  return OrdemProducao.find(filtro)
    .populate("produto", "nome sku estoque preco foto")
    .populate("fichaTecnica", "rendimento unidadeRendimento custoUnitario")
    .sort({ prioridade: -1, createdAt: -1 })
    .limit(Math.min(Math.max(Number(limite) || 100, 1), 300))
    .lean();
}

async function resumo({ empresa } = {}) {
  const match = empresa ? { empresa } : {};
  const dados = await OrdemProducao.aggregate([
    { $match: match },
    { $group: { _id: "$status", total: { $sum: 1 }, quantidade: { $sum: "$quantidadePlanejada" } } },
  ]);
  const saida = { aberta: 0, em_producao: 0, concluida: 0, cancelada: 0, totalAtivas: 0 };
  dados.forEach((item) => { if (Object.prototype.hasOwnProperty.call(saida, item._id)) saida[item._id] = item.total; });
  saida.totalAtivas = saida.aberta + saida.em_producao;
  return saida;
}

async function buscarPorId(id, empresa) {
  const filtro = { _id: id };
  if (empresa) filtro.empresa = empresa;
  const ordem = await OrdemProducao.findOne(filtro)
    .populate("produto", "nome sku estoque preco")
    .populate("fichaTecnica");
  if (!ordem) throw erro("Ordem de produção não encontrada.", 404);
  return ordem;
}

async function criar({ dados, empresa, usuario } = {}) {
  const quantidade = Number(dados.quantidadePlanejada);
  if (!dados.produto) throw erro("Selecione o produto da ordem de produção.");
  if (!Number.isFinite(quantidade) || quantidade <= 0) throw erro("Informe uma quantidade planejada maior que zero.");

  const produto = await Produto.findById(dados.produto);
  if (!produto) throw erro("Produto não encontrado.", 404);

  const ficha = await FichaTecnica.findOne({ produto: produto._id, ativa: true }).sort({ updatedAt: -1 });
  const ordem = await OrdemProducao.create({
    empresa: empresa || produto.empresa || null,
    codigo: gerarCodigo(),
    produto: produto._id,
    fichaTecnica: ficha?._id || null,
    quantidadePlanejada: quantidade,
    unidade: dados.unidade || ficha?.unidadeRendimento || "UN",
    responsavel: String(dados.responsavel || "").trim(),
    prioridade: Math.min(Math.max(Number(dados.prioridade) || 0, 0), 10),
    dataPlanejada: dados.dataPlanejada || null,
    observacoes: String(dados.observacoes || "").trim(),
    historico: [{ usuario: usuarioNome(usuario), acao: "ordem_criada", statusNovo: "aberta", observacao: "Ordem de produção criada." }],
  });
  return buscarPorId(ordem._id, empresa);
}

async function atualizar(id, dados, empresa, usuario) {
  const ordem = await buscarPorId(id, empresa);
  if (["concluida", "cancelada"].includes(ordem.status)) throw erro("Ordens concluídas ou canceladas não podem ser editadas.", 409);
  if (dados.quantidadePlanejada !== undefined) {
    const quantidade = Number(dados.quantidadePlanejada);
    if (!Number.isFinite(quantidade) || quantidade <= 0) throw erro("A quantidade planejada deve ser maior que zero.");
    ordem.quantidadePlanejada = quantidade;
  }
  ["responsavel", "unidade", "observacoes"].forEach((campo) => {
    if (dados[campo] !== undefined) ordem[campo] = String(dados[campo] || "").trim();
  });
  if (dados.prioridade !== undefined) ordem.prioridade = Math.min(Math.max(Number(dados.prioridade) || 0, 0), 10);
  if (dados.dataPlanejada !== undefined) ordem.dataPlanejada = dados.dataPlanejada || null;
  ordem.historico.push({ usuario: usuarioNome(usuario), acao: "ordem_editada", statusNovo: ordem.status, observacao: "Dados da ordem atualizados." });
  ordem.historico = ordem.historico.slice(-100);
  await ordem.save();
  return buscarPorId(ordem._id, empresa);
}

async function alterarStatus(id, novoStatus, dados, empresa, usuario) {
  const ordem = await buscarPorId(id, empresa);
  const destino = String(novoStatus || "").trim().toLowerCase();
  if (!TRANSICOES[ordem.status]?.includes(destino)) throw erro(`Não é permitido alterar a ordem de "${ordem.status}" para "${destino}".`, 409);

  const anterior = ordem.status;
  const agora = new Date();
  ordem.status = destino;
  if (destino === "em_producao") ordem.iniciadaEm = agora;
  if (destino === "concluida") {
    const produzida = Number(dados.quantidadeProduzida ?? ordem.quantidadePlanejada);
    if (!Number.isFinite(produzida) || produzida <= 0) throw erro("Informe a quantidade efetivamente produzida.");
    ordem.quantidadeProduzida = produzida;
    ordem.concluidaEm = agora;
  }
  if (destino === "cancelada") {
    const motivo = String(dados.motivoCancelamento || "").trim();
    if (!motivo) throw erro("Informe o motivo do cancelamento.");
    ordem.motivoCancelamento = motivo;
    ordem.canceladaEm = agora;
  }
  ordem.historico.push({
    usuario: usuarioNome(usuario),
    acao: destino === "cancelada" ? "ordem_cancelada" : "status_alterado",
    statusAnterior: anterior,
    statusNovo: destino,
    observacao: destino === "cancelada" ? ordem.motivoCancelamento : String(dados.observacao || "").trim(),
  });
  ordem.historico = ordem.historico.slice(-100);
  await ordem.save();
  return buscarPorId(ordem._id, empresa);
}

module.exports = { listar, resumo, buscarPorId, criar, atualizar, alterarStatus };
