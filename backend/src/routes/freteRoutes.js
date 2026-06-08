const express = require("express");

const router = express.Router();

const {
  calcularFrete,
} = require("../controllers/fretecontroller");

router.post("/calcular", calcularFrete);

module.exports = router;