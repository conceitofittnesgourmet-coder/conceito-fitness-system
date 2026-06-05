const express = require("express");

const router = express.Router();

const {
  caixaAtual,
  abrirCaixa,
  fecharCaixa,
  registrarSangria,
  registrarSuprimento,
  resumoCaixa,
  historicoCaixas,
} = require("../controllers/caixacontroller");

router.get("/atual", caixaAtual);
router.get("/resumo", resumoCaixa);
router.post("/abrir", abrirCaixa);
router.post("/fechar", fecharCaixa);
router.post("/sangria", registrarSangria);
router.post("/suprimento", registrarSuprimento);

module.exports = router;