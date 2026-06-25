const Categoria = require("../models/categoria");

function gerarSlug(texto = "") {
  return texto
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

function converterBoolean(valor, padrao = true) {
  if (valor === undefined || valor === null || valor === "") return padrao;
  if (valor === true || valor === "true") return true;
  if (valor === false || valor === "false") return false;
  return Boolean(valor);
}

exports.listarCategorias = async (req, res) => {
  try {
    const { ativo, tipo, mostrarPdv, mostrarCardapio, mostrarDelivery } = req.query;

    const filtro = {};

    if (ativo !== undefined) filtro.ativo = ativo === "true";
    if (tipo) filtro.tipo = tipo;
    if (mostrarPdv !== undefined) filtro.mostrarPdv = mostrarPdv === "true";
    if (mostrarCardapio !== undefined) filtro.mostrarCardapio = mostrarCardapio === "true";
    if (mostrarDelivery !== undefined) filtro.mostrarDelivery = mostrarDelivery === "true";

    const categorias = await Categoria.find(filtro).sort({ ordem: 1, nome: 1 });

    return res.json({
      success: true,
      total: categorias.length,
      categorias,
    });
  } catch (error) {
    console.error("ERRO LISTAR CATEGORIAS:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao listar categorias.",
    });
  }
};

exports.criarCategoria = async (req, res) => {
  try {
    const {
      nome,
      descricao,
      icone,
      cor,
      tipo,
      ordem,
      ativo,
      mostrarPdv,
      mostrarCardapio,
      mostrarDelivery,
    } = req.body;

    if (!nome || !String(nome).trim()) {
      return res.status(400).json({
        success: false,
        message: "Nome é obrigatório.",
      });
    }

    const slug = gerarSlug(nome);

    const existe = await Categoria.findOne({ slug });

    if (existe) {
      return res.status(400).json({
        success: false,
        message: "Categoria já cadastrada.",
      });
    }

    const categoria = await Categoria.create({
      nome: String(nome).trim(),
      slug,
      descricao: descricao || "",
      icone: icone || "",
      cor: cor || "#22c55e",
      tipo: tipo || "produto",
      ordem: Number(ordem || 0),
      ativo: converterBoolean(ativo, true),
      mostrarPdv: converterBoolean(mostrarPdv, true),
      mostrarCardapio: converterBoolean(mostrarCardapio, true),
      mostrarDelivery: converterBoolean(mostrarDelivery, true),
    });

    return res.status(201).json({
      success: true,
      message: "Categoria criada com sucesso.",
      categoria,
    });
  } catch (error) {
    console.error("ERRO CRIAR CATEGORIA:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Erro ao criar categoria.",
    });
  }
};

exports.buscarCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoria não encontrada.",
      });
    }

    return res.json({
      success: true,
      categoria,
    });
  } catch (error) {
    console.error("ERRO BUSCAR CATEGORIA:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao buscar categoria.",
    });
  }
};

exports.atualizarCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoria não encontrada.",
      });
    }

    const {
      nome,
      descricao,
      icone,
      cor,
      tipo,
      ordem,
      ativo,
      mostrarPdv,
      mostrarCardapio,
      mostrarDelivery,
    } = req.body;

    if (nome !== undefined && String(nome).trim()) {
      const novoSlug = gerarSlug(nome);

      const categoriaDuplicada = await Categoria.findOne({
        slug: novoSlug,
        _id: { $ne: categoria._id },
      });

      if (categoriaDuplicada) {
        return res.status(400).json({
          success: false,
          message: "Já existe outra categoria com esse nome.",
        });
      }

      categoria.nome = String(nome).trim();
      categoria.slug = novoSlug;
    }

    if (descricao !== undefined) categoria.descricao = descricao;
    if (icone !== undefined) categoria.icone = icone;
    if (cor !== undefined) categoria.cor = cor || "#22c55e";
    if (tipo !== undefined) categoria.tipo = tipo;
    if (ordem !== undefined) categoria.ordem = Number(ordem || 0);
    if (ativo !== undefined) categoria.ativo = converterBoolean(ativo, categoria.ativo);
    if (mostrarPdv !== undefined) categoria.mostrarPdv = converterBoolean(mostrarPdv, categoria.mostrarPdv);
    if (mostrarCardapio !== undefined) categoria.mostrarCardapio = converterBoolean(mostrarCardapio, categoria.mostrarCardapio);
    if (mostrarDelivery !== undefined) categoria.mostrarDelivery = converterBoolean(mostrarDelivery, categoria.mostrarDelivery);

    await categoria.save();

    return res.json({
      success: true,
      message: "Categoria atualizada com sucesso.",
      categoria,
    });
  } catch (error) {
    console.error("ERRO ATUALIZAR CATEGORIA:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Erro ao atualizar categoria.",
    });
  }
};

exports.excluirCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoria não encontrada.",
      });
    }

    await categoria.deleteOne();

    return res.json({
      success: true,
      message: "Categoria excluída com sucesso.",
    });
  } catch (error) {
    console.error("ERRO EXCLUIR CATEGORIA:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao excluir categoria.",
    });
  }
};