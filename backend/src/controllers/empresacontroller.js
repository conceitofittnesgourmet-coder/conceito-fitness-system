const Empresa = require("../models/empresa");

exports.buscarEmpresa = async (req, res) => {
  try {
    let empresa = await Empresa.findOne();

    if (!empresa) {
      empresa = await Empresa.create({
        nomeFantasia: "Conceito Fitness Gourmet",
      });
    }

    return res.json({
      success: true,
      empresa,
    });
  } catch (error) {
    console.log("ERRO BUSCAR EMPRESA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.salvarEmpresa = async (req, res) => {
  try {
    let empresa = await Empresa.findOne();

    if (!empresa) {
      empresa = await Empresa.create(req.body);
    } else {
      empresa = await Empresa.findByIdAndUpdate(
        empresa._id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );
    }

    return res.json({
      success: true,
      empresa,
    });
  } catch (error) {
    console.log("ERRO SALVAR EMPRESA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};