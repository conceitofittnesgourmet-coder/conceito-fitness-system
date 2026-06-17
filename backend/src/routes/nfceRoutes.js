const express = require("express");
const router = express.Router();

const controller = require("../controllers/nfcecontroller");

router.get("/", controller.listar);
router.get("/pedido/:pedidoId", controller.buscarPorPedido);

// Rota temporária para testar pelo navegador
router.get("/emitir-teste", controller.emitirTesteUltimoPedido);

// Rota oficial via POST
router.post("/emitir-teste", controller.emitirTesteUltimoPedido);
router.post("/emitir/:pedidoId", controller.emitirPorPedido);

// Essa rota por ID sempre fica por último
router.get("/:id", controller.buscarPorId);

module.exports = router;