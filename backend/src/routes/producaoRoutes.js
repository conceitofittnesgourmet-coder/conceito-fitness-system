const express = require("express");

const router = express.Router();

const producaoController = require("../controllers/producaocontroller");

router.get("/ordens/resumo", producaoController.resumoOrdens);
router.get("/ordens", producaoController.listarOrdens);
router.post("/ordens", producaoController.criarOrdem);
router.get("/ordens/:id", producaoController.buscarOrdem);
router.put("/ordens/:id", producaoController.atualizarOrdem);
router.put("/ordens/:id/status", producaoController.alterarStatusOrdem);
router.get("/ordens/:id/insumos", producaoController.analisarInsumosOrdem);

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
