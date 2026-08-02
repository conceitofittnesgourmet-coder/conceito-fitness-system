const mongoose = require("mongoose");

const caixaSchema = new mongoose.Schema(
  {
    empresa: { type: mongoose.Schema.Types.ObjectId, ref: "Empresa", index: true },

    status: {
      type: String,
      enum: ["aberto", "fechado"],
      default: "aberto",
    },

    operador: {
      type: String,
      default: "Administrador",
    },

    saldoInicial: {
      type: Number,
      default: 0,
    },

    totalVendas: {
      type: Number,
      default: 0,
    },

    totalPix: {
      type: Number,
      default: 0,
    },

    totalCredito: {
      type: Number,
      default: 0,
    },

    totalDebito: {
      type: Number,
      default: 0,
    },

    totalDinheiro: {
      type: Number,
      default: 0,
    },

    totalOutros: { type: Number, default: 0 },
    quantidadePedidos: { type: Number, default: 0 },
    ticketMedio: { type: Number, default: 0 },
    maiorVenda: { type: Number, default: 0 },

    sangrias: [
      {
        valor: Number,
        motivo: String,
        data: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    suprimentos: [
      {
        valor: Number,
        motivo: String,
        data: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    abertoEm: {
      type: Date,
      default: Date.now,
    },

    fechadoEm: {
      type: Date,
      default: null,
    },

    valorContado: {
  type: Number,
  default: 0,
},

diferencaFechamento: {
  type: Number,
  default: 0,
},

observacaoFechamento: {
  type: String,
  default: "",
},
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Caixa || mongoose.model("Caixa", caixaSchema);