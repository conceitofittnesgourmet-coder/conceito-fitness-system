"use strict";

/**
 * ============================================================
 * ERP Conceito Fitness Gourmet
 * NutritionCalculator v1.0
 * ------------------------------------------------------------
 * Responsável por calcular:
 *  - Peso final
 *  - Valor nutricional total
 *  - Valor nutricional por 100g
 *  - Valor nutricional por porção
 * ============================================================
 */

const CAMPOS = [
    "energia",
    "carboidratos",
    "acucaresTotais",
    "acucaresAdicionados",
    "proteinas",
    "gordurasTotais",
    "gordurasSaturadas",
    "gordurasTrans",
    "fibras",
    "sodio"
];

class NutritionCalculator {

    calcular(ingredientes = [], receita = {}) {

        const totais = {};

        CAMPOS.forEach(campo => {
            totais[campo] = 0;
        });

        let pesoFinal = 0;

        ingredientes.forEach(item => {

            const peso = Number(item.quantidade || 0);

            pesoFinal += peso;

            const tabela = item.tabelaNutricional || {};

            CAMPOS.forEach(campo => {

                const valor100g = Number(tabela[campo] || 0);

                totais[campo] += (valor100g / 100) * peso;

            });

        });

        const porcoes = Number(receita.rendimento || 1);

        const porPorcao = {};

        CAMPOS.forEach(campo => {

            porPorcao[campo] =
                Number((totais[campo] / porcoes).toFixed(2));

        });

        return {

            pesoFinal,

            rendimento: porcoes,

            total: totais,

            porPorcao

        };

    }

}

module.exports = new NutritionCalculator();