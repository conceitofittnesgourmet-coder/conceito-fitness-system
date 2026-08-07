"use strict";

/**
 * ============================================================
 * ERP Conceito Fitness Gourmet
 * FoodEngine v1.0
 * ------------------------------------------------------------
 * Motor central de alimentos.
 *
 * Responsabilidades:
 *  - Nutrição
 *  - Ficha Técnica
 *  - Ingredientes
 *  - Alergênicos
 *  - CMV Nutricional
 *  - Peso Final
 *  - Rendimento
 * ============================================================
 */

const NutritionCalculator = require("./NutritionCalculator");
const IngredientsEngine = require("./IngredientsEngine");
const AllergensEngine = require("./AllergensEngine");
const CostEngine = require("./CostEngine");

class FoodEngine {

    /**
     * Processa uma ficha técnica completa.
     * @param {Object} receita
     * @returns {Object}
     */
    processar(receita = {}) {

        const ingredientes =
            IngredientsEngine.processar(
                receita.ingredientes || []
            );

        const nutricional =
            NutritionCalculator.calcular(
                ingredientes,
                receita
            );

        const alergenicos =
            AllergensEngine.processar(
                ingredientes
            );

        const custos =
            CostEngine.calcular(
                ingredientes,
                receita
            );

        return {

            ingredientes,

            nutricional,

            alergenicos,

            custos,

            rendimento:
                nutricional.rendimento,

            pesoFinal:
                nutricional.pesoFinal

        };

    }

}

module.exports = new FoodEngine();