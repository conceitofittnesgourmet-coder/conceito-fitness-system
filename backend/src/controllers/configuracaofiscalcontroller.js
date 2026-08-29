const ConfiguracaoFiscal = require("../models/configuracaofiscal");
const Empresa = require("../models/empresa");
const { validarCertificadoA1 } = require("../services/certificadoservice");

exports.buscarConfiguracao = async (req, res) => {
  try {

    console.log("=== CONFIG FISCAL ===");
    console.log("REQ.USUARIO:", req.usuario);
    console.log("REQ.EMPRESA:", req.empresa);
    
   const filtro = {};

    let config = await ConfiguracaoFiscal.findOne(filtro);

if (config && !config.empresa) {
  const empresa = await Empresa.findOne().lean();

  if (empresa) {
    config.empresa = empresa._id;
    await config.save();
  }
}
    
    console.log("FILTRO:", filtro);
    console.log("CONFIG ENCONTRADA:", config);

    if (!config) {
      config = await ConfiguracaoFiscal.create({});
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

    const atual = await ConfiguracaoFiscal.findOne(filtro);

    const manterNumero = (campo, padrao = 1) => {
      if (req.body[campo] !== undefined && req.body[campo] !== null && req.body[campo] !== "") {
        return Number(req.body[campo]);
      }

      if (atual && atual[campo] !== undefined && atual[campo] !== null) {
        return Number(atual[campo]);
      }

      return padrao;
    };

    const manterTexto = (campo, padrao = "") => {
      if (req.body[campo] !== undefined && req.body[campo] !== null) {
        return req.body[campo];
      }

      if (atual && atual[campo] !== undefined && atual[campo] !== null) {
        return atual[campo];
      }

      return padrao;
    };

    const manterBooleano = (campo, padrao = false) => {
      if (req.body[campo] !== undefined) {
        return Boolean(req.body[campo]);
      }

      if (atual && atual[campo] !== undefined) {
        return Boolean(atual[campo]);
      }

      return padrao;
    };

    const dados = {
      ambiente: manterTexto("ambiente", "homologacao"),

      serieNfce: manterNumero("serieNfce", 1),
      proximoNumeroNfce: manterNumero("proximoNumeroNfce", 1),

      serieNfe: manterNumero("serieNfe", 1),
      proximoNumeroNfe: manterNumero("proximoNumeroNfe", 1),

      serieNfeProducao: manterNumero("serieNfeProducao", 1),
      proximoNumeroNfeProducao: manterNumero("proximoNumeroNfeProducao", 1),

      cscId: manterTexto("cscId", ""),
      cscToken: manterTexto("cscToken", ""),

      certificadoConfigurado: manterBooleano("certificadoConfigurado", false),
      credenciadoNfce: manterBooleano("credenciadoNfce", false),
      credenciadoNfe: manterBooleano("credenciadoNfe", false),

      observacao: manterTexto("observacao", ""),
    };

    const config = await ConfiguracaoFiscal.findOneAndUpdate(
      filtro,
      { $set: dados },
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

exports.statusFiscal = async (req, res) => {
  try {
    const certificado = validarCertificadoA1();

    return res.json({
      success: true,
      certificado,
      ambiente: process.env.NFCE_AMBIENTE || "homologacao",
      uf: process.env.NFCE_UF || "PR",
      cscConfigurado: Boolean(process.env.NFCE_CSC),
      cscIdConfigurado: Boolean(process.env.NFCE_CSC_ID),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};