const Pedido = require("../models/pedido");
const Nfce = require("../models/nfce");
const {
  gerarNfceDoPedido,
  assinarNfce,
  transmitirNfce,
  consultarRetornoNfce,
} = require("../services/nfceService");
const { gerarDanfeNfceHtml } = require("../services/danfeNfceService");

exports.emitirPorPedido = async (req, res) => {
  try {
    const nfce = await gerarNfceDoPedido(req.params.pedidoId);

    return res.status(201).json({
      success: true,
      message: "NFC-e gerada em homologação.",
      nfce,
    });
  } catch (error) {
    console.log("ERRO GERAR NFCE:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.emitirTesteUltimoPedido = async (req, res) => {
  try {
    const pedido = await Pedido.findOne({
  status: { $ne: "cancelado" },
}).sort({ createdAt: -1 });
    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Nenhum pedido encontrado para teste.",
      });
    }

    const nfce = await gerarNfceDoPedido(pedido._id);

    return res.status(201).json({
      success: true,
      message: "NFC-e de teste gerada com base no último pedido.",
      pedido,
      nfce,
    });
  } catch (error) {
    console.log("ERRO GERAR NFCE TESTE:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.listar = async (req, res) => {
  try {
    const nfces = await Nfce.find()
      .populate("pedido")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      nfces,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.buscarPorPedido = async (req, res) => {
  try {
    const nfce = await Nfce.findOne({
      pedido: req.params.pedidoId,
    }).populate("pedido");

    if (!nfce) {
      return res.status(404).json({
        success: false,
        message: "NFC-e não encontrada para este pedido.",
      });
    }

    return res.json({
      success: true,
      nfce,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.buscarPorId = async (req, res) => {
  try {
    const nfce = await Nfce.findById(req.params.id).populate("pedido");

    if (!nfce) {
      return res.status(404).json({
        success: false,
        message: "NFC-e não encontrada.",
      });
    }

    return res.json({
      success: true,
      nfce,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.assinarPorId = async (req, res) => {
  try {
    const nfce = await assinarNfce(req.params.id);

    return res.json({
      success: true,
      message: "NFC-e assinada com sucesso.",
      nfce,
    });
  } catch (error) {
    console.log("ERRO ASSINAR NFCE:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.assinarUltima = async (req, res) => {
  try {
    const nfce = await Nfce.findOne().sort({ createdAt: -1 });

    if (!nfce) {
      return res.status(404).json({
        success: false,
        message: "Nenhuma NFC-e encontrada.",
      });
    }

    const nfceAssinada = await assinarNfce(nfce._id);

    return res.json({
      success: true,
      message: "Última NFC-e assinada com sucesso.",
      nfce: nfceAssinada,
    });
  } catch (error) {
    console.log("ERRO ASSINAR ÚLTIMA NFCE:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.transmitirPorId = async (req, res) => {
  try {

    let nfce = await Nfce.findById(req.params.id);

    if (!nfce) {
      return res.status(404).json({
        success: false,
        message: "NFC-e não encontrada."
      });
    }

    if (!nfce.xmlAssinado) {
      nfce = await assinarNfce(req.params.id);
    }

    nfce = await transmitirNfce(req.params.id);

    return res.json({
      success: true,
      message: "Transmissão enviada para SEFAZ.",
      nfce,
    });

  } catch (error) {
    console.log("ERRO TRANSMITIR NFCE:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.consultarPorId = async (req, res) => {
  try {
    const nfce = await consultarRetornoNfce(req.params.id);

    return res.json({
      success: true,
      message: "Consulta SEFAZ realizada.",
      nfce,
    });
  } catch (error) {
    console.log("ERRO CONSULTAR NFCE:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.visualizarXml = async (req, res) => {
  try {
    const nfce = await Nfce.findById(req.params.id);

    if (!nfce) {
      return res.status(404).json({
        success: false,
        message: "NFC-e não encontrada."
      });
    }

    res.setHeader("Content-Type", "application/xml");

    return res.send(nfce.xmlAssinado || nfce.xml || "");
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.downloadXml = async (req, res) => {
  try {
    const nfce = await Nfce.findById(req.params.id);

    if (!nfce) {
      return res.status(404).json({
        success: false,
        message: "NFC-e não encontrada."
      });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=NFCE-${nfce.numero}.xml`
    );

    res.setHeader(
      "Content-Type",
      "application/xml"
    );

    return res.send(nfce.xmlAssinado || nfce.xml || "");
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.visualizarDanfe = async (req, res) => {
  try {
    const nfce = await Nfce.findById(req.params.id).populate("pedido");

    if (!nfce) {
      return res.status(404).json({
        success: false,
        message: "NFC-e não encontrada.",
      });
    }

    const html = await gerarDanfeNfceHtml(nfce);

    res.setHeader("Content-Type", "text/html; charset=utf-8");

    return res.send(html);
  } catch (error) {
    console.log("ERRO DANFE NFCE:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};