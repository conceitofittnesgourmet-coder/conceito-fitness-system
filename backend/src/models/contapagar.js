const mongoose = require("mongoose");

const contaPagarSchema = new mongoose.Schema(
  {
    descricao: { type: String, required: true },
    categoria: { type: String, default: "Outros" },
    fornecedor: { type: String, default: "" },

    valor: { type: Number, required: true },
    vencimento: { type: Date, required: true },
    dataPagamento: { type: Date, default: null },

    status: {
      type: String,
      enum: ["pendente", "paga", "vencida", "cancelada"],
      default: "pendente",
    },

    formaPagamento: {
      type: String,
      default: "",
    },

    observacao: {
      type: String,
      default: "",
    },

    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ContaPagar ||
  mongoose.model("ContaPagar", contaPagarSchema);