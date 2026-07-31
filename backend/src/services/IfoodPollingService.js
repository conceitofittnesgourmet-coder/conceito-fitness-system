const IfoodConfiguracao = require("../models/ifoodconfiguracao");
const IfoodEvento = require("../models/ifoodevento");
const IfoodPedido = require("../models/ifoodpedido");
const Pedido = require("../models/pedido");
const IfoodApiService = require("./IfoodApiService");

let timer = null;
let executando = false;

const STATUS_ERP = {
  PLC: "pendente",
  PLACED: "pendente",
  CFM: "producao",
  CONFIRMED: "producao",
  SPS: "producao",
  SEPARATION_STARTED: "producao",
  RTP: "pronto",
  READY_TO_PICKUP: "pronto",
  DSP: "entregue",
  DISPATCHED: "entregue",
  CON: "entregue",
  CONCLUDED: "entregue",
  CAN: "cancelado",
  CANCELLED: "cancelado",
};

function numero(valor, padrao = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : padrao;
}

function dataValida(valor) {
  if (!valor) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

function textoEndereco(order) {
  const endereco = order.delivery?.deliveryAddress || order.deliveryAddress || {};
  return [endereco.streetName || endereco.street, endereco.streetNumber || endereco.number]
    .filter(Boolean)
    .join(", ");
}

function mapearOpcoes(item) {
  const opcoes = Array.isArray(item.options) ? item.options : [];
  return opcoes.map((opcao) => {
    const quantidade = Math.max(1, numero(opcao.quantity, 1));
    const valorUnitario = numero(opcao.unitPrice ?? opcao.price ?? opcao.addition, 0);
    return {
      grupoId: String(opcao.groupId || opcao.groupName || "ifood"),
      grupo: String(opcao.groupName || opcao.group || "Complementos"),
      grupoTipo: "ifood",
      opcaoId: String(opcao.id || opcao.externalCode || opcao.name || ""),
      opcao: String(opcao.name || "Opção iFood"),
      quantidade,
      valorUnitario,
      valor: numero(opcao.price, valorUnitario * quantidade),
    };
  });
}

function mapearItens(order) {
  return (Array.isArray(order.items) ? order.items : []).map((item) => {
    const quantidade = Math.max(0.001, numero(item.quantity, 1));
    const configuracoes = mapearOpcoes(item);
    const adicionais = configuracoes.reduce((soma, opcao) => soma + numero(opcao.valor, 0), 0);
    const precoUnitario = numero(item.unitPrice, numero(item.price, 0));
    const subtotal = numero(item.totalPrice, (precoUnitario + adicionais) * quantidade);
    return {
      nome: String(item.name || "Produto iFood"),
      quantidade,
      preco: precoUnitario,
      precoUnitario,
      precoOriginal: precoUnitario,
      subtotal,
      categoria: String(item.category || order.category || "FOOD"),
      sku: String(item.externalCode || ""),
      unidadeMedida: String(item.unit || "UN"),
      configuracoes,
      adicionais,
      observacaoItem: String(item.observations || item.observation || "").slice(0, 300),
    };
  });
}

function mapearPagamento(order) {
  const methods = order.payments?.methods || order.payment?.methods || [];
  if (!Array.isArray(methods) || methods.length === 0) return "IFOOD";
  return String(methods[0].method || methods[0].type || methods[0].brand || "IFOOD").toUpperCase();
}

function mapearTipo(order) {
  const tipo = String(order.orderType || "").toUpperCase();
  if (tipo === "DELIVERY") return "delivery";
  if (tipo === "TAKEOUT") return "retirada";
  if (tipo === "DINE_IN" || tipo === "INDOOR") return "local";
  return "delivery";
}

async function proximoNumeroPedido() {
  const ultimo = await Pedido.findOne({ numeroPedido: { $ne: null } })
    .sort({ numeroPedido: -1 })
    .select("numeroPedido")
    .lean();
  return numero(ultimo?.numeroPedido, 0) + 1;
}

async function importarPedido(order, evento) {
  const orderId = String(order.id || evento.orderId || "");
  if (!orderId) throw new Error("Evento iFood sem orderId.");

  const existente = await Pedido.findOne({ ifoodOrderId: orderId });
  const produtos = mapearItens(order);
  const subtotal = numero(order.total?.subTotal, produtos.reduce((s, item) => s + numero(item.subtotal, 0), 0));
  const taxaEntrega = numero(order.total?.deliveryFee, numero(order.delivery?.deliveryFee, 0));
  const desconto = numero(order.total?.benefits, numero(order.total?.discount, 0));
  const total = numero(order.total?.orderAmount, numero(order.total?.total, Math.max(0, subtotal + taxaEntrega - desconto)));
  const customer = order.customer || {};
  const endereco = order.delivery?.deliveryAddress || order.deliveryAddress || {};
  const scheduling = order.scheduling || {};
  const statusIfood = String(order.status || evento.fullCode || evento.code || "PLACED");
  const statusErp = STATUS_ERP[statusIfood] || STATUS_ERP[evento.code] || "pendente";

  const dados = {
    canalVenda: "ifood",
    ifoodOrderId: orderId,
    ifoodDisplayId: String(order.displayId || ""),
    ifoodMerchantId: String(order.merchant?.id || evento.merchantId || ""),
    ifoodStatus: statusIfood,
    ifoodOrderType: String(order.orderType || ""),
    ifoodOrderTiming: String(order.orderTiming || ""),
    ifoodCriadoEm: dataValida(order.createdAt),
    ifoodAgendadoPara: dataValida(scheduling.deliveryDateTimeStart || scheduling.dateTimeStart || order.scheduledAt),
    ifoodPayload: order,
    cliente: String(customer.name || customer.documentNumber || "Cliente iFood"),
    telefone: String(customer.phone?.number || customer.phone || ""),
    produtos,
    subtotal,
    taxaEntrega,
    desconto,
    total,
    pagamento: mapearPagamento(order),
    tipo: mapearTipo(order),
    enderecoEntrega: textoEndereco(order),
    cep: String(endereco.postalCode || endereco.zipCode || ""),
    numeroEntrega: String(endereco.streetNumber || endereco.number || ""),
    bairroEntrega: String(endereco.neighborhood || ""),
    complementoEntrega: String(endereco.complement || ""),
    referenciaEntrega: String(endereco.reference || endereco.referencePoint || ""),
    observacao: String(order.extraInfo || ""),
    status: statusErp,
    statusProducao: statusErp === "producao" ? "producao" : statusErp === "pronto" ? "pronto" : statusErp === "entregue" ? "entregue" : "aguardando",
  };

  let pedido;
  let novo = false;
  if (existente) {
    Object.assign(existente, dados);
    pedido = await existente.save();
  } else {
    dados.numeroPedido = await proximoNumeroPedido();
    pedido = await Pedido.create(dados);
    novo = true;
  }

  await IfoodPedido.findOneAndUpdate(
    { orderId },
    {
      orderId,
      displayId: String(order.displayId || ""),
      merchantId: dados.ifoodMerchantId,
      status: statusIfood,
      orderType: dados.ifoodOrderType,
      orderTiming: dados.ifoodOrderTiming,
      category: String(order.category || "FOOD"),
      criadoNoIfoodEm: dados.ifoodCriadoEm,
      preparacaoRecomendadaEm: dataValida(order.preparationStartDateTime),
      agendadoPara: dados.ifoodAgendadoPara,
      pedidoErp: pedido._id,
      payload: order,
      importadoEm: new Date(),
      atualizadoNoIfoodEm: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (novo && global.io) {
    global.io.emit("novo-pedido", pedido);
    global.io.emit("novo_pedido", pedido);
    global.io.emit("ifood-novo-pedido", pedido);
  }
  return { pedido, novo };
}

async function atualizarStatusPedido(evento) {
  if (!evento.orderId) return null;
  const statusIfood = String(evento.fullCode || evento.code || "");
  const statusErp = STATUS_ERP[evento.code] || STATUS_ERP[statusIfood];
  const atualizacao = { ifoodStatus: statusIfood, ifoodPayloadUltimoEvento: evento };
  if (statusErp) {
    atualizacao.status = statusErp;
    atualizacao.statusProducao = statusErp === "producao" ? "producao" : statusErp === "pronto" ? "pronto" : statusErp === "entregue" ? "entregue" : "aguardando";
  }
  const pedido = await Pedido.findOneAndUpdate({ ifoodOrderId: evento.orderId }, atualizacao, { new: true });
  await IfoodPedido.findOneAndUpdate(
    { orderId: evento.orderId },
    { status: statusIfood, statusSolicitado: "", atualizadoNoIfoodEm: new Date() },
    { upsert: false }
  );
  if (pedido && global.io) global.io.emit("pedido-atualizado", pedido);
  return pedido;
}

async function salvarEvento(evento) {
  const eventId = String(evento.id || "");
  if (!eventId) throw new Error("Evento iFood sem identificador.");
  return IfoodEvento.findOneAndUpdate(
    { eventId },
    {
      $setOnInsert: {
        eventId,
        orderId: String(evento.orderId || ""),
        merchantId: String(evento.merchantId || ""),
        code: String(evento.code || ""),
        fullCode: String(evento.fullCode || ""),
        grupo: String(evento.group || evento.groupName || ""),
        criadoNoIfoodEm: dataValida(evento.createdAt),
        payload: evento,
        statusProcessamento: "recebido",
      },
      $inc: { tentativas: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function processarEvento(configuracao, evento) {
  const registro = await salvarEvento(evento);
  if (["processado", "ignorado"].includes(registro.statusProcessamento)) {
    return { reconhecer: true, duplicado: true, importado: false };
  }

  try {
    let importado = false;
    if (["PLC", "PLACED"].includes(String(evento.code || evento.fullCode || "").toUpperCase())) {
      const detalhes = await IfoodApiService.obterPedido(configuracao, evento.orderId);
      const resultado = await importarPedido(detalhes, evento);
      importado = resultado.novo;
    } else {
      await atualizarStatusPedido(evento);
    }

    registro.statusProcessamento = "processado";
    registro.processadoEm = new Date();
    registro.ultimoErro = "";
    await registro.save();
    return { reconhecer: true, duplicado: false, importado };
  } catch (error) {
    registro.statusProcessamento = "erro";
    registro.ultimoErro = error.message;
    await registro.save();
    return { reconhecer: false, erro: error.message, importado: false };
  }
}

async function executarPolling({ manual = false } = {}) {
  if (executando) return { ignorado: true, motivo: "Polling já está em execução." };
  executando = true;
  let configuracao;
  try {
    configuracao = await IfoodConfiguracao.findOne().select("+clientSecretCriptografado");
    if (!configuracao) return { ignorado: true, motivo: "Integração iFood não configurada." };
    if (!manual && (!configuracao.ativa || !configuracao.pollingAtivo || !configuracao.sincronizarPedidos)) {
      return { ignorado: true, motivo: "Polling automático desativado." };
    }

    const eventos = (await IfoodApiService.pollingEventos(configuracao))
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    const paraReconhecer = [];
    let importados = 0;
    let processados = 0;
    const erros = [];

    for (const evento of eventos) {
      const resultado = await processarEvento(configuracao, evento);
      if (resultado.reconhecer) {
        paraReconhecer.push(evento);
        processados += 1;
      }
      if (resultado.importado) importados += 1;
      if (resultado.erro) erros.push({ eventId: evento.id, orderId: evento.orderId, erro: resultado.erro });
    }

    if (paraReconhecer.length > 0) {
      await IfoodApiService.reconhecerEventos(configuracao, paraReconhecer);
      const ids = paraReconhecer.map((item) => item.id);
      await IfoodEvento.updateMany({ eventId: { $in: ids } }, { reconhecidoEm: new Date() });
    }

    configuracao.ultimoPollingEm = new Date();
    configuracao.ultimoPollingOk = erros.length === 0;
    configuracao.ultimoPollingErro = erros.map((item) => item.erro).join(" | ").slice(0, 1000);
    configuracao.eventosRecebidos = numero(configuracao.eventosRecebidos) + eventos.length;
    configuracao.eventosProcessados = numero(configuracao.eventosProcessados) + processados;
    configuracao.pedidosImportados = numero(configuracao.pedidosImportados) + importados;
    if (eventos.length > 0) configuracao.ultimoEventoEm = new Date();
    await configuracao.save();

    return {
      success: true,
      recebidos: eventos.length,
      processados,
      reconhecidos: paraReconhecer.length,
      pedidosImportados: importados,
      erros,
    };
  } catch (error) {
    if (configuracao) {
      configuracao.ultimoPollingEm = new Date();
      configuracao.ultimoPollingOk = false;
      configuracao.ultimoPollingErro = error.message;
      await configuracao.save().catch(() => null);
    }
    throw error;
  } finally {
    executando = false;
  }
}

function iniciar() {
  if (timer) return;
  setTimeout(() => executarPolling().catch((error) => console.error("IFOOD POLLING:", error.message)), 10000);
  timer = setInterval(
    () => executarPolling().catch((error) => console.error("IFOOD POLLING:", error.message)),
    30000
  );
  if (typeof timer.unref === "function") timer.unref();
}

function parar() {
  if (timer) clearInterval(timer);
  timer = null;
}

async function listarEventos(limite = 50) {
  return IfoodEvento.find().sort({ createdAt: -1 }).limit(Math.min(200, Math.max(1, numero(limite, 50)))).lean();
}

async function listarPedidosImportados(limite = 50) {
  return IfoodPedido.find().populate("pedidoErp", "numeroPedido cliente total status createdAt").sort({ createdAt: -1 }).limit(Math.min(200, Math.max(1, numero(limite, 50)))).lean();
}

module.exports = {
  iniciar,
  parar,
  executarPolling,
  listarEventos,
  listarPedidosImportados,
  importarPedido,
};
