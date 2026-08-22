const express = require("express");
const multer = require("multer");
const router = express.Router();

const authMiddleware = require("../middlewares/authmiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const {
  listarNotasEntrada,
  criarNotaEntrada,
  buscarNotaEntrada,
  cancelarNotaEntrada,
  excluirNotaEntrada,
  resumoFiscal,
  importarXmlNotaEntrada,
  processarNotaNoEstoque,
} = require("../controllers/fiscalcontroller");

router.get("/resumo", authMiddleware, resumoFiscal);

router.post(
  "/notas-entrada/importar-xml",
  authMiddleware,
  upload.single("xml"),
  importarXmlNotaEntrada
);

router.get("/notas-entrada", authMiddleware, listarNotasEntrada);
router.post("/notas-entrada", authMiddleware, criarNotaEntrada);
router.post(
  "/notas-entrada/:id/processar-estoque",
  authMiddleware,
  processarNotaNoEstoque
);
router.get("/notas-entrada/:id", authMiddleware, buscarNotaEntrada);
router.patch("/notas-entrada/:id/cancelar", authMiddleware, cancelarNotaEntrada);
router.delete("/notas-entrada/:id", authMiddleware, excluirNotaEntrada);

module.exports = router;