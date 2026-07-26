const ProducaoService = require("../services/ProducaoService");

function responderErro(res, error, contexto) {
  console.error(contexto, error);

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Erro interno no módulo de produção.",
  });
}

function emitirAtualizacao(req, pedido, evento = "producao-atualizada") {
  const io = req.app.get("io") || global.io;

  if (!io) return;

  io.emit(evento, pedido);
  io.emit("pedido-atualizado", pedido);
}

exports.listarFila = async (req, res) => {
  try {
    const pedidos = await ProducaoService.listarFila({
      empresa: req.usuario?.empresa,
      status: req.query.status,
      limite: req.query.limite,
      incluirEntregues:
        String(req.query.incluirEntregues || "").toLowerCase() ===
        "true",
    });

    return res.json({
      success: true,
      total: pedidos.length,
      pedidos,
    });
  } catch (error) {
    return responderErro(
      res,
      error,
      "ERRO LISTAR FILA DE PRODUÇÃO:"
    );
  }
};

exports.resumo = async (req, res) => {
  try {
    const resumo = await ProducaoService.buscarResumo({
      empresa: req.usuario?.empresa,
    });

    return res.json({
      success: true,
      resumo,
    });
  } catch (error) {
    return responderErro(
      res,
      error,
      "ERRO RESUMO DE PRODUÇÃO:"
    );
  }
};

exports.buscarPedido = async (req, res) => {
  try {
    const pedido =
      await ProducaoService.buscarPedidoProducao({
        pedidoId: req.params.id,
        empresa: req.usuario?.empresa,
      });

    return res.json({
      success: true,
      pedido,
    });
  } catch (error) {
    return responderErro(
      res,
      error,
      "ERRO BUSCAR PEDIDO DA PRODUÇÃO:"
    );
  }
};

exports.atualizarStatus = async (req, res) => {
  try {
    const pedido = await ProducaoService.atualizarStatus({
      pedidoId: req.params.id,
      empresa: req.usuario?.empresa,
      novoStatus: req.body?.status,
    });

    emitirAtualizacao(req, pedido);

    return res.json({
      success: true,
      message: "Status da produção atualizado com sucesso.",
      pedido,
    });
  } catch (error) {
    return responderErro(
      res,
      error,
      "ERRO ATUALIZAR STATUS DA PRODUÇÃO:"
    );
  }
};

exports.atualizarChecklist = async (req, res) => {
  try {
    const pedido =
      await ProducaoService.atualizarChecklist({
        pedidoId: req.params.id,
        empresa: req.usuario?.empresa,
        checklist: req.body?.checklist,
      });

    emitirAtualizacao(req, pedido);

    return res.json({
      success: true,
      message: "Checklist atualizado com sucesso.",
      pedido,
    });
  } catch (error) {
    return responderErro(
      res,
      error,
      "ERRO ATUALIZAR CHECKLIST DA PRODUÇÃO:"
    );
  }
};

exports.atualizarPrioridade = async (req, res) => {
  try {
    const pedido =
      await ProducaoService.atualizarPrioridade({
        pedidoId: req.params.id,
        empresa: req.usuario?.empresa,
        prioridade: req.body?.prioridade,
      });

    emitirAtualizacao(req, pedido);

    return res.json({
      success: true,
      message: "Prioridade atualizada com sucesso.",
      pedido,
    });
  } catch (error) {
    return responderErro(
      res,
      error,
      "ERRO ATUALIZAR PRIORIDADE DA PRODUÇÃO:"
    );
  }
};
