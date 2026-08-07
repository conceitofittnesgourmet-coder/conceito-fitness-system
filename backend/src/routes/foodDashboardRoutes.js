const router = require("express").Router();

const controller =
require("../controllers/foodDashboardController");

router.get(
    "/resumo",
    controller.resumo
);

module.exports = router;