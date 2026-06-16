const ConfiguracaoFiscal = require("../models/configuracaofiscal");

exports.buscarConfiguracao = async (req, res) => {
  try {
    const filtro = {};

    if (req.usuario?.empresa) {
      filtro.empresa = req.usuario.empresa;
    }

    let config = await ConfiguracaoFiscal.findOne(filtro);

    if (!config) {
      config = await ConfiguracaoFiscal.create({
        empresa: req.usuario?.empresa || null,
      });
    }

    return res.json({
      success: true,
      configuracao: config,
    });
  } catch (error) {
    console.log("ERRO CONFIG FISCAL:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.salvarConfiguracao = async (req, res) => {
  try {
    const filtro = {};

    if (req.usuario?.empresa) {
      filtro.empresa = req.usuario.empresa;
    }

    const dados = {
      ambiente: req.body.ambiente || "homologacao",
      serieNfce: Number(req.body.serieNfce || 1),
      proximoNumeroNfce: Number(req.body.proximoNumeroNfce || 1),
      cscId: req.body.cscId || "",
      cscToken: req.body.cscToken || "",
      certificadoConfigurado: Boolean(req.body.certificadoConfigurado),
      credenciadoNfce: Boolean(req.body.credenciadoNfce),
      observacao: req.body.observacao || "",
      empresa: req.usuario?.empresa || null,
    };

    const config = await ConfiguracaoFiscal.findOneAndUpdate(
      filtro,
      dados,
      {
        new: true,
        upsert: true,
      }
    );

    return res.json({
      success: true,
      configuracao: config,
    });
  } catch (error) {
    console.log("ERRO SALVAR CONFIG FISCAL:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};