const Produto = require("../../models/produto");
const Recipe = require("../../models/Recipe");

class FoodDashboardService {

    async obterResumo() {

        const [
            totalProdutos,
            totalReceitas
        ] = await Promise.all([
            Produto.countDocuments(),
            Recipe.countDocuments()
        ]);

        const produtosSemReceita =
            Math.max(0, totalProdutos - totalReceitas);

        return {

            totalProdutos,

            totalReceitas,

            produtosSemReceita,

            cmvMedio: 0,

            custoTotal: 0,

            alertas: []

        };

    }

}

module.exports = new FoodDashboardService();