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

    icone: {
      type: String,
      default: "",
    },

    cor: {
      type: String,
      default: "#22c55e",
    },

    tipo: {
      type: String,
      enum: ["produto", "combo", "kit", "bolo", "sazonal"],
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

    mostrarPdv: {
      type: Boolean,
      default: true,
    },

    mostrarCardapio: {
      type: Boolean,
      default: true,
    },

    mostrarDelivery: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Categoria || mongoose.model("Categoria", categoriaSchema);