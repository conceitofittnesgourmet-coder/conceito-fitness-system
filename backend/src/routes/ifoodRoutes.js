const express = require("express");
const controller = require("../controllers/ifoodcontroller");

const router = express.Router();

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
router.post("/catalogo/simular", controller.simularCatalogo);
router.post("/catalogo/sincronizar", controller.sincronizarCatalogo);
router.patch("/catalogo/produtos/:produtoId/disponibilidade", controller.atualizarDisponibilidadeCatalogo);
router.patch("/catalogo/produtos/:produtoId/preco", controller.atualizarPrecoCatalogo);

module.exports = router;
