const express = require("express");
const router = express.Router();
const controller = require("../controllers/nfeController");

router.get("/", controller.listar);
router.get("/diagnostico/status", controller.diagnostico);
router.get("/pedido/:pedidoId", controller.buscarPorPedido);
router.post("/emitir/:pedidoId", controller.emitirPorPedido);
router.post("/processar/:pedidoId", controller.processarPorPedido);
router.post("/assinar/:id", controller.assinarPorId);
router.post("/transmitir/:id", controller.transmitirPorId);
router.get("/consultar/:id", controller.consultarPorId);
router.post("/consultar/:id", controller.consultarPorId);
router.get("/:id/xml", controller.visualizarXml);
router.get("/:id/download", controller.downloadXml);
router.get("/:id/danfe", controller.visualizarDanfe);
router.get("/:id", controller.buscarPorId);

module.exports = router;
