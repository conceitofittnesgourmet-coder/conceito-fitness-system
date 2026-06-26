const Grupo = require("../models/grupocomponente");

function gerarSlug(texto = "") {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

exports.listar = async (req, res) => {
  try {
    const grupos = await Grupo.find().sort({ ordem: 1, nome: 1 });

    res.json({
      success: true,
      grupos,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.buscar = async (req, res) => {
  try {
    const grupo = await Grupo.findById(req.params.id);

    if (!grupo) {
      return res.status(404).json({
        success: false,
        message: "Grupo não encontrado.",
      });
    }

    res.json({
      success: true,
      grupo,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.criar = async (req, res) => {
  try {
    const dados = {
      ...req.body,
      slug: gerarSlug(req.body.nome),
    };

    const existe = await Grupo.findOne({
      slug: dados.slug,
    });

    if (existe) {
      return res.status(400).json({
        success: false,
        message: "Já existe um grupo com este nome.",
      });
    }

    const grupo = await Grupo.create(dados);

    res.status(201).json({
      success: true,
      grupo,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.atualizar = async (req, res) => {
  try {
    if (req.body.nome) {
      req.body.slug = gerarSlug(req.body.nome);
    }

    const grupo = await Grupo.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    res.json({
      success: true,
      grupo,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.excluir = async (req, res) => {
  try {
    await Grupo.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};