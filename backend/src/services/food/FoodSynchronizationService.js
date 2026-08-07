"use strict";

const FoodCore = require("../../core/food/FoodCore");

class FoodSynchronizationService {

    sincronizar(produto, receita) {

        if (!produto) {
            throw new Error("Produto não informado.");
        }

        if (!receita) {
            throw new Error("Receita não informada.");
        }

        const resultado = FoodCore.processar(receita);

        produto.food = produto.food || {};

        produto.food.nutricao = resultado.nutricional;

        produto.food.producao = resultado.producao;

        produto.food.core = {

            ...produto.food.core,

            custoProducao: resultado.custos.custoTotal,

            custoPorPorcao: resultado.custos.custoPorPorcao,

            ultimaAtualizacao: new Date()

        };

        return {

            produto,

            resultado

        };

    }

}

module.exports = new FoodSynchronizationService();