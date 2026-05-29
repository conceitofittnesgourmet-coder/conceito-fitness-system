const express = require("express");

const router = express.Router();

const {
  buscarEmpresa,
  salvarEmpresa,
} = require("../controllers/empresacontroller");

router.get("/", buscarEmpresa);

router.put("/", salvarEmpresa);

router.post("/", salvarEmpresa);

module.exports = router;