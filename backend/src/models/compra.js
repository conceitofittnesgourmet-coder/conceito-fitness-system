const mongoose = require("mongoose");

const compraSchema = new mongoose.Schema(
  {
    fornecedor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fornecedor",
      default: null,
    },

    fornecedorNome: {
      type: String,
      default: "",
    },

    itens: [
      {
        materiaPrima: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MateriaPrima",
          required: true,
        },

        nome: {
          type: String,
          default: "",
        },

        quantidade: {
          type: Number,
          required: true,
        },

        unidade: {
          type: String,
          default: "unidade",
        },

        custoUnitario: {
          type: Number,
          default: 0,
        },

        total: {
          type: Number,
          default: 0,
        },
      },
    ],

    valorTotal: {
      type: Number,
      default: 0,
    },

    formaPagamento: {
      type: String,
      default: "PIX",
    },

    status: {
      type: String,
      enum: ["pendente", "recebida", "cancelada"],
      default: "recebida",
    },

    dataCompra: {
      type: Date,
      default: Date.now,
    },

    observacao: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Compra", compraSchema);