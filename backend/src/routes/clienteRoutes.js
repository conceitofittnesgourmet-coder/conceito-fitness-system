const express = require("express");

const router = express.Router();

const {
  listarClientes,
  criarCliente,
  atualizarCliente,
  deletarCliente,
  acessarCardapio,
  perfilCardapio,
  atualizarFavoritosCardapio,
} = require("../controllers/clientecontroller");

router.post("/cardapio/acessar", acessarCardapio);
router.get("/cardapio/perfil", perfilCardapio);
router.put("/cardapio/favoritos", atualizarFavoritosCardapio);

router.get("/", listarClientes);
router.post("/", criarCliente);
router.put("/:id", atualizarCliente);
router.delete("/:id", deletarCliente);
router.get("/buscar", buscarClientes);

module.exports = router;