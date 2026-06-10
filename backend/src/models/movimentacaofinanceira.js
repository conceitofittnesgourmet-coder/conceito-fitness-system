const mongoose = require("mongoose");

const movimentacaoFinanceiraSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: ["entrada", "saida"],
      required: true,
    },

    origem: {
      type: String,
      enum: [
        "pedido",
        "caixa",
        "conta_pagar",
        "conta_receber",
        "compra",
        "manual",
        "ifood",
        "mercadopago",
      ],
      default: "manual",
    },

    descricao: {
      type: String,
      required: true,
    },

    categoria: {
      type: String,
      default: "Geral",
    },

    valor: {
      type: Number,
      required: true,
    },

    data: {
      type: Date,
      default: Date.now,
    },

    formaPagamento: {
      type: String,
      default: "",
    },

    pedido: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pedido",
      default: null,
    },

    contaPagar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContaPagar",
      default: null,
    },

    contaReceber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContaReceber",
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
  mongoose.models.MovimentacaoFinanceira ||
  mongoose.model(
    "MovimentacaoFinanceira",
    movimentacaoFinanceiraSchema
  );