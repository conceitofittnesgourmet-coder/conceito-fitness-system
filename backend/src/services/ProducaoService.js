const Pedido = require("../models/pedido");

const STATUS_PRODUCAO = [
  "aguardando",
  "producao",
  "pronto",
  "entregue",
];

const TRANSICOES_PERMITIDAS = {
  aguardando: ["producao"],
  producao: ["aguardando", "pronto"],
  pronto: ["producao", "entregue"],
  entregue: [],
};

function normalizarStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase();
}

function calcularTempoReal(inicio, fim = new Date()) {
  if (!inicio) return 0;

  const inicioMs = new Date(inicio).getTime();
  const fimMs = new Date(fim).getTime();

  if (!Number.isFinite(inicioMs) || !Number.isFinite(fimMs)) {
    return 0;
  }

  return Math.max(0, Math.round((fimMs - inicioMs) / 60000));
}

function sincronizarStatusPedido(pedido, statusProducao) {
  switch (statusProducao) {
    case "aguardando":
      pedido.status = "pendente";
      break;

    case "producao":
      pedido.status = "producao";
      break;

    case "pronto":
      pedido.status = "pronto";
      break;

    case "entregue":
      pedido.status = "entregue";
      break;

    default:
      break;
  }
}

function validarTransicao(statusAtual, novoStatus) {
  if (!STATUS_PRODUCAO.includes(novoStatus)) {
    const erro = new Error("Status de produção inválido.");
    erro.statusCode = 400;
    throw erro;
  }

  if (statusAtual === novoStatus) {
    return;
  }

  const permitidos = TRANSICOES_PERMITIDAS[statusAtual] || [];

  if (!permitidos.includes(novoStatus)) {
    const erro = new Error(
      `Não é permitido alterar a produção de "${statusAtual}" para "${novoStatus}".`
    );
    erro.statusCode = 409;
    throw erro;
  }
}

async function listarFila({
  empresa,
  status,
  limite = 100,
  incluirEntregues = false,
} = {}) {
  const filtro = {
    status: { $ne: "cancelado" },
  };

  if (empresa) {
    filtro.empresa = empresa;
  }

  const statusNormalizado = normalizarStatus(status);

  if (statusNormalizado) {
    if (!STATUS_PRODUCAO.includes(statusNormalizado)) {
      const erro = new Error("Filtro de status de produção inválido.");
      erro.statusCode = 400;
      throw erro;
    }

    filtro.statusProducao = statusNormalizado;
  } else if (!incluirEntregues) {
    filtro.statusProducao = {
      $in: ["aguardando", "producao", "pronto"],
    };
  }

  const limiteSeguro = Math.min(
    Math.max(Number(limite) || 100, 1),
    300
  );

  return Pedido.find(filtro)
    .sort({
      prioridadeProducao: -1,
      createdAt: 1,
    })
    .limit(limiteSeguro)
    .lean();
}

async function buscarResumo({ empresa } = {}) {
  const match = {
    status: { $ne: "cancelado" },
  };

  if (empresa) {
    match.empresa = empresa;
  }

  const totais = await Pedido.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$statusProducao",
        total: { $sum: 1 },
      },
    },
  ]);

  const resumo = {
    aguardando: 0,
    producao: 0,
    pronto: 0,
    entregue: 0,
    totalAberto: 0,
  };

  for (const item of totais) {
    if (Object.prototype.hasOwnProperty.call(resumo, item._id)) {
      resumo[item._id] = item.total;
    }
  }

  resumo.totalAberto =
    resumo.aguardando +
    resumo.producao +
    resumo.pronto;

  return resumo;
}

async function buscarPedidoProducao({ pedidoId, empresa } = {}) {
  const filtro = {
    _id: pedidoId,
  };

  if (empresa) {
    filtro.empresa = empresa;
  }

  const pedido = await Pedido.findOne(filtro);

  if (!pedido) {
    const erro = new Error("Pedido não encontrado na fila de produção.");
    erro.statusCode = 404;
    throw erro;
  }

  return pedido;
}

async function atualizarStatus({
  pedidoId,
  empresa,
  novoStatus,
} = {}) {
  const pedido = await buscarPedidoProducao({
    pedidoId,
    empresa,
  });

  if (pedido.status === "cancelado") {
    const erro = new Error(
      "Não é possível alterar a produção de um pedido cancelado."
    );
    erro.statusCode = 409;
    throw erro;
  }

  const statusAtual = normalizarStatus(
    pedido.statusProducao || "aguardando"
  );

  const statusDestino = normalizarStatus(novoStatus);

  validarTransicao(statusAtual, statusDestino);

  const agora = new Date();

  if (statusDestino === "producao") {
    if (!pedido.inicioProducao) {
      pedido.inicioProducao = agora;
    }

    pedido.fimProducao = null;
    pedido.tempoReal = 0;
  }

  if (statusDestino === "aguardando") {
    pedido.inicioProducao = null;
    pedido.fimProducao = null;
    pedido.tempoReal = 0;
  }

  if (statusDestino === "pronto") {
    if (!pedido.inicioProducao) {
      pedido.inicioProducao = agora;
    }

    pedido.fimProducao = agora;
    pedido.tempoReal = calcularTempoReal(
      pedido.inicioProducao,
      pedido.fimProducao
    );
  }

  if (statusDestino === "entregue") {
    if (!pedido.fimProducao) {
      pedido.fimProducao = agora;
    }

    pedido.tempoReal = calcularTempoReal(
      pedido.inicioProducao,
      pedido.fimProducao
    );
  }

  pedido.statusProducao = statusDestino;
  sincronizarStatusPedido(pedido, statusDestino);

  await pedido.save();

  return pedido;
}

async function atualizarChecklist({
  pedidoId,
  empresa,
  checklist,
} = {}) {
  if (!Array.isArray(checklist)) {
    const erro = new Error("O checklist precisa ser uma lista.");
    erro.statusCode = 400;
    throw erro;
  }

  const pedido = await buscarPedidoProducao({
    pedidoId,
    empresa,
  });

  pedido.checklist = checklist
    .map((item) => ({
      nome: String(item?.nome || "").trim(),
      concluido: Boolean(item?.concluido),
    }))
    .filter((item) => item.nome);

  await pedido.save();

  return pedido;
}

async function atualizarPrioridade({
  pedidoId,
  empresa,
  prioridade,
} = {}) {
  const pedido = await buscarPedidoProducao({
    pedidoId,
    empresa,
  });

  pedido.prioridadeProducao = Math.min(
    Math.max(Number(prioridade) || 0, 0),
    10
  );

  await pedido.save();

  return pedido;
}

module.exports = {
  STATUS_PRODUCAO,
  listarFila,
  buscarResumo,
  buscarPedidoProducao,
  atualizarStatus,
  atualizarChecklist,
  atualizarPrioridade,
  calcularTempoReal,
};
