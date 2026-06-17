const express = require("express");
const router = express.Router();

const controller = require("../controllers/configuracaofiscalcontroller");

router.get("/", controller.buscarConfiguracao);
router.get("/status", controller.statusFiscal);
router.put("/", controller.salvarConfiguracao);

module.exports = router;