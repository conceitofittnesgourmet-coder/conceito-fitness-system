const mongoose = require("mongoose");
const GrupoComponente = require("../models/grupocomponente");
const OpcaoComponente = require("../models/opcaocomponente");

function id(valor) {
  if (!valor) return "";
  return String(valor._id || valor.id || valor);
}

function numeroPositivo(valor, padrao = 1) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : padrao;
}

function configuracaoProduto(produto, grupoId) {
  return (produto.configuracaoGrupos || []).find(
    (config) => id(config.grupoId) === id(grupoId)
  );
}

function limitesGrupo(grupo, config) {
  const obrigatorio = config?.obrigatorio ?? grupo.obrigatorio ?? false;
  const minimoBase = Number(
    config?.minimoEscolhas ?? grupo.minimoEscolhas ?? 0
  );
  const minimo = obrigatorio ? Math.max(1, minimoBase) : Math.max(0, minimoBase);
  const maximo = Math.max(
    minimo,
    Number(config?.maximoEscolhas ?? grupo.maximoEscolhas ?? 1)
  );

  return { obrigatorio, minimo, maximo };
}

async function validarPersonalizacao(produto, configuracoesRecebidas = []) {
  const listaRecebida = Array.isArray(configuracoesRecebidas)
    ? configuracoesRecebidas
    : [];

  for (const item of listaRecebida) {
    if (!mongoose.isValidObjectId(id(item.grupoId)) || !mongoose.isValidObjectId(id(item.opcaoId))) {
      throw new Error("Personalização recebida com identificador inválido.");
    }
  }

  const gruposProduto = new Set((produto.gruposComponentes || []).map(id));
  const gruposIds = [...new Set(listaRecebida.map((item) => id(item.grupoId)))];
  const opcoesIds = [...new Set(listaRecebida.map((item) => id(item.opcaoId)))];

  const [grupos, opcoes] = await Promise.all([
    GrupoComponente.find({ _id: { $in: gruposIds }, ativo: { $ne: false } }).lean(),
    OpcaoComponente.find({ _id: { $in: opcoesIds }, ativo: { $ne: false } }).lean(),
  ]);

  const gruposPorId = new Map(grupos.map((grupo) => [id(grupo), grupo]));
  const opcoesPorId = new Map(opcoes.map((opcao) => [id(opcao), opcao]));
  const snapshots = [];
  const combinacoesRecebidas = new Set();
  let adicionais = 0;

  for (const item of listaRecebida) {
    const grupoId = id(item.grupoId);
    const opcaoId = id(item.opcaoId);
    const grupo = gruposPorId.get(grupoId);
    const opcao = opcoesPorId.get(opcaoId);
    const chaveCombinacao = `${grupoId}:${opcaoId}`;

    if (combinacoesRecebidas.has(chaveCombinacao)) {
      throw new Error("A mesma opção foi enviada mais de uma vez no pedido.");
    }
    combinacoesRecebidas.add(chaveCombinacao);

    if (!grupo || !gruposProduto.has(grupoId)) {
      throw new Error(`Grupo de personalização inválido para ${produto.nome}.`);
    }

    if (!opcao || id(opcao.grupo) !== grupoId) {
      throw new Error(`Opção de personalização inválida em ${grupo.nome}.`);
    }

    if (opcao.canais?.cardapio === false) {
      throw new Error(`${opcao.nome} não está disponível no cardápio.`);
    }

    const disponibilidade = opcao.disponibilidade || {};
    const semEstoque =
      disponibilidade.controlarEstoque === true &&
      Number(disponibilidade.estoque || 0) <
        Number(disponibilidade.estoqueMinimo || 1);

    if (disponibilidade.disponivel === false || semEstoque) {
      throw new Error(`${opcao.nome} não está disponível no momento.`);
    }

    const config = configuracaoProduto(produto, grupoId);
    const permitidas = new Set((config?.opcoesPermitidas || []).map(id));
    if (permitidas.size > 0 && !permitidas.has(opcaoId)) {
      throw new Error(`${opcao.nome} não está permitida para ${produto.nome}.`);
    }

    const quantidade = grupo.permiteQuantidadePorOpcao
      ? Math.min(
          numeroPositivo(item.quantidade),
          numeroPositivo(grupo.quantidadeMaximaPorOpcao)
        )
      : 1;
    const valorUnitario = Number(opcao.precoAdicional || 0);
    const valor = valorUnitario * quantidade;

    adicionais += valor;
    snapshots.push({
      grupoId,
      grupo: grupo.nome,
      grupoTipo: grupo.tipo || "personalizado",
      opcaoId,
      opcao: opcao.nome,
      quantidade,
      valorUnitario,
      valor,
    });
  }

  for (const grupoId of gruposProduto) {
    const grupo = gruposPorId.get(grupoId) || (await GrupoComponente.findById(grupoId).lean());
    if (!grupo || grupo.ativo === false || grupo.canais?.cardapio === false) continue;

    const config = configuracaoProduto(produto, grupoId);
    if (config?.mostrarCardapio === false) continue;

    const { minimo, maximo } = limitesGrupo(grupo, config);
    const escolhidas = snapshots.filter((item) => item.grupoId === grupoId);

    if (grupo.tipoSelecao === "unica" && escolhidas.length > 1) {
      throw new Error(`Escolha apenas uma opção em ${grupo.nome}.`);
    }
    const total = grupo.permiteQuantidadePorOpcao
      ? escolhidas.reduce((soma, item) => soma + item.quantidade, 0)
      : escolhidas.length;

    if (total < minimo) {
      throw new Error(`Escolha pelo menos ${minimo} item(ns) em ${grupo.nome}.`);
    }
    if (total > maximo) {
      throw new Error(`Escolha no máximo ${maximo} item(ns) em ${grupo.nome}.`);
    }
  }

  return { configuracoes: snapshots, adicionais };
}

module.exports = { validarPersonalizacao };
