const express = require("express");
const router = express.Router();
const controller = require("../controllers/materiaprimacontroller");

router.get("/", controller.listar);
router.get("/:id", controller.buscarPorId);
router.post("/", controller.criar);
router.put("/:id", controller.atualizar);
router.patch("/:id", controller.atualizar);
router.post("/:id/movimentacoes", controller.movimentar);
router.delete("/:id", controller.excluir);

module.exports = router;
