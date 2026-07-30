const express = require("express");
const router = express.Router();
const controller = require("../controllers/clubecontroller");
router.get("/configuracao", controller.obterConfiguracao);
router.put("/configuracao", controller.salvarConfiguracao);
router.get("/painel", controller.painel);
router.get("/carteira", controller.carteira);
router.post("/movimentos", controller.lancarMovimento);
module.exports = router;
