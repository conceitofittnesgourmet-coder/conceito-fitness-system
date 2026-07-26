const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const authMiddleware = require("../middlewares/authmiddleware");

const {
  listarProdutos,
  listarProdutosCardapio,
  buscarProduto,
  criarProduto,
  atualizarProduto,
  atualizarPublicacaoProduto,
  deletarProduto,
} = require("../controllers/produtocontroller");

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const nomeArquivo = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${ext}`;

    cb(null, nomeArquivo);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Apenas imagens são permitidas"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// LISTAR PRODUTOS — PÚBLICO
router.get("/", listarProdutos);

// CARDÁPIO ONLINE — PÚBLICO
router.get(
  "/cardapio",
  listarProdutosCardapio
);

// CRIAR — PROTEGIDO
router.post(
  "/",
  authMiddleware,
  upload.array("imagens", 10),
  criarProduto
);

// PUBLICAÇÃO E DISPONIBILIDADE — PROTEGIDO
router.patch(
  "/:id/publicacao",
  authMiddleware,
  atualizarPublicacaoProduto
);

// BUSCAR PRODUTO POR ID — PÚBLICO
router.get(
  "/:id",
  buscarProduto
);

// EDITAR — PROTEGIDO
router.put(
  "/:id",
  authMiddleware,
  upload.array("imagens", 10),
  atualizarProduto
);

// DELETAR — PROTEGIDO
router.delete(
  "/:id",
  authMiddleware,
  deletarProduto
);

module.exports = router;