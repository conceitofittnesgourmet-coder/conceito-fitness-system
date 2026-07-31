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
      await ProducaoService.buscarPedidoDetalhado({
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

const OrdemProducaoService = require("../services/OrdemProducaoService");

exports.listarOrdens = async (req, res) => {
  try {
    const ordens = await OrdemProducaoService.listar({ empresa: req.usuario?.empresa, status: req.query.status, busca: req.query.busca, limite: req.query.limite });
    return res.json({ success: true, total: ordens.length, ordens });
  } catch (error) { return responderErro(res, error, "ERRO LISTAR ORDENS DE PRODUÇÃO:"); }
};

exports.resumoOrdens = async (req, res) => {
  try {
    const resumo = await OrdemProducaoService.resumo({ empresa: req.usuario?.empresa });
    return res.json({ success: true, resumo });
  } catch (error) { return responderErro(res, error, "ERRO RESUMO ORDENS DE PRODUÇÃO:"); }
};

exports.buscarOrdem = async (req, res) => {
  try {
    const ordem = await OrdemProducaoService.buscarPorId(req.params.id, req.usuario?.empresa);
    return res.json({ success: true, ordem });
  } catch (error) { return responderErro(res, error, "ERRO BUSCAR ORDEM DE PRODUÇÃO:"); }
};

exports.criarOrdem = async (req, res) => {
  try {
    const ordem = await OrdemProducaoService.criar({ dados: req.body || {}, empresa: req.usuario?.empresa, usuario: req.usuario });
    return res.status(201).json({ success: true, message: "Ordem de produção criada com sucesso.", ordem });
  } catch (error) { return responderErro(res, error, "ERRO CRIAR ORDEM DE PRODUÇÃO:"); }
};

exports.atualizarOrdem = async (req, res) => {
  try {
    const ordem = await OrdemProducaoService.atualizar(req.params.id, req.body || {}, req.usuario?.empresa, req.usuario);
    return res.json({ success: true, message: "Ordem de produção atualizada com sucesso.", ordem });
  } catch (error) { return responderErro(res, error, "ERRO ATUALIZAR ORDEM DE PRODUÇÃO:"); }
};

exports.alterarStatusOrdem = async (req, res) => {
  try {
    const ordem = await OrdemProducaoService.alterarStatus(req.params.id, req.body?.status, req.body || {}, req.usuario?.empresa, req.usuario);
    return res.json({ success: true, message: "Status da ordem atualizado com sucesso.", ordem });
  } catch (error) { return responderErro(res, error, "ERRO ALTERAR STATUS DA ORDEM DE PRODUÇÃO:"); }
};

exports.analisarInsumosOrdem = async (req, res) => {
  try {
    const analise = await OrdemProducaoService.analisarInsumos(req.params.id, req.usuario?.empresa);
    return res.json({ success: true, message: analise.podeProduzir ? "Ingredientes disponíveis para produção." : "Há ingredientes insuficientes.", analise });
  } catch (error) { return responderErro(res, error, "ERRO ANALISAR INSUMOS DA ORDEM:"); }
};

exports.indicadoresOrdens = async (req, res) => {
  try {
    const indicadores = await OrdemProducaoService.indicadoresGerenciais({
      empresa: req.usuario?.empresa,
      dias: req.query.dias,
      limite: req.query.limite,
    });
    return res.json({ success: true, indicadores });
  } catch (error) {
    return responderErro(res, error, "ERRO INDICADORES GERENCIAIS DA PRODUÇÃO:");
  }
};
const PlanejamentoProducaoService = require("../services/PlanejamentoProducaoService");

exports.sugerirPlanejamento = async (req, res) => {
  try {
    const planejamento = await PlanejamentoProducaoService.sugerir({
      empresa: req.usuario?.empresa,
      dataPlanejada: req.query.dataPlanejada,
      diasHistorico: req.query.diasHistorico,
      diasCobertura: req.query.diasCobertura,
    });
    return res.json({ success: true, planejamento });
  } catch (error) {
    return responderErro(res, error, "ERRO PLANEJAMENTO INTELIGENTE DE PRODUÇÃO:");
  }
};

exports.criarOrdensPlanejamento = async (req, res) => {
  try {
    const ordens = await PlanejamentoProducaoService.criarOrdens({
      empresa: req.usuario?.empresa,
      usuario: req.usuario,
      dataPlanejada: req.body?.dataPlanejada,
      itens: req.body?.itens,
    });
    return res.status(201).json({
      success: true,
      message: `${ordens.length} ordem(ns) criada(s) pelo planejamento inteligente.`,
      ordens,
    });
  } catch (error) {
    return responderErro(res, error, "ERRO CRIAR ORDENS DO PLANEJAMENTO:");
  }
};
