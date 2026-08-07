const express = require("express");

const router = express.Router();

const recipeController =
    require("../controllers/recipeController");

// Listar receitas
router.get(
    "/",
    recipeController.listar.bind(recipeController)
);

// Buscar por ID
router.get(
    "/:id",
    recipeController.buscar.bind(recipeController)
);

// Criar
router.post(
    "/",
    recipeController.criar.bind(recipeController)
);

// Atualizar
router.put(
    "/:id",
    recipeController.atualizar.bind(recipeController)
);

// Excluir
router.delete(
    "/:id",
    recipeController.excluir.bind(recipeController)
);

module.exports = router;