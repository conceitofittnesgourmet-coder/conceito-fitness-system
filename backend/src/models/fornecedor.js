const mongoose = require("mongoose");

const fornecedorSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },

    documento: {
      type: String,
      default: "",
    },

    telefone: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
    },

    endereco: {
      type: String,
      default: "",
    },

    categoria: {
      type: String,
      default: "Geral",
    },

    observacao: {
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

module.exports = mongoose.model("Fornecedor", fornecedorSchema);