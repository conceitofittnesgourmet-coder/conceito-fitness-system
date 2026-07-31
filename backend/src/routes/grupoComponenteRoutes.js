const express = require("express");

const router = express.Router();
const controller = require("../controllers/grupocomponenteController");

router.get("/", controller.listar);
router.put("/ordem", controller.reordenar);
router.get("/:id", controller.buscar);
router.post("/", controller.criar);
router.post("/:id/duplicar", controller.duplicar);
router.put("/:id", controller.atualizar);
router.delete("/:id", controller.excluir);

module.exports = router;
