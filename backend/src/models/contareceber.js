const mongoose = require("mongoose");

const contaReceberSchema = new mongoose.Schema(
  {
    descricao: { type: String, required: true },
    cliente: { type: String, default: "" },

    valor: { type: Number, required: true },
    vencimento: { type: Date, required: true },
    dataRecebimento: { type: Date, default: null },

    status: {
      type: String,
      enum: ["pendente", "recebida", "vencida", "cancelada"],
      default: "pendente",
    },

    formaRecebimento: {
      type: String,
      default: "",
    },

    pedido: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pedido",
      default: null,
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
  mongoose.models.ContaReceber ||
  mongoose.model("ContaReceber", contaReceberSchema);