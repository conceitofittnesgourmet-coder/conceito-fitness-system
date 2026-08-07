"use strict";

const Recipe = require("../../models/Recipe");
const RecipeIntegrationService =
    require("./RecipeIntegrationService");

class RecipeService {

    async listar(empresa) {

        return Recipe
            .find({ empresa })
            .populate("produto")
            .populate("ingredientes.produto")
            .sort({
                nome: 1,
                versao: -1
            });

    }

    async buscarPorId(id) {

        return Recipe
            .findById(id)
            .populate("produto")
            .populate("ingredientes.produto");

    }

    async criar(dados) {

    const recipe =
        await new Recipe(dados).save();

    await RecipeIntegrationService.processar(
        recipe
    );

    return Recipe
        .findById(recipe._id)
        .populate("produto")
        .populate("ingredientes.produto");

}

    async atualizar(id, dados) {

    const recipe =
        await Recipe.findByIdAndUpdate(

            id,

            dados,

            {

                new: true,

                runValidators: true

            }

        );

    await RecipeIntegrationService.processar(
        recipe
    );

    return Recipe
        .findById(recipe._id)
        .populate("produto")
        .populate("ingredientes.produto");

}

    async excluir(id) {

        return Recipe.findByIdAndDelete(id);

    }

}

module.exports = new RecipeService();