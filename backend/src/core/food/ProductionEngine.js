"use strict";

/**
 * ============================================================
 * ERP Conceito Fitness Gourmet
 * FoodCore - ProductionEngine
 * ------------------------------------------------------------
 * Calcula peso final, perdas e rendimento da produção.
 * ============================================================
 */

class ProductionEngine {

    calcular(recipe = {}) {

        const ingredientes = recipe.ingredientes || [];

        let pesoEntrada = 0;

        let perdaTotal = 0;

        for (const ingrediente of ingredientes) {

            const quantidade =
                Number(ingrediente.quantidade || 0);

            const perda =
                Number(ingrediente.perda || 0);

            pesoEntrada += quantidade;

            perdaTotal += perda;

        }

        const pesoFinal =

            pesoEntrada - perdaTotal;

        return {

            pesoEntrada,

            perdaTotal,

            pesoFinal,

            rendimento:

                Number(recipe.rendimento || 1)

        };

    }

}

module.exports = new ProductionEngine();