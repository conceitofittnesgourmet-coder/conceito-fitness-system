const express = require("express");
const router = express.Router();

const producaoController = require("../controllers/producaoController");

router.get("/materias-primas", producaoController.listarMateriasPrimas);
router.post("/materias-primas", producaoController.criarMateriaPrima);
router.put("/materias-primas/:id", producaoController.atualizarMateriaPrima);
router.delete("/materias-primas/:id", producaoController.deletarMateriaPrima);

router.get("/fichas-tecnicas", producaoController.listarFichasTecnicas);
router.post("/fichas-tecnicas", producaoController.criarFichaTecnica);

router.post("/produzir", producaoController.produzirProduto);

module.exports = router;