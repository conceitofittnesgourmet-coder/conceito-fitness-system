const express = require("express");

const router = express.Router();

const Categoria = require("../models/Categoria");

router.get("/", async (req, res) => {

  const categorias = await Categoria.find();

  res.json(categorias);

});

router.post("/", async (req, res) => {

  try {

    const categoria = await Categoria.create(
      req.body
    );

    res.json(categoria);

  } catch (err) {

    res.status(500).json({
      erro: err.message
    });

  }

});

router.delete("/:id", async (req, res) => {

  await Categoria.findByIdAndDelete(
    req.params.id
  );

  res.json({
    ok: true
  });

});

module.exports = router;