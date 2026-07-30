const Cliente = require("../models/cliente");
const MissaoClube = require("../models/missaoclube");
const ProgressoMissaoClube = require("../models/progressomissaoclube");
const MovimentoClube = require("../models/movimentoclube");

function telefoneNumeros(v) { return String(v || "").replace(/\D/g, ""); }
function cicloDaMissao(missao, data = new Date()) {
  if (!missao.recorrente) return "unico";
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}
function vigente(m, agora = new Date()) { return m.ativo && (!m.inicio || m.inicio <= agora) && (!m.fim || m.fim >= agora); }
function incremento(missao, evento) {
  const itens = Array.isArray(evento.itens) ? evento.itens : [];
  if (missao.criterio === "quantidade_compras") return 1;
  if (missao.criterio === "valor_acumulado") return Math.max(0, Number(evento.valor || 0));
  if (missao.criterio === "quantidade_itens") return itens.reduce((s, i) => s + Number(i.quantidade || 0), 0);
  if (missao.criterio === "produto_especifico") return itens.filter(i => String(i.produtoId || "") === String(missao.produtoId || "")).reduce((s, i) => s + Number(i.quantidade || 0), 0);
  if (missao.criterio === "categoria_especifica") return itens.filter(i => String(i.categoria || "").toLowerCase() === String(missao.categoriaProduto || "").toLowerCase()).reduce((s, i) => s + Number(i.quantidade || 0), 0);
  if (missao.criterio === "dias_com_compra") return 1;
  return 0;
}
async function entregarRecompensa(cliente, missao, progresso) {
  if (progresso.recompensaEntregue) return;
  const r = missao.recompensa || {};
  let pontos = 0, cashback = 0;
  if (r.tipo === "pontos") pontos = Math.max(0, Number(r.valor || 0));
  if (r.tipo === "cashback") cashback = Math.max(0, Number(r.valor || 0));
  if (pontos || cashback) {
    cliente.pontos = Number(cliente.pontos || 0) + pontos;
    cliente.cashback = Number(cliente.cashback || 0) + cashback;
    await cliente.save();
    await MovimentoClube.create({ cliente: cliente._id, tipo: "missao", pontos, cashback, descricao: `Missão concluída: ${missao.nome}`, origem: "gamificacao" });
  }
  progresso.recompensaEntregue = true;
  progresso.recompensaEntregueEm = new Date();
  await progresso.save();
}
async function processarEvento({ clienteId, telefone, valor = 0, itens = [], pedidoId = null }) {
  const cliente = clienteId ? await Cliente.findById(clienteId) : await Cliente.findOne({ telefone: telefoneNumeros(telefone) });
  if (!cliente) return { clienteEncontrado: false, atualizadas: [] };
  const agora = new Date();
  const missoes = (await MissaoClube.find({ ativo: true })).filter(m => vigente(m, agora));
  const atualizadas = [];
  for (const missao of missoes) {
    const inc = incremento(missao, { valor, itens, pedidoId });
    if (inc <= 0) continue;
    const ciclo = cicloDaMissao(missao, agora);
    let progresso = await ProgressoMissaoClube.findOne({ cliente: cliente._id, missao: missao._id, ciclo });
    if (!progresso) progresso = new ProgressoMissaoClube({ cliente: cliente._id, missao: missao._id, ciclo });
    if (progresso.concluida) continue;
    progresso.progresso = Math.min(Number(missao.meta), Number(progresso.progresso || 0) + inc);
    if (progresso.progresso >= Number(missao.meta)) { progresso.concluida = true; progresso.concluidaEm = agora; }
    await progresso.save();
    if (progresso.concluida) await entregarRecompensa(cliente, missao, progresso);
    atualizadas.push({ missao: missao.nome, progresso: progresso.progresso, meta: missao.meta, concluida: progresso.concluida });
  }
  return { clienteEncontrado: true, clienteId: cliente._id, atualizadas };
}
async function missoesDoCliente(clienteId) {
  const agora = new Date();
  const missoes = (await MissaoClube.find({ ativo: true }).sort({ createdAt: -1 }).lean()).filter(m => vigente(m, agora));
  const ids = missoes.map(m => m._id);
  const progressos = await ProgressoMissaoClube.find({ cliente: clienteId, missao: { $in: ids } }).lean();
  const mapa = new Map(progressos.map(p => [`${p.missao}:${p.ciclo}`, p]));
  return missoes.map(m => {
    const ciclo = cicloDaMissao(m, agora);
    const p = mapa.get(`${m._id}:${ciclo}`) || {};
    const valor = Number(p.progresso || 0), meta = Number(m.meta || 1);
    return { ...m, progresso: valor, concluida: Boolean(p.concluida), percentual: Math.min(100, Math.round((valor / meta) * 100)), recompensaEntregue: Boolean(p.recompensaEntregue) };
  });
}
async function ranking(limite = 20) {
  return Cliente.find({ ativo: { $ne: false }, membroClube: true }).select("nome telefone pontos gasto clube numeroAssociado").sort({ pontos: -1, gasto: -1 }).limit(limite).lean();
}
module.exports = { processarEvento, missoesDoCliente, ranking };
