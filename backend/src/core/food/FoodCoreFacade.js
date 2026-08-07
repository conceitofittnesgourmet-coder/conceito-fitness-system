"use strict";

/**
 * ============================================================
 * ERP Conceito Fitness Gourmet
 * FoodCoreFacade
 *
 * Único ponto de entrada do FoodCore.
 * Nenhum Controller ou Service deve chamar o FoodCore diretamente.
 * ============================================================
 */

const FoodCore = require("./FoodCore");

class FoodCoreFacade {

    processarReceita(recipe) {

        return FoodCore.processar(recipe);

    }

}

module.exports = new FoodCoreFacade();