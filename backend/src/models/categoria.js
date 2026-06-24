const mongoose = require("mongoose");

const categoriaSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    descricao: {
      type: String,
      default: "",
    },

    tipo: {
      type: String,
      default: "produto",
    },

    ordem: {
      type: Number,
      default: 0,
    },

    ativo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Categoria || mongoose.model("Categoria", categoriaSchema);