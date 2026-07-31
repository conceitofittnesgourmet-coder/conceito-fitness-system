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

module.exports = router;
