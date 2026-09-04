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
  conferirNotaEntrada,
  buscarNfePelaChave,
  buscarNfesRecebidas,
  importarNfeRecebida,
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

router.patch(
  "/notas-entrada/:id/conferencia",
  authMiddleware,
  conferirNotaEntrada
);

router.post(
  "/notas-entrada/buscar-chave",
  authMiddleware,
  buscarNfePelaChave
);
router.get(
  "/notas-entrada/recebidas",
  authMiddleware,
  buscarNfesRecebidas
);
router.post(
  "/notas-entrada/recebidas/:id/importar",
  authMiddleware,
  importarNfeRecebida
);

router.get("/notas-entrada/:id", authMiddleware, buscarNotaEntrada);
router.patch("/notas-entrada/:id/cancelar", authMiddleware, cancelarNotaEntrada);
router.delete("/notas-entrada/:id", authMiddleware, excluirNotaEntrada);

module.exports = router;