const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authmiddleware");

const {
  listarNotasEntrada,
  criarNotaEntrada,
  buscarNotaEntrada,
  cancelarNotaEntrada,
  resumoFiscal,
} = require("../controllers/fiscalcontroller");

router.get("/resumo", authMiddleware, resumoFiscal);

router.get("/notas-entrada", authMiddleware, listarNotasEntrada);
router.post("/notas-entrada", authMiddleware, criarNotaEntrada);
router.get("/notas-entrada/:id", authMiddleware, buscarNotaEntrada);
router.patch("/notas-entrada/:id/cancelar", authMiddleware, cancelarNotaEntrada);

module.exports = router;