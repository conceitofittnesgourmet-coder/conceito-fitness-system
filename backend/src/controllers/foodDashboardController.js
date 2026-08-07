const FoodDashboardService =
require("../services/food/FoodDashboardService");

exports.resumo = async (req, res) => {

    try {

        const dados =
            await FoodDashboardService.obterResumo();

        res.json(dados);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            erro: err.message
        });

    }

};