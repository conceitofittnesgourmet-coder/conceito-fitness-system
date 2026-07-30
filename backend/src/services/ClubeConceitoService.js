const Cliente = require("../models/cliente");
const ClubeConfiguracao = require("../models/clubeconfiguracao");
const MovimentoClube = require("../models/movimentoclube");
const AssinaturaClube = require("../models/assinaturaclube");
const Gamificacao = require("./ClubeGamificacaoService");

function telefoneNumeros(valor) { return String(valor || "").replace(/\D/g, ""); }
function numeroAssociado(cliente) { return `CC-${String(cliente._id).slice(-8).toUpperCase()}`; }

async function obterConfiguracao() {
  let config = await ClubeConfiguracao.findOne({ chave: "principal" });
  if (!config) config = await ClubeConfiguracao.create({ chave: "principal" });
  return config;
}

function nivelPorGasto(config, gasto) {
  return [...(config.niveis || [])].sort((a,b) => b.gastoMinimo-a.gastoMinimo)
    .find((n) => Number(gasto || 0) >= Number(n.gastoMinimo || 0)) || config.niveis?.[0];
}

async function prepararCarteira(cliente) {
  const config = await obterConfiguracao();
  const nivel = nivelPorGasto(config, cliente.gasto);
  let mudou = false;
  if (!cliente.numeroAssociado) { cliente.numeroAssociado = numeroAssociado(cliente); mudou = true; }
  if (!cliente.dataAdesaoClube) { cliente.dataAdesaoClube = new Date(); mudou = true; }
  if (!cliente.membroClube && config.adesaoAutomatica) { cliente.membroClube = true; mudou = true; }
  if (nivel?.nome && cliente.clube !== nivel.nome) { cliente.clube = nivel.nome; mudou = true; }
  if (mudou) await cliente.save();
  const proximo = [...config.niveis].sort((a,b)=>a.gastoMinimo-b.gastoMinimo).find(n => n.gastoMinimo > Number(cliente.gasto || 0));
  const assinatura = await AssinaturaClube.findOne({ cliente: cliente._id, status: "ativa", vencimento: { $gte: new Date() } }).populate("plano").lean();
  return {
    cliente: { id: cliente._id, nome: cliente.nome, telefone: cliente.telefone, numeroAssociado: cliente.numeroAssociado, membroClube: cliente.membroClube, dataAdesao: cliente.dataAdesaoClube },
    programa: config.nomePrograma,
    nivel: nivel || null,
    pontos: Number(cliente.pontos || 0),
    cashback: Number(cliente.cashback || 0),
    gastoAcumulado: Number(cliente.gasto || 0),
    proximoNivel: proximo ? { nome: proximo.nome, gastoMinimo: proximo.gastoMinimo, falta: Math.max(0, proximo.gastoMinimo - Number(cliente.gasto || 0)) } : null,
    assinatura: assinatura ? { id: assinatura._id, status: assinatura.status, inicio: assinatura.inicio, vencimento: assinatura.vencimento, renovacaoAutomatica: assinatura.renovacaoAutomatica, plano: assinatura.plano } : null,
  };
}

async function carteiraPorTelefone(telefone) {
  const cliente = await Cliente.findOne({ telefone: telefoneNumeros(telefone) });
  if (!cliente) return null;
  const carteira = await prepararCarteira(cliente);
  const [movimentos, missoes] = await Promise.all([
    MovimentoClube.find({ cliente: cliente._id }).sort({ createdAt: -1 }).limit(20).lean(),
    Gamificacao.missoesDoCliente(cliente._id),
  ]);
  return { ...carteira, movimentos, gamificacao: { missoes, concluidas: missoes.filter(m => m.concluida).length } };
}

async function painel() {
  const config = await obterConfiguracao();
  const clientes = await Cliente.find({ ativo: { $ne: false } }).sort({ gasto: -1 }).limit(200);
  const carteiras = await Promise.all(clientes.map(prepararCarteira));
  return {
    configuracao: config,
    indicadores: {
      membros: carteiras.filter(c => c.cliente.membroClube).length,
      pontosEmCirculacao: carteiras.reduce((s,c)=>s+c.pontos,0),
      cashbackEmCirculacao: carteiras.reduce((s,c)=>s+c.cashback,0),
      gastoAcumulado: carteiras.reduce((s,c)=>s+c.gastoAcumulado,0),
    },
    membros: carteiras,
  };
}

module.exports = { obterConfiguracao, prepararCarteira, carteiraPorTelefone, painel, nivelPorGasto };
