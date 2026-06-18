const express = require("express");
const router = express.Router();

const controller = require("../controllers/nfcecontroller");

router.get("/", controller.listar);
router.get("/pedido/:pedidoId", controller.buscarPorPedido);

router.get("/emitir-teste", controller.emitirTesteUltimoPedido);
router.post("/emitir-teste", controller.emitirTesteUltimoPedido);

router.get("/assinar-ultima", controller.assinarUltima);
router.post("/assinar/:id", controller.assinarPorId);

router.post("/emitir/:pedidoId", controller.emitirPorPedido);

router.post("/transmitir/:id", controller.transmitirPorId);
router.get("/transmitir/:id", controller.transmitirPorId);

router.get("/consultar/:id", controller.consultarPorId);
router.post("/consultar/:id", controller.consultarPorId);

router.get("/:id/xml", controller.visualizarXml);

router.get("/:id/download", controller.downloadXml);

router.get("/:id/danfe", controller.visualizarDanfe);

router.get("/:id", controller.buscarPorId);

module.exports = router;