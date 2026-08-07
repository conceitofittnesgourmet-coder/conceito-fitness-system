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

    const quantidade =
        Number(item.quantidade || 0);

    const fatorCorrecao =
        Number(item.fatorCorrecao || 1);

    const fatorCoccao =
        Number(item.fatorCoccao || 1);

    const perda =
        Number(item.perda || 0);

    let quantidadeConvertida =
        quantidade;

    switch (String(item.unidade || "g").toLowerCase()) {

        case "kg":

            quantidadeConvertida =
                quantidade * 1000;

            break;

        case "l":

            quantidadeConvertida =
                quantidade * 1000;

            break;

        case "ml":

            quantidadeConvertida =
                quantidade;

            break;

        case "g":

            quantidadeConvertida =
                quantidade;

            break;

        default:

            quantidadeConvertida =
                quantidade;

    }

    const pesoBruto =
        quantidadeConvertida;

    const pesoLiquido =
        pesoBruto * fatorCorrecao;

    const pesoPosCoccao =
        pesoLiquido * fatorCoccao;

    const pesoFinal =
        pesoPosCoccao * (1 - perda / 100);

    pesoTotal += pesoFinal;

    return {

        ...item,

        quantidade,

        quantidadeConvertida,

        pesoBruto,

        pesoLiquido,

        pesoPosCoccao,

        pesoFinal,

        fatorCorrecao,

        fatorCoccao,

        perda

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