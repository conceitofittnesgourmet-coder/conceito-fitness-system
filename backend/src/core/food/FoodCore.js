"use strict";

const RecipeEngine = require("./RecipeEngine");
const NutritionEngine = require("./NutritionEngine");
const CostEngine = require("./CostEngine");
const ProductionEngine =
    require("./ProductionEngine");

class FoodCore {

    processar(recipe) {

    const receita = RecipeEngine.processar(recipe);

    const nutricional =
        NutritionEngine.calcular(receita);

    const custos =
        CostEngine.calcular(receita);

    const producao =
    ProductionEngine.calcular(receita);

    return {

    receita,

    nutricional,

    custos,

    producao,

    fichaTecnica: {

        pesoFinal:
            producao.pesoFinal,

        rendimento:
            producao.rendimento,

        ingredientes:
            receita.ingredientes

    }

};

    }

}

module.exports = new FoodCore();