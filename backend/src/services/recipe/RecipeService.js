"use strict";

const Recipe = require("../../models/Recipe");

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

        const recipe = new Recipe(dados);

        return recipe.save();

    }

    async atualizar(id, dados) {

        return Recipe.findByIdAndUpdate(
            id,
            dados,
            {
                new: true,
                runValidators: true
            }
        );

    }

    async excluir(id) {

        return Recipe.findByIdAndDelete(id);

    }

}

module.exports = new RecipeService();