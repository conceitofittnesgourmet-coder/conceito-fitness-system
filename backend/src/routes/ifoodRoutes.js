const express = require("express");
const controller = require("../controllers/ifoodcontroller");
const authMiddleware = require("../middlewares/authmiddleware");

const router = express.Router();

// Todas as rotas /api/ifood são administrativas.
// O polling automático é executado internamente pelo backend
// através do IfoodPollingService e não depende destas rotas HTTP.
router.use(authMiddleware);

router.get("/configuracao", controller.obterConfiguracao);
router.put("/configuracao", controller.salvarConfiguracao);
router.post("/testar-conexao", controller.testarConexao);
router.get("/merchants", controller.listarMerchants);
router.get("/merchants/:merchantId/status", controller.statusLoja);

router.post("/polling/executar", controller.executarPolling);
router.get("/eventos", controller.listarEventos);
router.get("/pedidos-importados", controller.listarPedidosImportados);
router.post("/pedidos/:orderId/acao", controller.executarAcaoPedido);
router.get("/pedidos/:orderId/motivos-cancelamento", controller.motivosCancelamento);
router.post("/pedidos/:orderId/cancelar", controller.solicitarCancelamento);

router.get("/catalogo/diagnostico", controller.diagnosticoCatalogo);
router.get("/catalogo/diagnostico-remoto", controller.diagnosticoCatalogoRemoto);
router.post("/catalogo/simular", controller.simularCatalogo);
router.post("/catalogo/sincronizar", controller.sincronizarCatalogo);
router.patch(
  "/catalogo/produtos/:produtoId/disponibilidade",
  controller.atualizarDisponibilidadeCatalogo
);
router.patch(
  "/catalogo/produtos/:produtoId/preco",
  controller.atualizarPrecoCatalogo
);

router.get("/auditoria/ultima", controller.ultimaAuditoria);
router.get("/auditoria/historico", controller.historicoAuditorias);
router.post("/auditoria/executar", controller.executarAuditoria);
router.post("/auditoria/corrigir", controller.corrigirPendencia);

module.exports = router;