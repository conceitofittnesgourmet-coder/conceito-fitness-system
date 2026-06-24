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

exports.listarCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.find()
      .sort({ ordem: 1, nome: 1 });

    return res.json({
      success: true,
      total: categorias.length,
      categorias,
    });
  } catch (error) {
    console.error(error);

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
      tipo,
      ordem,
      ativo,
    } = req.body;

    if (!nome) {
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
      nome,
      slug,
      descricao: descricao || "",
      tipo: tipo || "produto",
      ordem: Number(ordem || 0),
      ativo:
        ativo === undefined
          ? true
          : ativo,
    });

    return res.status(201).json({
      success: true,
      categoria,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Erro ao criar categoria.",
    });
  }
};

exports.buscarCategoria = async (req, res) => {
  try {
    const categoria =
      await Categoria.findById(req.params.id);

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
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Erro ao buscar categoria.",
    });
  }
};

exports.atualizarCategoria = async (req, res) => {
  try {
    const {
      nome,
      descricao,
      tipo,
      ordem,
      ativo,
    } = req.body;

    const categoria =
      await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoria não encontrada.",
      });
    }

    if (nome) {
      categoria.nome = nome;
      categoria.slug = gerarSlug(nome);
    }

    if (descricao !== undefined)
      categoria.descricao = descricao;

    if (tipo !== undefined)
      categoria.tipo = tipo;

    if (ordem !== undefined)
      categoria.ordem = Number(ordem);

    if (ativo !== undefined)
      categoria.ativo = ativo;

    await categoria.save();

    return res.json({
      success: true,
      categoria,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Erro ao atualizar categoria.",
    });
  }
};

exports.excluirCategoria = async (req, res) => {
  try {
    const categoria =
      await Categoria.findById(req.params.id);

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
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Erro ao excluir categoria.",
    });
  }
};