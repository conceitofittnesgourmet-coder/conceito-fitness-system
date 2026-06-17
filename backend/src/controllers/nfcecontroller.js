const Pedido = require("../models/pedido");
const Nfce = require("../models/nfce");
const { gerarNfceDoPedido } = require("../services/nfceService");

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