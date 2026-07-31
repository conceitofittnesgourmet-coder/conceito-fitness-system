const mongoose = require("mongoose");
const Produto = require("../models/produto");
const GrupoComponente = require("../models/grupocomponente");
const OpcaoComponente = require("../models/opcaocomponente");

function idTexto(valor) {
  if (!valor) return "";
  if (typeof valor === "string") return valor;
  return String(valor._id || valor.id || valor);
}

function numero(valor, padrao = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : padrao;
}

function booleano(valor, padrao = false) {
  if (valor === undefined || valor === null || valor === "") return padrao;
  if (typeof valor === "boolean") return valor;
  return ["true", "1", "sim", "yes"].includes(String(valor).toLowerCase());
}

function idsUnicos(valores = []) {
  return [...new Set((Array.isArray(valores) ? valores : []).map(idTexto).filter(Boolean))];
}

async function carregarCatalogo() {
  const [grupos, opcoes] = await Promise.all([
    GrupoComponente.find({}).sort({ ordem: 1, nome: 1 }).lean(),
    OpcaoComponente.find({}).sort({ ordem: 1, nome: 1 }).lean(),
  ]);

  const opcoesPorGrupo = new Map();
  for (const opcao of opcoes) {
    const chave = idTexto(opcao.grupo);
    if (!opcoesPorGrupo.has(chave)) opcoesPorGrupo.set(chave, []);
    opcoesPorGrupo.get(chave).push(opcao);
  }

  return { grupos, opcoes, opcoesPorGrupo };
}

function montarConfigPadrao(grupo) {
  return {
    grupoId: grupo._id,
    nome: grupo.nome,
    tipo: grupo.tipo || "personalizado",
    obrigatorio: Boolean(grupo.obrigatorio),
    minimoEscolhas: numero(grupo.minimoEscolhas, 0),
    maximoEscolhas: Math.max(1, numero(grupo.maximoEscolhas, 1)),
    ordem: numero(grupo.ordem, 0),
    mostrarPDV: grupo.canais?.pdv !== false,
    mostrarCardapio: grupo.canais?.cardapio !== false,
    mostrarPWA: grupo.canais?.pwa !== false,
    regraPreco: "sem_alteracao",
    valorPreco: 0,
    opcoesPermitidas: [],
    opcoesPadrao: [],
  };
}

async function normalizarConfiguracao(payload = {}) {
  const { grupos, opcoesPorGrupo } = await carregarCatalogo();
  const gruposMap = new Map(grupos.map((g) => [idTexto(g._id), g]));
  const gruposSelecionados = idsUnicos(payload.gruposComponentes);
  const configsRecebidas = Array.isArray(payload.configuracaoGrupos)
    ? payload.configuracaoGrupos
    : [];
  const configMap = new Map(
    configsRecebidas.map((c) => [idTexto(c.grupoId), c])
  );

  const configuracaoGrupos = [];
  for (const grupoId of gruposSelecionados) {
    if (!mongoose.isValidObjectId(grupoId)) {
      throw new Error(`Grupo inválido: ${grupoId}`);
    }
    const grupo = gruposMap.get(grupoId);
    if (!grupo) throw new Error("Um dos grupos selecionados não existe.");

    const recebido = configMap.get(grupoId) || {};
    const base = montarConfigPadrao(grupo);
    const opcoesGrupo = opcoesPorGrupo.get(grupoId) || [];
    const opcoesMap = new Map(opcoesGrupo.map((o) => [idTexto(o._id), o]));

    let permitidas = idsUnicos(recebido.opcoesPermitidas);
    if (permitidas.length) {
      permitidas = permitidas.filter((id) => opcoesMap.has(id));
      if (permitidas.length !== idsUnicos(recebido.opcoesPermitidas).length) {
        throw new Error(`Há opções inválidas no grupo ${grupo.nome}.`);
      }
    }

    const universoPadrao = permitidas.length ? new Set(permitidas) : new Set(opcoesGrupo.map((o) => idTexto(o._id)));
    const padrao = idsUnicos(recebido.opcoesPadrao).filter((id) => universoPadrao.has(id));

    let minimo = Math.max(0, numero(recebido.minimoEscolhas, base.minimoEscolhas));
    let maximo = Math.max(1, numero(recebido.maximoEscolhas, base.maximoEscolhas));
    const obrigatorio = booleano(recebido.obrigatorio, base.obrigatorio);
    if (obrigatorio && minimo < 1) minimo = 1;
    if (grupo.tipoSelecao === "unica") maximo = 1;
    if (minimo > maximo) minimo = maximo;
    if (permitidas.length && maximo > permitidas.length) maximo = permitidas.length;
    if (permitidas.length && minimo > permitidas.length) minimo = permitidas.length;

    const regraPrecoPermitida = ["sem_alteracao", "somar", "substituir", "percentual"].includes(recebido.regraPreco)
      ? recebido.regraPreco
      : "sem_alteracao";

    configuracaoGrupos.push({
      grupoId: grupo._id,
      nome: grupo.nome,
      tipo: grupo.tipo || "personalizado",
      obrigatorio,
      minimoEscolhas: minimo,
      maximoEscolhas: maximo,
      ordem: numero(recebido.ordem, base.ordem),
      mostrarPDV: booleano(recebido.mostrarPDV, base.mostrarPDV),
      mostrarCardapio: booleano(recebido.mostrarCardapio, base.mostrarCardapio),
      mostrarPWA: booleano(recebido.mostrarPWA, base.mostrarPWA),
      regraPreco: regraPrecoPermitida,
      valorPreco: numero(recebido.valorPreco, 0),
      opcoesPermitidas: permitidas,
      opcoesPadrao: padrao,
    });
  }

  configuracaoGrupos.sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"));
  return {
    gruposComponentes: gruposSelecionados,
    configuracaoGrupos,
    configuravel: gruposSelecionados.length > 0,
    permiteMontagemCliente: gruposSelecionados.length > 0 && booleano(payload.permiteMontagemCliente, true),
    permiteObservacao: booleano(payload.permiteObservacao, true),
  };
}

async function buscarConfiguracao(produtoId) {
  const produto = await Produto.findById(produtoId)
    .populate("gruposComponentes")
    .populate("configuracaoGrupos.grupoId")
    .populate("configuracaoGrupos.opcoesPermitidas")
    .populate("configuracaoGrupos.opcoesPadrao")
    .lean();
  if (!produto) throw Object.assign(new Error("Produto não encontrado."), { status: 404 });
  const catalogo = await carregarCatalogo();
  return {
    produto,
    grupos: catalogo.grupos,
    opcoes: catalogo.opcoes,
  };
}

async function salvarConfiguracao(produtoId, payload, usuario = "Administrador") {
  const produto = await Produto.findById(produtoId);
  if (!produto) throw Object.assign(new Error("Produto não encontrado."), { status: 404 });

  const dados = await normalizarConfiguracao(payload);
  produto.gruposComponentes = dados.gruposComponentes;
  produto.configuracaoGrupos = dados.configuracaoGrupos;
  produto.configuravel = dados.configuravel;
  produto.permiteMontagemCliente = dados.permiteMontagemCliente;
  produto.permiteObservacao = dados.permiteObservacao;
  produto.markModified("configuracaoGrupos");
  await produto.save();

  const retorno = await buscarConfiguracao(produtoId);
  return {
    ...retorno,
    atualizadoPor: usuario,
  };
}

async function copiarConfiguracao(origemId, destinoId, usuario = "Administrador") {
  if (origemId === destinoId) throw new Error("Escolha produtos diferentes para copiar a configuração.");
  const origem = await Produto.findById(origemId).lean();
  if (!origem) throw Object.assign(new Error("Produto de origem não encontrado."), { status: 404 });
  return salvarConfiguracao(destinoId, {
    gruposComponentes: origem.gruposComponentes || [],
    configuracaoGrupos: origem.configuracaoGrupos || [],
    permiteMontagemCliente: origem.permiteMontagemCliente,
    permiteObservacao: origem.permiteObservacao,
  }, usuario);
}

module.exports = {
  buscarConfiguracao,
  salvarConfiguracao,
  copiarConfiguracao,
  normalizarConfiguracao,
};
