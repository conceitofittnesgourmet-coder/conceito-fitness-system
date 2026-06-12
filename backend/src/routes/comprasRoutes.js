const express = require("express");
const router = express.Router();

const comprasController = require("../controllers/comprascontroller");

router.get("/fornecedores", comprasController.listarFornecedores);
router.post("/fornecedores", comprasController.criarFornecedor);
router.put("/fornecedores/:id", comprasController.atualizarFornecedor);
router.delete("/fornecedores/:id", comprasController.deletarFornecedor);

router.get("/", comprasController.listarCompras);
router.post("/", comprasController.criarCompra);

module.exports = router;