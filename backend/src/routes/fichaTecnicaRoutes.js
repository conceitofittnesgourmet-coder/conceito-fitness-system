const express = require("express");
const router = express.Router();

const controller = require("../controllers/fichatecnicacontroller");

router.get("/", controller.listar);
router.get("/produto/:produtoId", controller.buscarPorProduto);
router.post("/", controller.criarOuAtualizar);
router.delete("/:id", controller.excluir);

module.exports = router;