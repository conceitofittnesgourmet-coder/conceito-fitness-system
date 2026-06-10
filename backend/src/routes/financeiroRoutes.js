const express = require("express");

const router = express.Router();

const {
  resumoFinanceiro,
  criarContaPagar,
  pagarConta,
  deletarContaPagar,
  criarContaReceber,
  receberConta,
  deletarContaReceber,
  criarMovimentacao,
} = require("../controllers/financeiroController");

// RESUMO
router.get("/", resumoFinanceiro);

// CONTAS A PAGAR
router.post("/contas-pagar", criarContaPagar);
router.put("/contas-pagar/:id/pagar", pagarConta);
router.delete("/contas-pagar/:id", deletarContaPagar);

// CONTAS A RECEBER
router.post("/contas-receber", criarContaReceber);
router.put("/contas-receber/:id/receber", receberConta);
router.delete("/contas-receber/:id", deletarContaReceber);

// MOVIMENTAÇÃO MANUAL
router.post("/movimentacoes", criarMovimentacao);

module.exports = router;