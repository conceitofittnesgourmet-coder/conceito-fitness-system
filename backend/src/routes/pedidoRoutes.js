const express = require("express");

const router = express.Router();

const pedidoController = require("../controllers/pedidoController");

router.get("/", pedidoController.listarPedidos);

router.get("/:id", pedidoController.buscarPedido);

router.post("/", pedidoController.criarPedido);

router.put("/:id/status", pedidoController.atualizarStatus);

module.exports = router;