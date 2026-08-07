"use strict";

/**
 * ============================================================
 * ERP Conceito Fitness Gourmet
 * FoodCore - CostEngine
 * ------------------------------------------------------------
 * Responsável pelo cálculo de custos e CMV.
 * Não acessa banco.
 * Não conhece Express.
 * Não conhece Mongoose.
 * ============================================================
 */

class CostEngine {

    calcular(receita = {}) {

        let custoTotal = 0;

        if (!Array.isArray(receita.ingredientes)) {
            return {
                custoTotal: 0,
                custoPorGrama: 0,
                custoPorPorcao: 0
            };
        }

        for (const ingrediente of receita.ingredientes) {

            const quantidade = Number(ingrediente.quantidade || 0);

            const custoKg =
                Number(ingrediente.produto?.custo || 0);

            const custoGrama = custoKg / 1000;

            custoTotal += custoGrama * quantidade;

        }

        const pesoFinal =
            Number(receita.pesoFinal || 0);

        const rendimento =
            Number(receita.rendimento || 1);

        return {

            custoTotal,

            custoPorGrama:
                pesoFinal > 0
                    ? custoTotal / pesoFinal
                    : 0,

            custoPorPorcao:
                rendimento > 0
                    ? custoTotal / rendimento
                    : 0

        };

    }

}

module.exports = new CostEngine();