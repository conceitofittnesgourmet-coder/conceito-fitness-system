"use strict";

const FoodCore = require("../FoodCore");

const receita = {

    rendimento: 10,

    ingredientes: [

        {

            quantidade: 100,

            produto: {

                custo: 40,

                informacaoNutricional: {

                    energia: 380,

                    carboidratos: 78,

                    proteinas: 7,

                    gordurasTotais: 1.2,

                    gordurasSaturadas: 0,

                    gordurasTrans: 0,

                    fibras: 2,

                    sodio: 0

                }

            }

        }

    ]

};

const resultado = FoodCore.processar(receita);

console.log(resultado);