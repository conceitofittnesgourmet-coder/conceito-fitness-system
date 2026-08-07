"use strict";

const FoodCoreFacade =
    require("../../core/food/FoodCoreFacade");
const Produto = require("../../models/produto");

class RecipeIntegrationService {

    async processar(recipe) {

        const resultado = FoodCoreFacade.processarReceita(recipe);

        await Produto.findByIdAndUpdate(

            recipe.produto,

            {

    /* ==========================================
       CAMPOS LEGADOS
    ========================================== */

    fichaTecnica: resultado.fichaTecnica,

    informacaoNutricional: resultado.nutricional,

    custoProducao: resultado.custos.custoTotal,

    custoPorPorcao: resultado.custos.custoPorPorcao,

    /* ==========================================
       NOVO CADASTRO MESTRE
    ========================================== */

    "cadastroMestre.nutricional": resultado.nutricional,

    "cadastroMestre.producao.pesoFinalGramas":
        resultado.producao.pesoFinal,

    "cadastroMestre.producao.rendimentoPadrao":
        resultado.producao.rendimento,

    atualizadoEm: new Date()

},

{

                new: true

            }

        );

        return resultado;

    }

}

module.exports = new RecipeIntegrationService();