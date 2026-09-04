const mongoose = require("mongoose");

const contaPagarSchema = new mongoose.Schema(
 
  {
    notaFiscalEntrada: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "NotaFiscalEntrada",
  default: null,
},

parcelaNumero: {
  type: String,
  default: "",
},
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

contaPagarSchema.index(
  {
    notaFiscalEntrada: 1,
    parcelaNumero: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      notaFiscalEntrada: {
        $type: "objectId",
      },
      parcelaNumero: {
        $type: "string",
        $gt: "",
      },
    },
  }
);

module.exports =
  mongoose.models.ContaPagar ||
  mongoose.model("ContaPagar", contaPagarSchema);