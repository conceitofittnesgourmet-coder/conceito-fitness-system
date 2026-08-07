"use strict";

/**
 * ============================================================
 * ERP Conceito Fitness Gourmet
 * FoodCore - AnvisaLabelEngine
 *
 * Responsável por transformar os cálculos nutricionais
 * em uma estrutura pronta para impressão.
 * ============================================================
 */

class AnvisaLabelEngine {

    gerar(nutricional = {}) {

        const porcao =
            Number(nutricional.pesoPorPorcao || 0);

        const vd = (valor, referencia) => {

            if (!referencia)
                return 0;

            return Number(
                ((valor / referencia) * 100).toFixed(1)
            );

        };

        return {

            porcao,

            unidade: "g",

            itens: [

                {
                    nome: "Valor Energético",
                    valor: nutricional.energia || 0,
                    unidade: "kcal",
                    vd: vd(
                        nutricional.energia,
                        2000
                    )
                },

                {
                    nome: "Carboidratos",
                    valor: nutricional.carboidratos || 0,
                    unidade: "g",
                    vd: vd(
                        nutricional.carboidratos,
                        300
                    )
                },

                {
                    nome: "Proteínas",
                    valor: nutricional.proteinas || 0,
                    unidade: "g",
                    vd: vd(
                        nutricional.proteinas,
                        75
                    )
                },

                {
                    nome: "Gorduras Totais",
                    valor: nutricional.gordurasTotais || 0,
                    unidade: "g",
                    vd: vd(
                        nutricional.gordurasTotais,
                        55
                    )
                },

                {
                    nome: "Gorduras Saturadas",
                    valor: nutricional.gordurasSaturadas || 0,
                    unidade: "g",
                    vd: vd(
                        nutricional.gordurasSaturadas,
                        22
                    )
                },

                {
                    nome: "Gorduras Trans",
                    valor: nutricional.gordurasTrans || 0,
                    unidade: "g",
                    vd: 0
                },

                {
                    nome: "Fibra Alimentar",
                    valor: nutricional.fibras || 0,
                    unidade: "g",
                    vd: vd(
                        nutricional.fibras,
                        25
                    )
                },

                {
                    nome: "Sódio",
                    valor: nutricional.sodio || 0,
                    unidade: "mg",
                    vd: vd(
                        nutricional.sodio,
                        2000
                    )
                }

            ]

        };

    }

}

module.exports = new AnvisaLabelEngine();