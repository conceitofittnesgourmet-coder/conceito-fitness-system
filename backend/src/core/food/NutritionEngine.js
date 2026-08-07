"use strict";

/**
 * ============================================================
 * ERP Conceito Fitness Gourmet
 * FoodCore - NutritionEngine
 * ------------------------------------------------------------
 * Responsável pelos cálculos nutricionais.
 * Não acessa banco.
 * Não conhece Express.
 * Não conhece Mongoose.
 * ============================================================
 */

class NutritionEngine {

    calcular(receita = {}) {

        const resultado = {
            energia: 0,
            carboidratos: 0,
            acucaresTotais: 0,
            acucaresAdicionados: 0,
            proteinas: 0,
            gordurasTotais: 0,
            gordurasSaturadas: 0,
            gordurasTrans: 0,
            fibras: 0,
            sodio: 0
        };

        if (!Array.isArray(receita.ingredientes)) {
            return resultado;
        }

        for (const ingrediente of receita.ingredientes) {

            const quantidade = Number(ingrediente.quantidade || 0);

            const tabela =
                ingrediente.produto?.informacaoNutricional || {};

            Object.keys(resultado).forEach(campo => {

                const valor100g = Number(tabela[campo] || 0);

                resultado[campo] +=
                    (valor100g / 100) * quantidade;

            });

        }

        return resultado;

    }

}

module.exports = new NutritionEngine();