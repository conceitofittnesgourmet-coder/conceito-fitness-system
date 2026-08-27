const Nfe = require("../models/nfe");
const {
  prevalidarNfeDoPedido,
  gerarNfeDoPedido,
  assinarNfe,
  transmitirNfe,
  consultarRetornoNfe,
  consultarStatusSefaz,
  processarNfeDoPedido,
  cancelarNfe,
} = require("../services/nfeService");
const { diagnosticarFiscal } = require("../services/fiscalReadinessService");
const { gerarDanfeNfeHtml } = require("../services/danfeNfeService");

function obterEmpresaId(req) {
  return (
    req.body?.empresaId ||
    req.query?.empresaId ||
    req.usuario?.empresa ||
    req.admin?.empresa ||
    req.user?.empresa ||
    req.empresa?._id ||
    req.empresaId ||
    null
  );
}

exports.diagnostico = async (req, res) => {
  try {
    const diagnostico = await diagnosticarFiscal(obterEmpresaId(req));
    return res.json({ success: true, diagnostico });
  } catch (error) {
    console.error("ERRO DIAGNOSTICO FISCAL:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


exports.statusSefaz = async (req, res) => {
  try {
    const ambiente = req.query.ambiente || "homologacao";
    const status = await consultarStatusSefaz(ambiente);
    return res.json({ success: true, status });
  } catch (error) {
    console.error("ERRO STATUS SEFAZ NFE:", error);
    return res.status(503).json({ success: false, message: error.message });
  }
};

exports.validarPorPedido = async (req, res) => {
  try {
    const resultado = await prevalidarNfeDoPedido({
      pedidoId: req.params.pedidoId,
      empresaId: obterEmpresaId(req),
      ...req.body,
    });

    return res.json({
      success: true,
      message: resultado.homologacao
        ? "Pedido validado para emissão em homologação."
        : "Pedido validado para emissão em produção.",
      validacao: resultado,
    });
  } catch (error) {
    console.error("ERRO VALIDAR NFE:", error);
    return res.status(error.statusCode || 422).json({
      success: false,
      code: error.codigo || error.code || "ERRO_VALIDAR_NFE",
      message: error.message,
      erros: error.erros || [],
    });
  }
};

exports.processarPorPedido = async (req, res) => {
  try {
    const nfe = await processarNfeDoPedido({
      pedidoId: req.params.pedidoId,
      empresaId: obterEmpresaId(req),
      ...req.body,
    });

    return res.status(nfe.status === "autorizada" ? 200 : 202).json({
      success: true,
      message: nfe.status === "autorizada"
        ? "NF-e autorizada pela SEFAZ."
        : nfe.mensagemSefaz || "NF-e enviada para processamento.",
      nfe,
    });
  } catch (error) {
    console.error("ERRO PROCESSAR NFE:", error);
    return res.status(error.statusCode || (error?.code === 11000 ? 409 : 400)).json({
      success: false,
      code: error.codigo || error.code || "ERRO_PROCESSAR_NFE",
      message: error?.code === 11000
        ? "Já existe uma NF-e para este pedido ou esta numeração já foi utilizada."
        : error.message,
      erros: error.erros || [],
    });
  }
};

exports.emitirPorPedido = async (req, res) => {
  try {
    const nfe = await gerarNfeDoPedido({
      pedidoId: req.params.pedidoId,
      empresaId: obterEmpresaId(req),
      ...req.body,
    });

    return res.status(201).json({
      success: true,
      message: "NF-e modelo 55 gerada. Próxima etapa: assinatura e transmissão.",
      nfe,
    });
  } catch (error) {
    console.error("ERRO GERAR NFE:", error);
    return res.status(error?.code === 11000 ? 409 : 400).json({
      success: false,
      message: error?.code === 11000
        ? "Já existe uma NF-e para este pedido ou esta numeração já foi utilizada."
        : error.message,
    });
  }
};

exports.assinarPorId = async (req, res) => {
  try {
    const nfe = await assinarNfe(req.params.id);
    return res.json({ success: true, message: "NF-e assinada.", nfe });
  } catch (error) {
    console.error("ERRO ASSINAR NFE:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.transmitirPorId = async (req, res) => {
  try {
    const nfe = await transmitirNfe(req.params.id);
    return res.json({
      success: true,
      message: nfe.status === "autorizada"
        ? "NF-e autorizada pela SEFAZ."
        : "Transmissão da NF-e processada pela SEFAZ.",
      nfe,
    });
  } catch (error) {
    console.error("ERRO TRANSMITIR NFE:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.consultarPorId = async (req, res) => {
  try {
    const nfe = await consultarRetornoNfe(req.params.id);
    return res.json({ success: true, message: "Consulta SEFAZ realizada.", nfe });
  } catch (error) {
    console.error("ERRO CONSULTAR NFE:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.listar = async (req, res) => {
  try {
    const filtro = {};
    const empresaId = obterEmpresaId(req);
    if (empresaId) filtro.empresa = empresaId;
    if (req.query.status) filtro.status = req.query.status;
    if (req.query.ambiente) filtro.ambiente = req.query.ambiente;

    const nfes = await Nfe.find(filtro)
      .populate("pedido")
      .populate("empresa")
      .sort({ createdAt: -1 });

    return res.json({ success: true, nfes });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.buscarPorPedido = async (req, res) => {
  try {
    const nfe = await Nfe.findOne({ pedido: req.params.pedidoId })
      .populate("pedido")
      .populate("empresa");
    if (!nfe) return res.status(404).json({ success: false, message: "NF-e não encontrada para este pedido." });
    return res.json({ success: true, nfe });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.buscarPorId = async (req, res) => {
  try {
    const nfe = await Nfe.findById(req.params.id).populate("pedido").populate("empresa");
    if (!nfe) return res.status(404).json({ success: false, message: "NF-e não encontrada." });
    return res.json({ success: true, nfe });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelarPorId = async (req, res) => {
  try {
    const justificativa = String(
      req.body?.justificativa || ""
    ).trim();

    if (!justificativa) {
      return res.status(400).json({
        success: false,
        message:
          "A justificativa do cancelamento é obrigatória.",
      });
    }

    const nfe = await cancelarNfe(
      req.params.id,
      justificativa
    );

    return res.json({
      success: true,
      message:
        nfe.mensagemSefaz ||
        "Cancelamento da NF-e processado.",
      nfe,
    });
  } catch (error) {
    console.error(
      "ERRO CANCELAR NFE:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Erro ao cancelar a NF-e.",
    });
  }
};

exports.visualizarXml = async (req, res) => {
  try {
    const nfe = await Nfe.findById(req.params.id);
    if (!nfe) return res.status(404).json({ success: false, message: "NF-e não encontrada." });
    const xml = nfe.xmlAutorizado || nfe.xmlAssinado || nfe.xml || "";
    if (!xml) return res.status(404).json({ success: false, message: "XML ainda não gerado." });
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    return res.send(xml);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.downloadXml = async (req, res) => {
  try {
    const nfe = await Nfe.findById(req.params.id);
    if (!nfe) return res.status(404).json({ success: false, message: "NF-e não encontrada." });
    const xml = nfe.xmlAutorizado || nfe.xmlAssinado || nfe.xml || "";
    if (!xml) return res.status(404).json({ success: false, message: "XML ainda não gerado." });
    res.setHeader("Content-Disposition", `attachment; filename=NFE-${nfe.numero}.xml`);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    return res.send(xml);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.visualizarDanfe = async (req, res) => {
  try {
    const nfe = await Nfe.findById(req.params.id).populate("empresa").populate("pedido");
    if (!nfe) return res.status(404).json({ success: false, message: "NF-e não encontrada." });
    const html = gerarDanfeNfeHtml(nfe);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
