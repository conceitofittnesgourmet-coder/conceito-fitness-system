const express = require("express");

const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");

router.use(authMiddleware);

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
router.get("/historico", historicoCaixas);
router.post("/abrir", abrirCaixa);
router.post("/fechar", fecharCaixa);
router.post("/sangria", registrarSangria);
router.post("/suprimento", registrarSuprimento);

module.exports = router;