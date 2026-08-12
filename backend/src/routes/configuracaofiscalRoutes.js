const express = require("express");
const router = express.Router();

const verifyToken = require("../middlewares/verifytoken");
const controller = require("../controllers/configuracaofiscalcontroller");

router.get(
  "/",
  verifyToken,
  controller.buscarConfiguracao
);

router.get(
  "/status",
  verifyToken,
  controller.statusFiscal
);

router.put(
  "/",
  verifyToken,
  controller.salvarConfiguracao
);

module.exports = router;