const express = require("express");
const router = express.Router();
const controller = require("../controllers/fichatecnicacontroller");
const authMiddleware = require("../middlewares/authmiddleware");

router.use(authMiddleware);
router.get("/", controller.listar);
router.get("/produto/:produtoId", controller.buscarPorProduto);
router.post("/", controller.criarOuAtualizar);
router.post("/recalcular", controller.recalcular);
router.post("/:id/recalcular", controller.recalcular);
router.delete("/:id", controller.excluir);

module.exports = router;
