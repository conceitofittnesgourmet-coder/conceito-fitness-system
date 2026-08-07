"use strict";

const RecipeEngine = require("./RecipeEngine");
const NutritionEngine = require("./NutritionEngine");
const CostEngine = require("./CostEngine");
const ProductionEngine =
    require("./ProductionEngine");
const AnvisaLabelEngine =
    require("./AnvisaLabelEngine");

class FoodCore {

    processar(recipe) {

    const receita = RecipeEngine.processar(recipe);

    const nutricional =
        NutritionEngine.calcular(receita);

    const custos =
        CostEngine.calcular(receita);

    const producao =
    ProductionEngine.calcular(receita);

    const rotulo =
    AnvisaLabelEngine.gerar(
        nutricional
    );

    return {

    receita,

    nutricional,

    custos,

    producao,

    rotulo,

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