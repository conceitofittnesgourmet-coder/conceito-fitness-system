const express = require("express");

const router = express.Router();

const pedidoController = require("../controllers/pedidocontroller");

router.get("/cardapio/historico", pedidoController.listarPedidosCardapio);

router.get("/", pedidoController.listarPedidos);

router.get("/:id", pedidoController.buscarPedido);

router.post("/", pedidoController.criarPedido);

router.put("/:id/status", pedidoController.atualizarStatus);

router.put(
  "/:id/cancelar",
  pedidoController.cancelarPedido
);

module.exports = router;