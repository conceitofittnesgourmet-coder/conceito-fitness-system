const IfoodConfiguracao = require("../models/ifoodconfiguracao");
const IfoodPedido = require("../models/ifoodpedido");
const Pedido = require("../models/pedido");
const IfoodApiService = require("./IfoodApiService");

const ACOES = {
  confirmar: {
    endpoint: "confirm",
    statusSolicitado: "CONFIRMATION_REQUESTED",
    statusErp: "producao",
    statusProducao: "aguardando",
  },
  iniciar_preparo: {
    endpoint: "startPreparation",
    statusSolicitado: "PREPARATION_REQUESTED",
    statusErp: "producao",
    statusProducao: "producao",
  },
  pronto: {
    endpoint: "readyToPickup",
    statusSolicitado: "READY_REQUESTED",
    statusErp: "pronto",
    statusProducao: "pronto",
  },
  despachar: {
    endpoint: "dispatch",
    statusSolicitado: "DISPATCH_REQUESTED",
    statusErp: "entregue",
    statusProducao: "entregue",
    body: { deliveredBy: "MERCHANT" },
  },
};

function normalizarStatus(status) {
  return String(status || "").trim().toUpperCase();
}

function validarAcao(pedido, acao) {
  const status = normalizarStatus(pedido.status);
  const orderType = normalizarStatus(pedido.orderType);
  const deliveredBy = normalizarStatus(
    pedido.payload?.delivery?.deliveredBy ||
      pedido.payload?.delivery?.deliveryBy ||
      pedido.payload?.deliveredBy
  );

  if (["CANCELLED", "CAN", "CONCLUDED", "CON"].includes(status)) {
    throw new Error("Este pedido já foi encerrado no iFood.");
  }

  if (acao === "confirmar" && !["PLACED", "PLC", "PENDING", ""].includes(status)) {
    throw new Error(`O pedido não pode ser confirmado no status ${status}.`);
  }

  if (acao === "iniciar_preparo" && !["CONFIRMED", "CFM", "CONFIRMATION_REQUESTED"].includes(status)) {
    throw new Error("Confirme o pedido antes de iniciar o preparo.");
  }

  if (acao === "pronto" && ["PLACED", "PLC", "PENDING"].includes(status)) {
    throw new Error("Confirme o pedido antes de informar que está pronto.");
  }

  if (acao === "despachar") {
    if (orderType !== "DELIVERY") {
      throw new Error("O despacho é permitido somente para pedidos DELIVERY.");
    }
    if (deliveredBy && deliveredBy !== "MERCHANT") {
      throw new Error("Este pedido não utiliza entrega própria da loja.");
    }
  }
}

async function obterContexto(orderId) {
  const configuracao = await IfoodConfiguracao.findOne().select("+clientSecretCriptografado");
  if (!configuracao) throw new Error("Integração iFood não configurada.");
  if (!configuracao.ativa) throw new Error("Ative a integração iFood antes de enviar comandos.");

  const pedido = await IfoodPedido.findOne({ orderId });
  if (!pedido) throw new Error("Pedido iFood não encontrado no histórico da integração.");

  return { configuracao, pedido };
}

async function registrarComando(pedido, acao, resultado, erro = "") {
  pedido.ultimoComando = acao;
  pedido.ultimoComandoEm = new Date();
  pedido.ultimoComandoOk = !erro;
  pedido.ultimoComandoErro = erro;
  pedido.historicoComandos.push({
    acao,
    statusAntes: pedido.status,
    solicitadoEm: new Date(),
    aceito: !erro,
    resposta: resultado || null,
    erro,
  });
  if (pedido.historicoComandos.length > 100) {
    pedido.historicoComandos = pedido.historicoComandos.slice(-100);
  }
  await pedido.save();
}

async function executar(orderId, acao) {
  const definicao = ACOES[acao];
  if (!definicao) throw new Error("Ação do iFood não reconhecida.");

  const { configuracao, pedido } = await obterContexto(orderId);
  validarAcao(pedido, acao);

  try {
    const response = await IfoodApiService.acaoPedido(
      configuracao,
      orderId,
      definicao.endpoint,
      definicao.body
    );

    await registrarComando(pedido, acao, response);
    pedido.statusSolicitado = definicao.statusSolicitado;
    await pedido.save();

    if (pedido.pedidoErp) {
      await Pedido.findByIdAndUpdate(pedido.pedidoErp, {
        status: definicao.statusErp,
        statusProducao: definicao.statusProducao,
        ifoodUltimaAcao: acao,
        ifoodUltimaAcaoEm: new Date(),
        ifoodUltimaAcaoOk: true,
        ifoodUltimaAcaoErro: "",
      });
    }

    return {
      acao,
      orderId,
      aceito: true,
      resposta: response,
      aviso: "A solicitação foi aceita. O status definitivo chegará pelo próximo polling.",
    };
  } catch (error) {
    await registrarComando(pedido, acao, null, error.message).catch(() => null);
    if (pedido.pedidoErp) {
      await Pedido.findByIdAndUpdate(pedido.pedidoErp, {
        ifoodUltimaAcao: acao,
        ifoodUltimaAcaoEm: new Date(),
        ifoodUltimaAcaoOk: false,
        ifoodUltimaAcaoErro: error.message,
      }).catch(() => null);
    }
    throw error;
  }
}

async function motivosCancelamento(orderId) {
  const { configuracao } = await obterContexto(orderId);
  const response = await IfoodApiService.motivosCancelamento(configuracao, orderId);
  return Array.isArray(response) ? response : response?.reasons || [];
}

async function solicitarCancelamento(orderId, reason) {
  if (!reason) throw new Error("Selecione um motivo válido para o cancelamento.");
  const { configuracao, pedido } = await obterContexto(orderId);

  try {
    const response = await IfoodApiService.solicitarCancelamento(configuracao, orderId, reason);
    await registrarComando(pedido, "cancelar", response);
    pedido.statusSolicitado = "CANCELLATION_REQUESTED";
    pedido.motivoCancelamentoSolicitado = String(reason);
    await pedido.save();

    if (pedido.pedidoErp) {
      await Pedido.findByIdAndUpdate(pedido.pedidoErp, {
        ifoodUltimaAcao: "cancelar",
        ifoodUltimaAcaoEm: new Date(),
        ifoodUltimaAcaoOk: true,
        ifoodUltimaAcaoErro: "",
      });
    }

    return {
      orderId,
      aceito: true,
      resposta: response,
      aviso: "A solicitação de cancelamento foi enviada. Aguarde o evento do iFood.",
    };
  } catch (error) {
    await registrarComando(pedido, "cancelar", null, error.message).catch(() => null);
    throw error;
  }
}

module.exports = {
  executar,
  motivosCancelamento,
  solicitarCancelamento,
};
