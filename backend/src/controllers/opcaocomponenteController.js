const Opcao = require("../models/opcaocomponente");

exports.listar = async (req, res) => {
  try {
    const filtro = {};

    if (req.query.grupo) {
      filtro.grupo = req.query.grupo;
    }

    const opcoes = await Opcao.find(filtro)
      .populate("grupo")
      .sort({
        ordem: 1,
        nome: 1,
      });

    res.json({
      success: true,
      opcoes,
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
    const opcao = await Opcao.findById(req.params.id).populate("grupo");

    if (!opcao) {
      return res.status(404).json({
        success: false,
        message: "Opção não encontrada.",
      });
    }

    res.json({
      success: true,
      opcao,
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
    const opcao = await Opcao.create(req.body);

    res.status(201).json({
      success: true,
      opcao,
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
    const opcao = await Opcao.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    res.json({
      success: true,
      opcao,
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
    await Opcao.findByIdAndDelete(req.params.id);

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