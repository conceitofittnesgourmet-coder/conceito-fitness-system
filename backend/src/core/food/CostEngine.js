"use strict";

/**
 * ============================================================
 * ERP Conceito Fitness Gourmet
 * FoodCore - CostEngine
 * ------------------------------------------------------------
 * Calcula custos, CMV e custo por porção.
 * ============================================================
 */

class CostEngine {

    calcular(recipe = {}) {

        let custoTotal = 0;

        const ingredientes = recipe.ingredientes || [];

        for (const ingrediente of ingredientes) {

            const quantidade = Number(ingrediente.quantidade || 0);

            const custoKg =
                Number(
                    ingrediente.produto?.custoCompra ??
                    ingrediente.produto?.custo ??
                    0
                );

            const custoGrama = custoKg / 1000;

            custoTotal += quantidade * custoGrama;

        }

        const rendimento =
            Number(recipe.rendimento || 1);

        return {

            custoTotal,

            custoPorPorcao:
                rendimento > 0
                    ? Number((custoTotal / rendimento).toFixed(2))
                    : custoTotal

        };

    }

}

module.exports = new CostEngine();