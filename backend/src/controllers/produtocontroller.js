const cloudinary = require("../config/cloudinary");
const fs = require("fs-extra");
const Produto = require("../models/produto");
const ProdutoService = require("../services/ProdutoService");
const ConfiguracaoProdutoService = require("../services/ConfiguracaoProdutoService");

async function uploadImagens(files = []) {
  const imagens = [];
  for (const file of files) {
    try {
      const resultado = await cloudinary.uploader.upload(file.path, {
        folder: "conceito-fitness/produtos",
      });
      imagens.push({
        url: resultado.secure_url,
        public_id: resultado.public_id,
        filename: file.filename,
      });
    } finally {
      if (file.path) await fs.remove(file.path).catch(() => {});
    }
  }
  return imagens;
}

async function removerImagensCloudinary(imagens = []) {
  for (const imagem of imagens) {
    if (!imagem?.public_id) continue;
    try {
      await cloudinary.uploader.destroy(imagem.public_id);
    } catch (error) {
      console.error("Erro ao remover imagem do Cloudinary:", error.message);
    }
  }
}

function responderErro(res, error, contexto) {
  console.error(contexto, error);
  const status = error?.name === "ValidationError" ? 400 : 500;
  return res.status(status).json({
    success: false,
    message: error.message || "Erro interno do servidor",
  });
}

const criarProduto = async (req, res) => {
  try {
    const { nome, preco, estoque } = req.body || {};
    if (!nome || preco === undefined || preco === null || preco === "" || estoque === undefined || estoque === null || estoque === "") {
      return res.status(400).json({
        success: false,
        message: "Nome, preço e estoque são obrigatórios",
      });
    }

    const imagens = await uploadImagens(req.files || []);
    const produto = await ProdutoService.criarProduto(req.body, imagens);

    if (global.io) global.io.emit("produto-criado", produto);
    return res.status(201).json({
      success: true,
      message: "Produto criado com sucesso",
      produto,
    });
  } catch (error) {
    return responderErro(res, error, "ERRO CRIAR PRODUTO:");
  }
};

const listarProdutos = async (req, res) => {
  try {
    const { search, destaque, ativo, page = 1, limit = 9999 } = req.query;
    const filtro = {};
    if (search) filtro.nome = { $regex: search, $options: "i" };
    if (destaque !== undefined) {
      const valor = destaque === "true";
      filtro.$or = [
        { destaque: valor },
        { "publicacao.destaque": valor },
        { "publicacao.destaques.destaque": valor },
      ];
    }
    if (ativo !== undefined) filtro.ativo = ativo === "true";

    const pagina = Math.max(1, Number(page) || 1);
    const limite = Math.min(10000, Math.max(1, Number(limit) || 9999));
    const [produtos, total] = await Promise.all([
      Produto.find(filtro).sort({ createdAt: -1 }).skip((pagina - 1) * limite).limit(limite),
      Produto.countDocuments(filtro),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pagina,
      pages: Math.ceil(total / limite),
      produtos: produtos.map(ProdutoService.formatarProdutoPublico),
    });
  } catch (error) {
    return responderErro(res, error, "ERRO LISTAR PRODUTOS:");
  }
};

const listarProdutosCardapio = async (req, res) => {
  try {
    const { search, categoria, destaque, novidade, promocao, exclusivoClube } = req.query;
    const condicoes = [
      { ativo: true },
      {
        $or: [
          { "publicacao.canais.cardapio": { $ne: false } },
          { "publicacao.cardapioOnline": { $ne: false } },
        ],
      },
    ];

    if (search) {
      condicoes.push({
        $or: [
          { nome: { $regex: search, $options: "i" } },
          { descricao: { $regex: search, $options: "i" } },
        ],
      });
    }
    if (categoria) {
      const regex = { $regex: `^${categoria.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" };
      condicoes.push({ $or: [{ categoria: regex }, { categorias: { $elemMatch: regex } }] });
    }
    if (destaque === "true") {
      condicoes.push({
        $or: [
          { "publicacao.destaques.destaque": true },
          { "publicacao.destaque": true },
          { destaque: true },
        ],
      });
    }
    if (novidade === "true") {
      condicoes.push({
        $or: [
          { "publicacao.destaques.novidade": true },
          { "publicacao.novidade": true },
        ],
      });
    }
    if (promocao === "true") {
      condicoes.push({
        $or: [
          { "publicacao.promocaoDetalhada.ativa": true },
          { "publicacao.promocao": true },
        ],
      });
    }
    if (exclusivoClube === "true") {
      condicoes.push({
        $or: [
          { "publicacao.destaques.exclusivoClube": true },
          { "publicacao.exclusivoClube": true },
        ],
      });
    }

    const produtos = await Produto.find({ $and: condicoes }).sort({
      "publicacao.prioridadeExibicao": 1,
      "publicacao.ordem": 1,
      destaque: -1,
      createdAt: -1,
    });

    const produtosFormatados = produtos
      .map(ProdutoService.formatarProdutoPublico)
      .filter((produto) => !(
        produto.disponivel === false &&
        produto.disponibilidade?.ocultarQuandoIndisponivel === true
      ));

    const categoriasMap = new Map();
    for (const produto of produtosFormatados) {
      for (const nome of [produto.categoria, ...(produto.categorias || [])].filter(Boolean)) {
        const chave = String(nome).trim().toLowerCase();
        if (!categoriasMap.has(chave)) categoriasMap.set(chave, String(nome).trim());
      }
    }

    return res.status(200).json({
      success: true,
      total: produtosFormatados.length,
      categorias: Array.from(categoriasMap.values()).sort((a, b) => a.localeCompare(b, "pt-BR")),
      produtos: produtosFormatados,
    });
  } catch (error) {
    return responderErro(res, error, "ERRO LISTAR CARDÁPIO:");
  }
};

const buscarProduto = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ success: false, message: "Produto não encontrado" });
    return res.status(200).json({ success: true, produto });
  } catch (error) {
    return responderErro(res, error, "ERRO BUSCAR PRODUTO:");
  }
};

const atualizarProduto = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ success: false, message: "Produto não encontrado" });

    let novasImagens;
    const imagensAntigas = produto.imagens || [];
    if (req.files?.length) novasImagens = await uploadImagens(req.files);

    const produtoAtualizado = await ProdutoService.atualizarProduto(
      produto,
      req.body || {},
      novasImagens
    );

    if (novasImagens) await removerImagensCloudinary(imagensAntigas);
    if (global.io) global.io.emit("produto-atualizado", produtoAtualizado);

    return res.status(200).json({
      success: true,
      message: "Produto atualizado com sucesso",
      produto: produtoAtualizado,
    });
  } catch (error) {
    return responderErro(res, error, "ERRO ATUALIZAR PRODUTO:");
  }
};

const atualizarPublicacaoProduto = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ success: false, message: "Produto não encontrado" });

    const body = { ...req.body };
    if (body.canal && body.publicado !== undefined) {
      const mapaCanais = {
        pdv: "pdv",
        cardapioOnline: "cardapio",
        cardapio: "cardapio",
        whatsapp: "whatsapp",
        ifood: "ifood",
        aiqfome: "aiqfome",
        site: "site",
      };
      const canal = mapaCanais[body.canal];
      if (canal) {
        const atual = produto.publicacao?.toObject?.() || produto.publicacao || {};
        body.publicacao = {
          ...atual,
          canais: {
            ...(atual.canais || {}),
            [canal]: ProdutoService.parseBoolean(body.publicado),
          },
        };
      }
    }

    const publicacaoRecebida = ProdutoService.parseJsonSeguro(body.publicacao, {});
    for (const campo of ["destaque", "novidade", "maisVendido", "exclusivoClube"]) {
      if (body[campo] !== undefined) {
        publicacaoRecebida[campo] = ProdutoService.parseBoolean(body[campo]);
        publicacaoRecebida.destaques = {
          ...(publicacaoRecebida.destaques || {}),
          [campo]: ProdutoService.parseBoolean(body[campo]),
        };
      }
    }
    if (body.promocao !== undefined) {
      publicacaoRecebida.promocao = ProdutoService.parseBoolean(body.promocao);
      publicacaoRecebida.promocaoDetalhada = {
        ...(publicacaoRecebida.promocaoDetalhada || {}),
        ativa: ProdutoService.parseBoolean(body.promocao),
      };
    }
    if (body.ordem !== undefined) {
      publicacaoRecebida.ordem = ProdutoService.parseNumero(body.ordem, 0);
      publicacaoRecebida.prioridadeExibicao = ProdutoService.parseNumero(body.ordem, 0);
    }

    const disponibilidadeRecebida = ProdutoService.parseJsonSeguro(body.disponibilidade, {});
    if (body.disponivel !== undefined) disponibilidadeRecebida.disponivel = ProdutoService.parseBoolean(body.disponivel);
    if (body.motivoIndisponibilidade !== undefined) disponibilidadeRecebida.motivoIndisponibilidade = body.motivoIndisponibilidade || "";
    if (body.pausadoAte !== undefined) disponibilidadeRecebida.pausadoAte = body.pausadoAte || null;

    const dados = {
      publicacao: publicacaoRecebida,
      disponibilidade: disponibilidadeRecebida,
    };
    if (body.ativo !== undefined) dados.ativo = body.ativo;

    const produtoAtualizado = await ProdutoService.atualizarProduto(produto, dados);
    if (global.io) global.io.emit("produto-publicacao-atualizada", produtoAtualizado);

    return res.status(200).json({
      success: true,
      message: "Publicação do produto atualizada",
      produto: produtoAtualizado,
    });
  } catch (error) {
    return responderErro(res, error, "ERRO ATUALIZAR PUBLICAÇÃO:");
  }
};


function normalizarFiscal(valor = {}) {
  const somenteNumeros = (v, limite) => String(v ?? "").replace(/\D/g, "").slice(0, limite);
  const campos = {};

  if (valor.ncm !== undefined) campos.ncm = somenteNumeros(valor.ncm, 8);
  if (valor.cest !== undefined) campos.cest = somenteNumeros(valor.cest, 7);
  if (valor.cfopInterno !== undefined) campos.cfopInterno = somenteNumeros(valor.cfopInterno, 4);
  if (valor.cfopInterestadual !== undefined) campos.cfopInterestadual = somenteNumeros(valor.cfopInterestadual, 4);
  if (valor.csosn !== undefined) campos.csosn = somenteNumeros(valor.csosn, 3);
  if (valor.cstIcms !== undefined) campos.cstIcms = somenteNumeros(valor.cstIcms, 3);
  if (valor.origemMercadoria !== undefined) campos.origemMercadoria = somenteNumeros(valor.origemMercadoria, 1);
  if (valor.codigoBeneficioFiscal !== undefined) campos.codigoBeneficioFiscal = String(valor.codigoBeneficioFiscal || "").trim().toUpperCase();
  if (valor.unidadeComercial !== undefined) campos.unidadeComercial = String(valor.unidadeComercial || "UN").trim().toUpperCase();
  if (valor.unidadeTributavel !== undefined) campos.unidadeTributavel = String(valor.unidadeTributavel || "UN").trim().toUpperCase();
  if (valor.cstPis !== undefined) campos.cstPis = somenteNumeros(valor.cstPis, 2);
  if (valor.cstCofins !== undefined) campos.cstCofins = somenteNumeros(valor.cstCofins, 2);
  if (valor.emitirNfce !== undefined) campos.emitirNfce = Boolean(valor.emitirNfce);

  return campos;
}

function analisarSituacaoFiscal(produto) {
  const fiscal = produto?.dadosFiscais || {};
  const pendencias = [];
  if (String(fiscal.ncm || "").replace(/\D/g, "").length !== 8) pendencias.push("NCM");
  if (String(fiscal.cfopInterno || "").replace(/\D/g, "").length !== 4) pendencias.push("CFOP");
  if (!String(fiscal.origemMercadoria ?? "").trim()) pendencias.push("Origem");
  if (!String(fiscal.csosn || fiscal.cstIcms || "").trim()) pendencias.push("CSOSN/CST");
  return {
    status: pendencias.length === 0 ? "completo" : pendencias.length <= 2 ? "atencao" : "incompleto",
    pendencias,
  };
}

const listarCadastroFiscal = async (req, res) => {
  try {
    const { search = "", status = "todos", ativo = "todos" } = req.query;
    const filtro = {};
    if (search) filtro.nome = { $regex: search, $options: "i" };
    if (ativo !== "todos") filtro.ativo = ativo === "true";

    const produtos = await Produto.find(filtro)
      .select("nome categoria categorias sku codigoBarras ativo dadosFiscais historicoFiscal updatedAt")
      .sort({ nome: 1 });

    let resultado = produtos.map((produto) => {
      const analise = analisarSituacaoFiscal(produto);
      return {
        _id: produto._id,
        nome: produto.nome,
        categoria: produto.categoria,
        categorias: produto.categorias,
        sku: produto.sku,
        codigoBarras: produto.codigoBarras,
        ativo: produto.ativo,
        dadosFiscais: produto.dadosFiscais || {},
        statusFiscal: analise.status,
        pendenciasFiscais: analise.pendencias,
        ultimaAlteracaoFiscal: produto.historicoFiscal?.at(-1) || null,
        updatedAt: produto.updatedAt,
      };
    });

    if (status !== "todos") resultado = resultado.filter((item) => item.statusFiscal === status);

    const resumo = resultado.reduce((acc, item) => {
      acc.total += 1;
      acc[item.statusFiscal] += 1;
      for (const pendencia of item.pendenciasFiscais) {
        if (pendencia === "NCM") acc.semNcm += 1;
        if (pendencia === "CFOP") acc.semCfop += 1;
        if (pendencia === "CSOSN/CST") acc.semTributacao += 1;
      }
      return acc;
    }, { total: 0, completo: 0, atencao: 0, incompleto: 0, semNcm: 0, semCfop: 0, semTributacao: 0 });

    return res.json({ success: true, resumo, produtos: resultado });
  } catch (error) {
    return responderErro(res, error, "ERRO LISTAR CADASTRO FISCAL:");
  }
};

const atualizarFiscalEmLote = async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(Boolean) : [];
    const campos = normalizarFiscal(req.body?.dadosFiscais || {});

    if (!ids.length) return res.status(400).json({ success: false, message: "Selecione pelo menos um produto" });
    if (!Object.keys(campos).length) return res.status(400).json({ success: false, message: "Informe pelo menos um campo fiscal" });

    const set = {};
    for (const [campo, valor] of Object.entries(campos)) set[`dadosFiscais.${campo}`] = valor;

    const alteradoPor = req.admin?.nome || req.admin?.email || req.admin?.id || "Administrador";
    const historico = { alteradoEm: new Date(), alteradoPor: String(alteradoPor), origem: "cadastro_fiscal_lote", campos };

    const resultado = await Produto.updateMany(
      { _id: { $in: ids } },
      { $set: set, $push: { historicoFiscal: { $each: [historico], $slice: -50 } } },
      { runValidators: true }
    );

    if (global.io) global.io.emit("produtos-fiscais-atualizados", { ids, campos });

    return res.json({
      success: true,
      message: `${resultado.modifiedCount || 0} produto(s) atualizado(s) com sucesso`,
      selecionados: ids.length,
      modificados: resultado.modifiedCount || 0,
    });
  } catch (error) {
    return responderErro(res, error, "ERRO ATUALIZAR FISCAL EM LOTE:");
  }
};

const atualizarFiscalIndividual = async (req, res) => {
  try {
    const campos = normalizarFiscal(req.body?.dadosFiscais || req.body || {});
    if (!Object.keys(campos).length) return res.status(400).json({ success: false, message: "Informe pelo menos um campo fiscal" });

    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ success: false, message: "Produto não encontrado" });

    produto.dadosFiscais = { ...(produto.dadosFiscais?.toObject?.() || produto.dadosFiscais || {}), ...campos };
    produto.historicoFiscal.push({
      alteradoEm: new Date(),
      alteradoPor: String(req.admin?.nome || req.admin?.email || req.admin?.id || "Administrador"),
      origem: "cadastro_fiscal_individual",
      campos,
    });
    if (produto.historicoFiscal.length > 50) produto.historicoFiscal = produto.historicoFiscal.slice(-50);
    await produto.save();

    return res.json({ success: true, message: "Dados fiscais atualizados", produto, analise: analisarSituacaoFiscal(produto) });
  } catch (error) {
    return responderErro(res, error, "ERRO ATUALIZAR FISCAL INDIVIDUAL:");
  }
};


function normalizarCadastroMestre(valor = {}) {
  const texto = (v) => String(v ?? "").trim();
  const numero = (v, padrao = 0) => {
    if (v === undefined || v === null || v === "") return padrao;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : padrao;
  };
  const booleano = (v, padrao = false) => {
    if (v === undefined || v === null || v === "") return padrao;
    if (typeof v === "boolean") return v;
    return ["true", "1", "sim", "yes"].includes(String(v).toLowerCase());
  };

  return {
    marca: texto(valor.marca),
    fabricante: texto(valor.fabricante),
    referenciaInterna: texto(valor.referenciaInterna),
    comercial: {
      precoPromocional: Math.max(0, numero(valor.comercial?.precoPromocional)),
      vendaMinima: Math.max(0.001, numero(valor.comercial?.vendaMinima, 1)),
      permiteDesconto: booleano(valor.comercial?.permiteDesconto, true),
    },
    producao: {
      controlaProducao: booleano(valor.producao?.controlaProducao),
      rendimentoPadrao: Math.max(0.001, numero(valor.producao?.rendimentoPadrao, 1)),
      unidadeRendimento: texto(valor.producao?.unidadeRendimento || "UN").toUpperCase(),
      pesoFinalGramas: Math.max(0, numero(valor.producao?.pesoFinalGramas)),
      perdaPercentual: Math.min(100, Math.max(0, numero(valor.producao?.perdaPercentual))),
    },
    estoque: {
      controlaEstoque: booleano(valor.estoque?.controlaEstoque, true),
      estoqueMaximo: Math.max(0, numero(valor.estoque?.estoqueMaximo)),
      localizacao: texto(valor.estoque?.localizacao),
    },
    cardapio: {
      nomePublico: texto(valor.cardapio?.nomePublico),
      descricaoCurta: texto(valor.cardapio?.descricaoCurta).slice(0, 240),
      ordemExibicao: Math.max(0, Math.trunc(numero(valor.cardapio?.ordemExibicao))),
    },
    marketplaces: {
      ifoodCodigo: texto(valor.marketplaces?.ifoodCodigo),
      aiqfomeCodigo: texto(valor.marketplaces?.aiqfomeCodigo),
    },
  };
}

function analisarCadastroMestre(produto) {
  const mestre = produto?.cadastroMestre || {};
  const pendencias = [];
  if (!String(produto?.sku || "").trim()) pendencias.push("SKU");
  if (!String(produto?.codigoBarras || "").trim()) pendencias.push("Código de barras");
  if (!String(mestre?.cardapio?.nomePublico || produto?.nome || "").trim()) pendencias.push("Nome público");
  if (Number(produto?.preco || 0) <= 0) pendencias.push("Preço de venda");
  if (Number(produto?.custo || 0) <= 0) pendencias.push("Custo/CMV");
  if (mestre?.producao?.controlaProducao && Number(mestre?.producao?.rendimentoPadrao || 0) <= 0) pendencias.push("Rendimento");
  return {
    status: pendencias.length === 0 ? "completo" : pendencias.length <= 2 ? "atencao" : "incompleto",
    pendencias,
    percentual: Math.max(0, Math.round(((6 - Math.min(6, pendencias.length)) / 6) * 100)),
  };
}

const listarCadastroMestre = async (req, res) => {
  try {
    const { search = "", status = "todos", ativo = "todos" } = req.query;
    const filtro = {};
    if (search) filtro.$or = [
      { nome: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { codigoBarras: { $regex: search, $options: "i" } },
    ];
    if (ativo !== "todos") filtro.ativo = ativo === "true";

    const produtos = await Produto.find(filtro)
      .select("nome categoria sku codigoBarras preco custo estoque estoqueMinimo ativo cadastroMestre dadosFiscais informacoesNutricionais selos imagens updatedAt")
      .sort({ nome: 1 });

    let itens = produtos.map((produto) => ({
      ...produto.toObject(),
      diagnosticoCadastro: analisarCadastroMestre(produto),
    }));
    if (status !== "todos") itens = itens.filter((item) => item.diagnosticoCadastro.status === status);

    const resumo = itens.reduce((acc, item) => {
      acc.total += 1;
      acc[item.diagnosticoCadastro.status] += 1;
      acc.percentualMedio += item.diagnosticoCadastro.percentual;
      return acc;
    }, { total: 0, completo: 0, atencao: 0, incompleto: 0, percentualMedio: 0 });
    resumo.percentualMedio = resumo.total ? Math.round(resumo.percentualMedio / resumo.total) : 0;

    return res.json({ success: true, resumo, produtos: itens });
  } catch (error) {
    return responderErro(res, error, "ERRO LISTAR CADASTRO MESTRE:");
  }
};

const atualizarCadastroMestre = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ success: false, message: "Produto não encontrado" });

    const campos = normalizarCadastroMestre(req.body?.cadastroMestre || req.body || {});
    const alteradoPor = String(req.admin?.nome || req.admin?.email || req.admin?.id || "Administrador");
    produto.cadastroMestre = { ...campos, atualizadoEm: new Date(), atualizadoPor: alteradoPor };
    produto.historicoCadastroMestre.push({ alteradoEm: new Date(), alteradoPor, campos });
    if (produto.historicoCadastroMestre.length > 50) produto.historicoCadastroMestre = produto.historicoCadastroMestre.slice(-50);
    await produto.save();

    return res.json({
      success: true,
      message: "Cadastro mestre atualizado com sucesso",
      produto,
      diagnosticoCadastro: analisarCadastroMestre(produto),
    });
  } catch (error) {
    return responderErro(res, error, "ERRO ATUALIZAR CADASTRO MESTRE:");
  }
};


const buscarPersonalizacoesProduto = async (req, res) => {
  try {
    const dados = await ConfiguracaoProdutoService.buscarConfiguracao(req.params.id);
    return res.json({ success: true, ...dados });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

const salvarPersonalizacoesProduto = async (req, res) => {
  try {
    const usuario = String(req.admin?.nome || req.admin?.email || req.admin?.id || "Administrador");
    const dados = await ConfiguracaoProdutoService.salvarConfiguracao(req.params.id, req.body || {}, usuario);
    if (global.io) global.io.emit("produto-personalizacoes-atualizadas", { produtoId: req.params.id });
    return res.json({ success: true, message: "Personalizações atualizadas com sucesso.", ...dados });
  } catch (error) {
    const status = error.status || (error.name === "ValidationError" ? 400 : 500);
    return res.status(status).json({ success: false, message: error.message });
  }
};

const copiarPersonalizacoesProduto = async (req, res) => {
  try {
    const origemId = String(req.body?.origemId || "");
    if (!origemId) return res.status(400).json({ success: false, message: "Informe o produto de origem." });
    const usuario = String(req.admin?.nome || req.admin?.email || req.admin?.id || "Administrador");
    const dados = await ConfiguracaoProdutoService.copiarConfiguracao(origemId, req.params.id, usuario);
    if (global.io) global.io.emit("produto-personalizacoes-atualizadas", { produtoId: req.params.id });
    return res.json({ success: true, message: "Configuração copiada com sucesso.", ...dados });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

const deletarProduto = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ success: false, message: "Produto não encontrado" });

    await removerImagensCloudinary(produto.imagens || []);
    await produto.deleteOne();
    if (global.io) global.io.emit("produto-deletado", req.params.id);

    return res.status(200).json({ success: true, message: "Produto deletado com sucesso" });
  } catch (error) {
    return responderErro(res, error, "ERRO DELETAR PRODUTO:");
  }
};

module.exports = {
  criarProduto,
  listarProdutos,
  listarProdutosCardapio,
  buscarProduto,
  atualizarProduto,
  atualizarPublicacaoProduto,
  listarCadastroFiscal,
  atualizarFiscalEmLote,
  atualizarFiscalIndividual,
  listarCadastroMestre,
  atualizarCadastroMestre,
  buscarPersonalizacoesProduto,
  salvarPersonalizacoesProduto,
  copiarPersonalizacoesProduto,
  deletarProduto,
};
