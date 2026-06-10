const mongoose = require("mongoose");

const materiaPrimaSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },

    categoria: {
      type: String,
      default: "Insumos",
    },

    unidade: {
      type: String,
      enum: ["kg", "g", "litro", "ml", "unidade"],
      default: "unidade",
    },

    estoqueAtual: {
      type: Number,
      default: 0,
    },

    estoqueMinimo: {
      type: Number,
      default: 0,
    },

    custoUnitario: {
      type: Number,
      default: 0,
    },

    fornecedor: {
      type: String,
      default: "",
    },

    ativo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MateriaPrima", materiaPrimaSchema);