const crypto = require("crypto");
const Produto = require("../models/produto");
const Categoria = require("../models/categoria");
const GrupoComponente = require("../models/grupocomponente");
const OpcaoComponente = require("../models/opcaocomponente");
const IfoodCatalogoMapeamento = require("../models/ifoodcatalogomapeamento");
const IfoodApiService = require("./IfoodApiService");

function texto(valor, limite = 1000) {
  return String(valor || "").trim().slice(0, limite);
}

function dinheiro(valor) {
  const numero = Number(valor || 0);
  return Number.isFinite(numero) ? Math.max(0, Number(numero.toFixed(2))) : 0;
}

function uuidDeterministico(...partes) {
  const hex = crypto.createHash("sha256").update(partes.join(":"), "utf8").digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = ["8", "9", "a", "b"][parseInt(hex[16], 16) % 4];
  const valor = hex.join("");
  return `${valor.slice(0, 8)}-${valor.slice(8, 12)}-${valor.slice(12, 16)}-${valor.slice(16, 20)}-${valor.slice(20)}`;
}

function hashPayload(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function publicadoNoIfood(produto) {
  return Boolean(
    produto?.ativo &&
      (produto?.publicacao?.ifood || produto?.publicacao?.canais?.ifood)
  );
}

function disponivel(produto) {
  if (!produto?.ativo || produto?.disponibilidade?.disponivel === false) return false;
  if (produto?.disponibilidade?.controlarPorEstoque !== false) {
    const minimo = Number(produto?.disponibilidade?.estoqueMinimoDisponivel || 1);
    if (Number(produto?.estoque || 0) < minimo) return false;
  }
  return true;
}

function precoVenda(produto) {
  const promocao = produto?.publicacao?.promocaoDetalhada;
  const agora = Date.now();
  const promocaoValida =
    promocao?.ativa &&
    (!promocao.inicio || new Date(promocao.inicio).getTime() <= agora) &&
    (!promocao.fim || new Date(promocao.fim).getTime() >= agora) &&
    Number(promocao.precoPromocional || 0) > 0;
  return dinheiro(promocaoValida ? promocao.precoPromocional : produto.preco);
}

function tipoGrupoIfood(tipo) {
  const valor = String(tipo || "").toLowerCase();
  if (["massa", "recheio", "cobertura", "tamanho", "decoracao", "fruta", "calda", "personalizado"].includes(valor)) {
    return "SPECIFICATION";
  }
  if (valor === "adicional") return "INGREDIENTS";
  return "OFFER_UNIT";
}

async function obterCatalogo(configuracao) {
  const catalogos = await IfoodApiService.listarCatalogos(configuracao);
  if (!catalogos.length) throw new Error("Nenhum catálogo foi encontrado para a loja selecionada.");
  const escolhido = catalogos.find((item) => item.catalogId === configuracao.catalogId) || catalogos[0];
  if (escolhido?.catalogId && configuracao.catalogId !== escolhido.catalogId) {
    configuracao.catalogId = escolhido.catalogId;
    await configuracao.save();
  }
  return escolhido;
}

async function categoriasLocais(produtos) {
  const cadastradas = await Categoria.find({ ativo: true, mostrarDelivery: { $ne: false } }).sort({ ordem: 1, nome: 1 }).lean();
  const mapa = new Map();
  for (const categoria of cadastradas) {
    mapa.set(categoria.nome.toLowerCase(), {
      referenciaLocal: String(categoria._id),
      nome: texto(categoria.nome, 80),
      ordem: Number(categoria.ordem || 0),
    });
  }
  for (const produto of produtos) {
    const nome = texto(produto.categoria || produto.categorias?.[0] || "Produtos", 80) || "Produtos";
    const chave = nome.toLowerCase();
    if (!mapa.has(chave)) {
      mapa.set(chave, { referenciaLocal: `texto:${chave}`, nome, ordem: mapa.size + 100 });
    }
  }
  return [...mapa.values()].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));
}

async function sincronizarCategoria(configuracao, catalogo, categoria, modoSimulacao) {
  let map = await IfoodCatalogoMapeamento.findOne({
    tipo: "categoria",
    referenciaLocal: categoria.referenciaLocal,
    merchantId: configuracao.merchantId,
  });
  const payload = { name: categoria.nome, status: "AVAILABLE", template: "DEFAULT", sequence: categoria.ordem };
  if (modoSimulacao) return { ...categoria, ifoodId: map?.ifoodId || "", acao: map ? "atualizar" : "criar", payload };

  if (!map) {
    const resposta = await IfoodApiService.criarCategoria(configuracao, payload);
    map = await IfoodCatalogoMapeamento.create({
      tipo: "categoria",
      referenciaLocal: categoria.referenciaLocal,
      nomeLocal: categoria.nome,
      merchantId: configuracao.merchantId,
      catalogId: catalogo.catalogId,
      ifoodId: resposta.id,
      externalCode: `CAT-${categoria.referenciaLocal}`.slice(0, 80),
      hashPayload: hashPayload(payload),
      status: "sincronizado",
      ultimaSincronizacaoEm: new Date(),
      respostaIfood: resposta,
    });
  } else {
    map.nomeLocal = categoria.nome;
    map.catalogId = catalogo.catalogId;
    map.status = "sincronizado";
    map.hashPayload = hashPayload(payload);
    map.ultimaSincronizacaoEm = new Date();
    map.ultimoErro = "";
    await map.save();
  }
  return { ...categoria, ifoodId: map.ifoodId, acao: "sincronizado" };
}

async function carregarPersonalizacoes(produto) {
  const configs = Array.isArray(produto.configuracaoGrupos) ? produto.configuracaoGrupos : [];
  const gruposIds = configs.map((item) => item.grupoId).filter(Boolean);
  if (!gruposIds.length) return [];
  const grupos = await GrupoComponente.find({ _id: { $in: gruposIds }, ativo: true, "canais.ifood": true }).lean();
  const opcoes = await OpcaoComponente.find({ grupo: { $in: gruposIds }, ativo: true }).sort({ ordem: 1, nome: 1 }).lean();
  const gruposPorId = new Map(grupos.map((item) => [String(item._id), item]));
  return configs
    .map((config) => {
      const grupo = gruposPorId.get(String(config.grupoId));
      if (!grupo) return null;
      const permitidas = new Set((config.opcoesPermitidas || []).map(String));
      const opcoesGrupo = opcoes.filter((opcao) => String(opcao.grupo) === String(grupo._id) && (!permitidas.size || permitidas.has(String(opcao._id))));
      return { config, grupo, opcoes: opcoesGrupo };
    })
    .filter(Boolean)
    .sort((a, b) => Number(a.config.ordem || a.grupo.ordem || 0) - Number(b.config.ordem || b.grupo.ordem || 0));
}

async function payloadProduto(configuracao, produto, categoriaIfoodId) {
  const itemId = produto.integracoes?.ifood?.itemId || uuidDeterministico(configuracao.merchantId, "item", produto._id);
  const produtoPrincipalId = produto.integracoes?.ifood?.produtoId || uuidDeterministico(configuracao.merchantId, "produto", produto._id);
  const personalizacoes = await carregarPersonalizacoes(produto);
  const products = [{
    id: produtoPrincipalId,
    name: texto(produto.cadastroMestre?.cardapio?.nomePublico || produto.nome, 120),
    description: texto(produto.descricao || produto.cadastroMestre?.cardapio?.descricaoCurta, 1000),
    externalCode: texto(produto.sku || produto.codigoBarras || produto._id, 80),
    optionGroups: [],
  }];
  const optionGroups = [];
  const options = [];

  for (const { config, grupo, opcoes } of personalizacoes) {
    const groupId = uuidDeterministico(configuracao.merchantId, "grupo", produto._id, grupo._id);
    const min = Math.max(0, Number(config.minimoEscolhas ?? grupo.minimoEscolhas ?? 0));
    const max = Math.max(min || 1, Number(config.maximoEscolhas ?? grupo.maximoEscolhas ?? 1));
    const optionIds = [];
    for (const opcao of opcoes) {
      const optionId = uuidDeterministico(configuracao.merchantId, "opcao", produto._id, opcao._id);
      const optionProductId = uuidDeterministico(configuracao.merchantId, "produto-opcao", opcao._id);
      optionIds.push(optionId);
      products.push({
        id: optionProductId,
        name: texto(opcao.nome, 120),
        description: texto(opcao.descricao, 1000),
        externalCode: texto(`OPT-${opcao._id}`, 80),
      });
      options.push({
        id: optionId,
        productId: optionProductId,
        status: "AVAILABLE",
        price: { value: dinheiro(opcao.precoAdicional) },
        externalCode: texto(`OPT-${opcao._id}`, 80),
      });
    }
    if (!optionIds.length) continue;
    products[0].optionGroups.push({ id: groupId, min, max });
    optionGroups.push({
      id: groupId,
      name: texto(config.nome || grupo.nome, 120),
      status: "AVAILABLE",
      optionGroupType: tipoGrupoIfood(config.tipo || grupo.tipo),
      min,
      max,
      optionIds,
    });
  }

  return {
    item: {
      id: itemId,
      type: "DEFAULT",
      categoryId: categoriaIfoodId,
      status: disponivel(produto) ? "AVAILABLE" : "UNAVAILABLE",
      price: { value: precoVenda(produto) },
      externalCode: texto(produto.sku || produto.cadastroMestre?.marketplaces?.ifoodCodigo || produto._id, 80),
    },
    products,
    optionGroups,
    options,
  };
}

async function produtosPublicados() {
  return Produto.find({
    ativo: true,
    $or: [{ "publicacao.ifood": true }, { "publicacao.canais.ifood": true }],
  }).sort({ "publicacao.ordem": 1, nome: 1 }).lean();
}

async function diagnostico() {
  const configuracao = await IfoodApiService.obterConfiguracaoCompleta();
  if (!configuracao.merchantId) throw new Error("Selecione uma loja iFood antes de sincronizar o catálogo.");
  const catalogo = await obterCatalogo(configuracao);
  const produtos = await produtosPublicados();
  const categorias = await categoriasLocais(produtos);
  const mapeamentos = await IfoodCatalogoMapeamento.find({ merchantId: configuracao.merchantId }).lean();
  return {
    catalogo,
    totais: {
      produtosPublicados: produtos.length,
      categoriasLocais: categorias.length,
      sincronizados: mapeamentos.filter((item) => item.status === "sincronizado").length,
      erros: mapeamentos.filter((item) => item.status === "erro").length,
    },
    produtos: produtos.map((item) => ({
      id: item._id,
      nome: item.nome,
      categoria: item.categoria || item.categorias?.[0] || "Produtos",
      preco: precoVenda(item),
      disponivel: disponivel(item),
      configuravel: Boolean(item.configuravel),
    })),
    mapeamentos,
  };
}

async function sincronizar({ modoSimulacao = false, produtoId = "" } = {}) {
  const configuracao = await IfoodApiService.obterConfiguracaoCompleta();
  if (!configuracao.merchantId) throw new Error("Selecione uma loja iFood antes de sincronizar o catálogo.");
  const catalogo = await obterCatalogo(configuracao);
  let produtos = await produtosPublicados();
  if (produtoId) produtos = produtos.filter((item) => String(item._id) === String(produtoId));
  if (!produtos.length) throw new Error("Nenhum produto marcado para publicação no iFood foi encontrado.");
  const categorias = await categoriasLocais(produtos);
  const categoriasResultado = [];
  const categoriaPorNome = new Map();
  for (const categoria of categorias) {
    try {
      const resultado = await sincronizarCategoria(configuracao, catalogo, categoria, modoSimulacao);
      categoriasResultado.push({ ok: true, ...resultado });
      if (resultado.ifoodId) categoriaPorNome.set(categoria.nome.toLowerCase(), resultado.ifoodId);
    } catch (error) {
      categoriasResultado.push({ ok: false, ...categoria, erro: error.message });
    }
  }

  const produtosResultado = [];
  for (const produto of produtos) {
    const nomeCategoria = texto(produto.categoria || produto.categorias?.[0] || "Produtos", 80) || "Produtos";
    const categoriaIfoodId = categoriaPorNome.get(nomeCategoria.toLowerCase());
    if (!categoriaIfoodId && !modoSimulacao) {
      produtosResultado.push({ ok: false, produtoId: produto._id, nome: produto.nome, erro: "Categoria do iFood não foi criada." });
      continue;
    }
    try {
      const payload = await payloadProduto(configuracao, produto, categoriaIfoodId || "CATEGORIA_SIMULADA");
      if (modoSimulacao) {
        produtosResultado.push({ ok: true, produtoId: produto._id, nome: produto.nome, acao: "simular", payload });
        continue;
      }
      const resposta = await IfoodApiService.salvarItemCatalogo(configuracao, payload);
      await IfoodCatalogoMapeamento.findOneAndUpdate(
        { tipo: "produto", referenciaLocal: String(produto._id), merchantId: configuracao.merchantId },
        {
          nomeLocal: produto.nome,
          catalogId: catalogo.catalogId,
          ifoodId: payload.item.id,
          externalCode: payload.item.externalCode,
          categoriaIfoodId,
          hashPayload: hashPayload(payload),
          status: "sincronizado",
          ultimaSincronizacaoEm: new Date(),
          ultimoErro: "",
          respostaIfood: resposta || { accepted: true },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      await Produto.updateOne(
        { _id: produto._id },
        {
          $set: {
            "integracoes.ifood.itemId": payload.item.id,
            "integracoes.ifood.produtoId": payload.products[0].id,
            "integracoes.ifood.categoryId": categoriaIfoodId,
            "integracoes.ifood.ultimaSincronizacaoEm": new Date(),
            "integracoes.ifood.ultimoErro": "",
            "integracoes.ifood.status": payload.item.status,
          },
        }
      );
      produtosResultado.push({ ok: true, produtoId: produto._id, nome: produto.nome, ifoodId: payload.item.id, acao: "sincronizado" });
    } catch (error) {
      await IfoodCatalogoMapeamento.findOneAndUpdate(
        { tipo: "produto", referenciaLocal: String(produto._id), merchantId: configuracao.merchantId },
        { nomeLocal: produto.nome, ifoodId: uuidDeterministico(configuracao.merchantId, "item", produto._id), status: "erro", ultimoErro: error.message },
        { upsert: true, setDefaultsOnInsert: true }
      );
      await Produto.updateOne({ _id: produto._id }, { $set: { "integracoes.ifood.ultimoErro": error.message } });
      produtosResultado.push({ ok: false, produtoId: produto._id, nome: produto.nome, erro: error.message });
    }
  }

  configuracao.ultimaSincronizacaoCatalogoEm = new Date();
  configuracao.ultimaSincronizacaoCatalogoOk = produtosResultado.every((item) => item.ok);
  configuracao.ultimaSincronizacaoCatalogoErro = produtosResultado.filter((item) => !item.ok).map((item) => `${item.nome}: ${item.erro}`).join(" | ").slice(0, 3000);
  configuracao.produtosCatalogoSincronizados = produtosResultado.filter((item) => item.ok).length;
  await configuracao.save();

  return {
    modoSimulacao,
    catalogo,
    categorias: categoriasResultado,
    produtos: produtosResultado,
    resumo: {
      categorias: categoriasResultado.length,
      produtos: produtosResultado.length,
      sucessos: produtosResultado.filter((item) => item.ok).length,
      erros: produtosResultado.filter((item) => !item.ok).length,
    },
  };
}

async function atualizarDisponibilidade(produtoId, status) {
  const configuracao = await IfoodApiService.obterConfiguracaoCompleta();
  const map = await IfoodCatalogoMapeamento.findOne({ tipo: "produto", referenciaLocal: String(produtoId), merchantId: configuracao.merchantId });
  if (!map) throw new Error("O produto ainda não foi sincronizado com o iFood.");
  const statusIfood = String(status).toUpperCase() === "AVAILABLE" ? "AVAILABLE" : "UNAVAILABLE";
  await IfoodApiService.atualizarStatusItem(configuracao, map.ifoodId, statusIfood);
  map.status = "sincronizado";
  map.ultimaSincronizacaoEm = new Date();
  map.ultimoErro = "";
  await map.save();
  await Produto.updateOne({ _id: produtoId }, { $set: { "integracoes.ifood.status": statusIfood, "integracoes.ifood.ultimaSincronizacaoEm": new Date() } });
  return { produtoId, ifoodId: map.ifoodId, status: statusIfood };
}

async function atualizarPreco(produtoId, preco) {
  const configuracao = await IfoodApiService.obterConfiguracaoCompleta();
  const map = await IfoodCatalogoMapeamento.findOne({ tipo: "produto", referenciaLocal: String(produtoId), merchantId: configuracao.merchantId });
  if (!map) throw new Error("O produto ainda não foi sincronizado com o iFood.");
  const valor = dinheiro(preco);
  await IfoodApiService.atualizarPrecoItem(configuracao, map.ifoodId, valor);
  map.ultimaSincronizacaoEm = new Date();
  map.ultimoErro = "";
  await map.save();
  return { produtoId, ifoodId: map.ifoodId, preco: valor };
}

module.exports = { diagnostico, sincronizar, atualizarDisponibilidade, atualizarPreco, payloadProduto, uuidDeterministico };
