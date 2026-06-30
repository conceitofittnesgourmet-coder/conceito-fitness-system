const MateriaPrima = require("../models/materiaprima");

exports.listar = async (req, res) => {
  try {
    const materias = await MateriaPrima.find().sort({ nome: 1 });

    return res.json({
      success: true,
      materias,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.criar = async (req, res) => {
  try {
    const materia = await MateriaPrima.create(req.body);

    return res.status(201).json({
      success: true,
      materia,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const materia = await MateriaPrima.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    return res.json({
      success: true,
      materia,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.excluir = async (req, res) => {
  try {
    await MateriaPrima.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Matéria-prima excluída.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};