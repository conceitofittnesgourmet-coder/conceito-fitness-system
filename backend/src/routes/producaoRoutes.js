const express = require("express");

const router = express.Router();

const producaoController = require("../controllers/producaoController");

router.get("/", producaoController.listarFila);

router.get("/resumo", producaoController.resumo);

router.get("/:id", producaoController.buscarPedido);

router.put(
  "/:id/status",
  producaoController.atualizarStatus
);

router.put(
  "/:id/checklist",
  producaoController.atualizarChecklist
);

router.put(
  "/:id/prioridade",
  producaoController.atualizarPrioridade
);

module.exports = router;
