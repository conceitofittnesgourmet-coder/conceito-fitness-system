"use strict";

/**
 * ============================================================
 * ERP Conceito Fitness Gourmet
 * FoodCore - RecipeEngine
 * ------------------------------------------------------------
 * Responsável por validar e processar receitas.
 * Não acessa banco de dados.
 * Não conhece Express.
 * Não conhece Mongoose.
 * ============================================================
 */

class RecipeEngine {

    processar(recipe = {}) {

        if (!recipe) {
            throw new Error("Receita não informada.");
        }

        if (!Array.isArray(recipe.ingredientes)) {
            throw new Error("A receita deve possuir uma lista de ingredientes.");
        }

        if (recipe.ingredientes.length === 0) {
            throw new Error("A receita deve possuir pelo menos um ingrediente.");
        }

        let pesoTotal = 0;

        const ingredientes = recipe.ingredientes.map(item => {

            const quantidade = Number(item.quantidade || 0);

            pesoTotal += quantidade;

            return {
                ...item,
                quantidade
            };

        });

        return {

            ...recipe,

            ingredientes,

            quantidadeIngredientes: ingredientes.length,

            pesoTotal

        };

    }

}

module.exports = new RecipeEngine();