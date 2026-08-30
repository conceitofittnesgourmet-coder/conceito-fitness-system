const express =
  require("express");

const router =
  express.Router();

const controller =
  require(
    "../controllers/financeiroCentralController"
  );


router.get(
  "/resumo",
  controller.resumo
);


router.get(
  "/hoje",
  controller.resumoHoje
);


router.get(
  "/mes",
  controller.resumoMes
);


module.exports =
  router;