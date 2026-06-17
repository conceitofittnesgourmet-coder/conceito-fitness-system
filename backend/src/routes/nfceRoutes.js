const express = require("express");
const router = express.Router();

const controller = require("../controllers/nfcecontroller");

router.get("/", controller.listar);
router.get("/pedido/:pedidoId", controller.buscarPorPedido);
router.post("/emitir-teste", controller.emitirTesteUltimoPedido);
router.post("/emitir/:pedidoId", controller.emitirPorPedido);
router.get("/:id", controller.buscarPorId);

module.exports = router;