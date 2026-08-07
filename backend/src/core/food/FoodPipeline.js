"use strict";

const FoodCore = require("./FoodCore");

class FoodPipeline {

    executar(recipe) {

        const resultado = FoodCore.processar(recipe);

        return {
            sucesso: true,
            processadoEm: new Date(),
            resultado
        };

    }

}

module.exports = new FoodPipeline();