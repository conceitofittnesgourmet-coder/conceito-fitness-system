const express = require("express");
const router = express.Router();

const verifyToken = require("../middlewares/verifytoken");
const empresa = require("../middlewares/empresa");
const controller = require("../controllers/configuracaofiscalcontroller");

router.get(
  "/",
  verifyToken,
  empresa,
  controller.buscarConfiguracao
);

router.get(
  "/status",
  verifyToken,
  empresa,
  controller.statusFiscal
);

router.put(
  "/",
  verifyToken,
  empresa,
  controller.salvarConfiguracao
);

module.exports = router;