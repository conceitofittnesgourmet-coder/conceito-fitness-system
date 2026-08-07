const Produto = require("../models/produto");
const generateSlug = require("../utils/generateslug");
const FoodCadastroService =
    require("./food/FoodCadastroService");

function parseJsonSeguro(valor, padrao = {}) {
  if (valor === undefined || valor === null || valor === "") return padrao;
  if (typeof valor === "object") return valor;
  try {
    return JSON.parse(valor);
  } catch (_error) {
    return padrao;
  }
}

function parseBoolean(valor, padrao = false) {
  if (valor === undefined || valor === null || valor === "") return padrao;
  if (typeof valor === "boolean") return valor;
  const texto = String(valor).trim().toLowerCase();
  if (["true", "1", "sim", "yes"].includes(texto)) return true;
  if (["false", "0", "nao", "não", "no"].includes(texto)) return false;
  return padrao;
}

function parseNumero(valor, padrao = 0) {
  if (valor === undefined || valor === null || valor === "") return padrao;
  const numero = Number(String(valor).replace(",", "."));
  return Number.isFinite(numero) ? numero : padrao;
}

function parseData(valor, padrao = null) {
  if (!valor) return padrao;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? padrao : data;
}

function parseArray(valor, padrao = []) {
  const parsed = parseJsonSeguro(valor, null);
  if (Array.isArray(parsed)) return parsed;
  if (typeof valor === "string") {
    return valor.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return padrao;
}

function objeto(valor) {
  const parsed = parseJsonSeguro(valor, {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function mergeProfundo(base = {}, recebido = {}) {
  const resultado = { ...base };
  for (const [chave, valor] of Object.entries(recebido || {})) {
    if (
      valor && typeof valor === "object" && !Array.isArray(valor) &&
      base?.[chave] && typeof base[chave] === "object" && !Array.isArray(base[chave])
    ) {
      resultado[chave] = mergeProfundo(base[chave], valor);
    } else {
      resultado[chave] = valor;
    }
  }
  return resultado;
}

function normalizarPublicacao(body = {}, atual = {}) {
  const recebido = objeto(body.publicacao);
  const destaqueLegado = body.destaque !== undefined
    ? parseBoolean(body.destaque, false)
    : undefined;

  const base = {
    publicado: true,
    pdv: true,
    cardapioOnline: true,
    whatsapp: true,
    ifood: false,
    aiqfome: false,
    destaque: false,
    novidade: false,
    maisVendido: false,
    promocao: false,
    exclusivoClube: false,
    ordem: 0,
    canais: {
      pdv: true,
      cardapio: true,
      site: true,
      whatsapp: true,
      ifood: false,
      aiqfome: false,
    },
    destaques: {
      destaque: false,
      novidade: false,
      maisVendido: false,
      exclusivoClube: false,
      ultimasUnidades: false,
      lancamento: false,
    },
    prioridadeExibicao: 0,
    promocaoDetalhada: {
      ativa: false,
      tipo: "preco_fixo",
      precoOriginal: 0,
      precoPromocional: 0,
      desconto: 0,
      inicio: null,
      fim: null,
      cupom: "",
      exclusivaClube: false,
      prioridade: 0,
    },
    cicloVida: {
      dataLancamento: null,
      dataExpiracao: null,
      ocultarAntesLancamento: true,
      ocultarAposExpiracao: true,
    },
  };

  const resultado = mergeProfundo(mergeProfundo(base, atual), recebido);

  if (destaqueLegado !== undefined) {
    resultado.destaque = destaqueLegado;
    resultado.destaques = { ...resultado.destaques, destaque: destaqueLegado };
  }

  resultado.canais = {
    ...resultado.canais,
    pdv: parseBoolean(resultado.canais?.pdv, parseBoolean(resultado.pdv, true)),
    cardapio: parseBoolean(
      resultado.canais?.cardapio,
      parseBoolean(resultado.cardapioOnline, true)
    ),
    whatsapp: parseBoolean(
      resultado.canais?.whatsapp,
      parseBoolean(resultado.whatsapp, true)
    ),
    ifood: parseBoolean(resultado.canais?.ifood, parseBoolean(resultado.ifood, false)),
    aiqfome: parseBoolean(
      resultado.canais?.aiqfome,
      parseBoolean(resultado.aiqfome, false)
    ),
  };

  resultado.pdv = resultado.canais.pdv;
  resultado.cardapioOnline = resultado.canais.cardapio;
  resultado.whatsapp = resultado.canais.whatsapp;
  resultado.ifood = resultado.canais.ifood;
  resultado.aiqfome = resultado.canais.aiqfome;

  resultado.destaques = {
    ...resultado.destaques,
    destaque: parseBoolean(resultado.destaques?.destaque, parseBoolean(resultado.destaque)),
    novidade: parseBoolean(resultado.destaques?.novidade, parseBoolean(resultado.novidade)),
    maisVendido: parseBoolean(
      resultado.destaques?.maisVendido,
      parseBoolean(resultado.maisVendido)
    ),
    exclusivoClube: parseBoolean(
      resultado.destaques?.exclusivoClube,
      parseBoolean(resultado.exclusivoClube)
    ),
  };

  resultado.destaque = resultado.destaques.destaque;
  resultado.novidade = resultado.destaques.novidade;
  resultado.maisVendido = resultado.destaques.maisVendido;
  resultado.exclusivoClube = resultado.destaques.exclusivoClube;
  resultado.ordem = parseNumero(resultado.ordem, 0);
  resultado.prioridadeExibicao = parseNumero(
    resultado.prioridadeExibicao,
    resultado.ordem
  );

  const promocaoDetalhada = resultado.promocaoDetalhada || {};
  promocaoDetalhada.ativa = parseBoolean(
    promocaoDetalhada.ativa,
    parseBoolean(resultado.promocao, false)
  );
  promocaoDetalhada.precoOriginal = parseNumero(promocaoDetalhada.precoOriginal, 0);
  promocaoDetalhada.precoPromocional = parseNumero(
    promocaoDetalhada.precoPromocional,
    0
  );
  promocaoDetalhada.desconto = parseNumero(promocaoDetalhada.desconto, 0);
  promocaoDetalhada.inicio = parseData(promocaoDetalhada.inicio, null);
  promocaoDetalhada.fim = parseData(promocaoDetalhada.fim, null);
  promocaoDetalhada.prioridade = parseNumero(promocaoDetalhada.prioridade, 0);
  resultado.promocaoDetalhada = promocaoDetalhada;
  resultado.promocao = promocaoDetalhada.ativa;

  return resultado;
}

function normalizarDisponibilidade(body = {}, atual = {}) {
  const recebido = objeto(body.disponibilidade);
  const base = {
    disponivel: true,
    ocultarQuandoIndisponivel: false,
    motivoIndisponibilidade: "",
    pausadoAte: null,
    diasSemana: [],
    horarioInicio: "",
    horarioFim: "",
    limiteDiario: 0,
    quantidadeVendidaHoje: 0,
    dataControleDiario: null,
    controlarPorHorario: false,
    controlarPorEstoque: true,
    estoqueMinimoDisponivel: 1,
    lojas: [],
  };
  const resultado = mergeProfundo(mergeProfundo(base, atual), recebido);
  resultado.disponivel = parseBoolean(resultado.disponivel, true);
  resultado.ocultarQuandoIndisponivel = parseBoolean(
    resultado.ocultarQuandoIndisponivel,
    false
  );
  resultado.controlarPorHorario = parseBoolean(resultado.controlarPorHorario, false);
  resultado.controlarPorEstoque = parseBoolean(resultado.controlarPorEstoque, true);
  resultado.pausadoAte = parseData(resultado.pausadoAte, null);
  resultado.diasSemana = parseArray(resultado.diasSemana, []).map(Number)
    .filter((dia) => Number.isInteger(dia) && dia >= 0 && dia <= 6);
  resultado.limiteDiario = parseNumero(resultado.limiteDiario, 0);
  resultado.quantidadeVendidaHoje = parseNumero(resultado.quantidadeVendidaHoje, 0);
  resultado.estoqueMinimoDisponivel = parseNumero(resultado.estoqueMinimoDisponivel, 1);
  resultado.lojas = Array.isArray(resultado.lojas) ? resultado.lojas : [];
  return resultado;
}

function normalizarMarketing(body = {}, atual = {}) {
  const resultado = mergeProfundo(atual, objeto(body.marketing));
  if (resultado.campanhasSazonais !== undefined) {
    resultado.campanhasSazonais = Array.isArray(resultado.campanhasSazonais)
      ? resultado.campanhasSazonais
      : [];
  }
  return resultado;
}

function normalizarRecomendacoes(body = {}, atual = {}) {
  const resultado = mergeProfundo(atual, objeto(body.recomendacoes));
  for (const campo of ["produtosRelacionados", "vendaCruzada", "combinaCom", "upsell"]) {
    if (resultado[campo] !== undefined && !Array.isArray(resultado[campo])) resultado[campo] = [];
  }
  return resultado;
}

function normalizarCombos(body = {}, atual = {}) {
  const resultado = mergeProfundo(atual, objeto(body.combosAutomaticos));
  if (resultado.habilitado !== undefined) {
    resultado.habilitado = parseBoolean(resultado.habilitado, false);
  }
  if (resultado.grupos !== undefined && !Array.isArray(resultado.grupos)) resultado.grupos = [];
  return resultado;
}

function normalizarIntegracoes(body = {}, atual = {}) {
  return mergeProfundo(atual, objeto(body.integracoes));
}

function calcularFinanceiro(preco, custo) {
  const precoVenda = parseNumero(preco, 0);
  const custoProduto = parseNumero(custo, 0);
  const lucro = precoVenda - custoProduto;
  const margem = precoVenda > 0 ? Number(((lucro / precoVenda) * 100).toFixed(2)) : 0;
  return { preco: precoVenda, custo: custoProduto, lucro, margem };
}

function montarDadosProduto(body = {}, atual = null) {
  const dadosAtuais = atual?.toObject ? atual.toObject() : atual || {};
  const criar = !atual;
  const dados = {};

  const copiarTexto = (campo, padrao = "") => {
    if (criar || body[campo] !== undefined) dados[campo] = body[campo] ?? padrao;
  };
  const copiarBoolean = (campo, padrao = false) => {
    if (criar || body[campo] !== undefined) {
      dados[campo] = parseBoolean(body[campo], dadosAtuais[campo] ?? padrao);
    }
  };
  const copiarNumero = (campo, padrao = 0) => {
    if (criar || body[campo] !== undefined) {
      dados[campo] = parseNumero(body[campo], dadosAtuais[campo] ?? padrao);
    }
  };
  const copiarJson = (campo, padrao) => {
    if (criar || body[campo] !== undefined) dados[campo] = parseJsonSeguro(body[campo], padrao);
  };

  copiarTexto("nome");
  copiarTexto("descricao");
  copiarTexto("categoria", "Gourmet");
  copiarTexto("unidadeMedida", "UN");
  copiarTexto("restricoes");
  copiarTexto("peso");
  copiarTexto("codigoBarras");
  copiarTexto("sku");
  copiarTexto("tipoProduto", "producao");
  copiarTexto("tipoComposicao", "simples");

  if (criar || body.nome !== undefined) dados.slug = generateSlug(body.nome || dadosAtuais.nome || "produto");
  if (criar || body.categorias !== undefined) dados.categorias = parseArray(body.categorias, []);

  copiarBoolean("vendaPorPeso");
  copiarBoolean("permiteFracionado");
  copiarBoolean("produtoComposto");
  copiarBoolean("configuravel");
  copiarBoolean("permiteObservacao", true);
  copiarBoolean("permiteMontagemCliente");
  copiarBoolean("ativo", true);

  copiarNumero("estoque", 0);
  copiarNumero("estoqueMinimo", 5);
  copiarNumero("tempoPreparo", 0);
  copiarNumero("quantidadeMinima", 1);
  copiarNumero("quantidadeMaxima", 1);

  copiarJson("dadosFiscais", {});
copiarJson("itensComposicao", []);
copiarJson("informacoesNutricionais", {});
copiarJson("alergenos", {});
copiarJson("selos", {});
copiarJson("gruposComponentes", []);
copiarJson("configuracaoGrupos", []);

/* ======================================================
   FOOD CORE
====================================================== */

dados.cadastroMestre = {

    ...(dadosAtuais.cadastroMestre || {}),

    ...(body.cadastroMestre || {})

};

dados.cadastroMestre.nutricional =
    FoodCadastroService.normalizarNutricional(
        dados.cadastroMestre.nutricional
    );

dados.cadastroMestre.alergenicos =
    FoodCadastroService.normalizarAlergenicos(
        dados.cadastroMestre.alergenicos
    );

dados.cadastroMestre.foodCore =
    FoodCadastroService.normalizarFoodCore(
        dados.cadastroMestre.foodCore
    );

/* ====================================================== */


  const financeiro = calcularFinanceiro(
    body.preco !== undefined ? body.preco : dadosAtuais.preco,
    body.custo !== undefined ? body.custo : dadosAtuais.custo
  );
  Object.assign(dados, financeiro);

  if (criar || body.publicacao !== undefined || body.destaque !== undefined) {
    dados.publicacao = normalizarPublicacao(body, dadosAtuais.publicacao || {});
    dados.destaque = dados.publicacao.destaques?.destaque ?? dados.publicacao.destaque;
  }

  if (criar || body.disponibilidade !== undefined) {
    dados.disponibilidade = normalizarDisponibilidade(body, dadosAtuais.disponibilidade || {});
  }
  if (criar || body.marketing !== undefined) dados.marketing = normalizarMarketing(body, dadosAtuais.marketing || {});
  if (criar || body.recomendacoes !== undefined) dados.recomendacoes = normalizarRecomendacoes(body, dadosAtuais.recomendacoes || {});
  if (criar || body.combosAutomaticos !== undefined) dados.combosAutomaticos = normalizarCombos(body, dadosAtuais.combosAutomaticos || {});
  if (criar || body.integracoes !== undefined) dados.integracoes = normalizarIntegracoes(body, dadosAtuais.integracoes || {});

  const promocaoDetalhada = dados.publicacao?.promocaoDetalhada || dadosAtuais.publicacao?.promocaoDetalhada || {};
  if (criar || body.precoPromocional !== undefined || body.publicacao !== undefined) {
    dados.precoPromocional = parseNumero(
      body.precoPromocional,
      promocaoDetalhada.precoPromocional ?? dadosAtuais.precoPromocional ?? 0
    );
  }
  if (criar || body.promocaoInicio !== undefined || body.publicacao !== undefined) {
    dados.promocaoInicio = parseData(
      body.promocaoInicio,
      promocaoDetalhada.inicio ?? dadosAtuais.promocaoInicio ?? null
    );
  }
  if (criar || body.promocaoFim !== undefined || body.publicacao !== undefined) {
    dados.promocaoFim = parseData(
      body.promocaoFim,
      promocaoDetalhada.fim ?? dadosAtuais.promocaoFim ?? null
    );
  }

  return dados;
}

function promocaoEstaAtiva(produto) {
  const detalhada = produto?.publicacao?.promocaoDetalhada || {};
  const ativa = parseBoolean(detalhada.ativa, parseBoolean(produto?.publicacao?.promocao, false));
  if (!ativa) return false;
  const agora = new Date();
  const inicio = detalhada.inicio || produto.promocaoInicio;
  const fim = detalhada.fim || produto.promocaoFim;
  if (inicio && agora < new Date(inicio)) return false;
  if (fim && agora > new Date(fim)) return false;
  const precoPromocional = parseNumero(
    detalhada.precoPromocional,
    parseNumero(produto.precoPromocional, 0)
  );
  return precoPromocional > 0;
}

function verificarDisponibilidadeProduto(produto) {
  if (!produto.ativo) return { disponivel: false, motivo: "Produto inativo" };
  const config = produto.disponibilidade || {};
  if (config.disponivel === false) {
    return { disponivel: false, motivo: config.motivoIndisponibilidade || "Indisponível no momento" };
  }
  const agora = new Date();
  if (config.pausadoAte && agora < new Date(config.pausadoAte)) {
    return { disponivel: false, motivo: config.motivoIndisponibilidade || "Produto temporariamente pausado" };
  }
  if (config.controlarPorHorario === true) {
    const dias = config.diasSemana || [];
    if (dias.length && !dias.includes(agora.getDay())) return { disponivel: false, motivo: "Produto indisponível hoje" };
    const horario = agora.toTimeString().slice(0, 5);
    if (config.horarioInicio && horario < config.horarioInicio) return { disponivel: false, motivo: `Disponível a partir das ${config.horarioInicio}` };
    if (config.horarioFim && horario > config.horarioFim) return { disponivel: false, motivo: "Horário de venda encerrado" };
  }
  if (parseNumero(config.limiteDiario, 0) > 0 && parseNumero(config.quantidadeVendidaHoje, 0) >= parseNumero(config.limiteDiario, 0)) {
    return { disponivel: false, motivo: "Limite diário atingido" };
  }
  if (config.controlarPorEstoque !== false) {
    const minimo = parseNumero(config.estoqueMinimoDisponivel, 1);
    if (parseNumero(produto.estoque, 0) < minimo) return { disponivel: false, motivo: "Produto esgotado" };
  }
  return { disponivel: true, motivo: "" };
}

function formatarProdutoPublico(produto) {
  const obj = produto?.toObject ? produto.toObject() : produto;
  const disponibilidade = verificarDisponibilidadeProduto(obj);
  const promocaoAtiva = promocaoEstaAtiva(obj);
  const detalhada = obj.publicacao?.promocaoDetalhada || {};
  const precoPromocional = parseNumero(detalhada.precoPromocional, parseNumero(obj.precoPromocional, 0));
  const imagem = obj.imagem || obj.foto || obj.image || obj.imagens?.[0]?.url || obj.imagens?.[0] || "";
  return {
    ...obj,
    imagem,
    precoOriginal: parseNumero(obj.preco, 0),
    precoExibicao: promocaoAtiva ? precoPromocional : parseNumero(obj.preco, 0),
    promocaoAtiva,
    disponivel: disponibilidade.disponivel,
    motivoIndisponibilidade: disponibilidade.motivo,
    estoque: parseNumero(obj.estoque, 0),
    destaque: Boolean(obj.publicacao?.destaques?.destaque || obj.publicacao?.destaque || obj.destaque),
  };
}

async function criarProduto(dados, imagens = []) {
  return Produto.create({ ...montarDadosProduto(dados), imagens });
}

async function atualizarProduto(produto, body, imagens) {
  const dados = montarDadosProduto(body, produto);
  if (imagens !== undefined) dados.imagens = imagens;
  Object.assign(produto, dados);
  return produto.save();
}

module.exports = {
  parseJsonSeguro,
  parseBoolean,
  parseNumero,
  parseData,
  normalizarPublicacao,
  normalizarDisponibilidade,
  normalizarMarketing,
  normalizarRecomendacoes,
  normalizarCombos,
  normalizarIntegracoes,
  montarDadosProduto,
  promocaoEstaAtiva,
  verificarDisponibilidadeProduto,
  formatarProdutoPublico,
  criarProduto,
  atualizarProduto,
};
