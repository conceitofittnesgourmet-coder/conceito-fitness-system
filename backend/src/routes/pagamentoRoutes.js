const express =
require("express");

const router =
express.Router();

const {

  criarPix

} = require(

  "../controllers/pagamentoController"

);

router.post(
  "/pix",
  criarPix
);

module.exports =
router;