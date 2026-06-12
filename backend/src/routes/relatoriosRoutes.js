const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authmiddleware");

const {
  relatorioGeral,
} = require("../controllers/relatorioscontroller");

router.get("/", authMiddleware, relatorioGeral);

module.exports = router;