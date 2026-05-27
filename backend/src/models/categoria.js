const mongoose = require("mongoose");

const CategoriaSchema = new mongoose.Schema({

  nome: {
    type: String,
    required: true
  },

  slug: {
    type: String,
    required: true,
    unique: true
  },

  ativa: {
    type: Boolean,
    default: true
  },

  ordem: {
    type: Number,
    default: 0
  }

});

module.exports = mongoose.model(
  "Categoria",
  CategoriaSchema
);