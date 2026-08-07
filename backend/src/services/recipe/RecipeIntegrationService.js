"use strict";

const FoodCore = require("../../core/food/FoodCore");
const Produto = require("../../models/Produto");

class RecipeIntegrationService {

    async processar(recipe) {

        const resultado = FoodCore.processar(recipe);

        await Produto.findByIdAndUpdate(

            recipe.produto,

            {

                fichaTecnica: resultado.fichaTecnica,

                informacaoNutricional: resultado.nutricional,

                custoProducao: resultado.custos.custoTotal,

                custoPorPorcao: resultado.custos.custoPorPorcao,

                atualizadoEm: new Date()

            },

            {

                new: true

            }

        );

        return resultado;

    }

}

module.exports = new RecipeIntegrationService();