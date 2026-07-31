const IfoodConfiguracao = require("../models/ifoodconfiguracao");
const { criptografar } = require("../services/IfoodCryptoService");
const IfoodApiService = require("../services/IfoodApiService");
const IfoodPollingService = require("../services/IfoodPollingService");
const IfoodOrderStatusService = require("../services/IfoodOrderStatusService");

function publico(documento) {
  if (!documento) return null;
  const item = documento.toObject ? documento.toObject() : { ...documento };
  delete item.clientSecretCriptografado;
  item.clientSecretConfigurado = Boolean(
    documento.clientSecretCriptografado || process.env.IFOOD_CLIENT_SECRET
  );
  item.clientIdOrigem = process.env.IFOOD_CLIENT_ID ? "ambiente" : "banco";
  item.clientSecretOrigem = process.env.IFOOD_CLIENT_SECRET ? "ambiente" : "banco";
  return item;
}

exports.obterConfiguracao = async (req, res, next) => {
  try {
    let configuracao = await IfoodConfiguracao.findOne().select("+clientSecretCriptografado");
    if (!configuracao) configuracao = await IfoodConfiguracao.create({});
    return res.json({ success: true, configuracao: publico(configuracao) });
  } catch (error) {
    next(error);
  }
};

exports.salvarConfiguracao = async (req, res, next) => {
  try {
    const payload = req.body || {};
    let configuracao = await IfoodConfiguracao.findOne().select("+clientSecretCriptografado");
    if (!configuracao) configuracao = new IfoodConfiguracao();

    const campos = [
      "nome", "clientId", "merchantId", "merchantNome", "catalogId", "ativa",
      "pollingAtivo", "intervaloPollingSegundos", "sincronizarPedidos",
      "sincronizarCatalogo", "sincronizarDisponibilidade",
    ];
    campos.forEach((campo) => {
      if (payload[campo] !== undefined) configuracao[campo] = payload[campo];
    });

    configuracao.intervaloPollingSegundos = Math.max(
      30,
      Math.min(300, Number(configuracao.intervaloPollingSegundos || 30))
    );

    if (payload.clientSecret) {
      configuracao.clientSecretCriptografado = criptografar(payload.clientSecret);
    }

    await configuracao.save();
    return res.json({
      success: true,
      message: "Configuração do iFood salva com segurança.",
      configuracao: publico(configuracao),
    });
  } catch (error) {
    next(error);
  }
};

exports.testarConexao = async (req, res, next) => {
  try {
    const resultado = await IfoodApiService.testarConexao();
    return res.json({
      success: true,
      message: "Conexão com o iFood validada.",
      ...resultado,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.listarMerchants = async (req, res, next) => {
  try {
    const configuracao = await IfoodApiService.obterConfiguracaoCompleta();
    const merchants = await IfoodApiService.listarMerchants(configuracao);
    return res.json({ success: true, merchants });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.statusLoja = async (req, res, next) => {
  try {
    const configuracao = await IfoodApiService.obterConfiguracaoCompleta();
    const merchantId = req.params.merchantId || configuracao.merchantId;
    if (!merchantId) return res.status(400).json({ success: false, message: "Selecione uma loja iFood." });
    const status = await IfoodApiService.obterStatus(configuracao, merchantId);
    return res.json({ success: true, status });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};


exports.executarPolling = async (req, res) => {
  try {
    const resultado = await IfoodPollingService.executarPolling({ manual: true });
    return res.json({ success: true, message: "Polling do iFood executado.", resultado });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.listarEventos = async (req, res, next) => {
  try {
    const eventos = await IfoodPollingService.listarEventos(req.query.limite);
    return res.json({ success: true, eventos });
  } catch (error) {
    next(error);
  }
};

exports.listarPedidosImportados = async (req, res, next) => {
  try {
    const pedidos = await IfoodPollingService.listarPedidosImportados(req.query.limite);
    return res.json({ success: true, pedidos });
  } catch (error) {
    next(error);
  }
};


exports.executarAcaoPedido = async (req, res) => {
  try {
    const resultado = await IfoodOrderStatusService.executar(req.params.orderId, req.body?.acao);
    return res.json({ success: true, message: resultado.aviso, resultado });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.motivosCancelamento = async (req, res) => {
  try {
    const motivos = await IfoodOrderStatusService.motivosCancelamento(req.params.orderId);
    return res.json({ success: true, motivos });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.solicitarCancelamento = async (req, res) => {
  try {
    const resultado = await IfoodOrderStatusService.solicitarCancelamento(
      req.params.orderId,
      req.body?.reason
    );
    return res.json({ success: true, message: resultado.aviso, resultado });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
