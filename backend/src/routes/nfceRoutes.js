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

router.get("/:id", controller.buscarPorId);

module.exports = router;