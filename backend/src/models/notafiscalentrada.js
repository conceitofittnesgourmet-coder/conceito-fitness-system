const mongoose = require("mongoose");

const itemNotaSchema = new mongoose.Schema(
  {
    materiaPrima: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MateriaPrima",
      default: null,
    },

    nome: {
      type: String,
      required: true,
      trim: true,
    },

    codigo: {
      type: String,
      default: "",
    },

    unidade: {
      type: String,
      default: "unidade",
    },

    quantidade: {
      type: Number,
      default: 0,
    },

    valorUnitario: {
      type: Number,
      default: 0,
    },

    valorTotal: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const notaFiscalEntradaSchema = new mongoose.Schema(
  {
    numero: {
      type: String,
      required: true,
      trim: true,
    },

    serie: {
      type: String,
      default: "",
    },

    chaveAcesso: {
      type: String,
      default: "",
      trim: true,
    },

    fornecedor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fornecedor",
      default: null,
    },

    fornecedorNome: {
      type: String,
      default: "",
    },

    fornecedorDocumento: {
      type: String,
      default: "",
    },

    dataEmissao: {
      type: Date,
      default: Date.now,
    },

    dataEntrada: {
      type: Date,
      default: Date.now,
    },

    valorProdutos: {
      type: Number,
      default: 0,
    },

    valorFrete: {
      type: Number,
      default: 0,
    },

    valorDesconto: {
      type: Number,
      default: 0,
    },

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
      enum: ["rascunho", "conferida", "entrada_realizada", "cancelada"],
      default: "entrada_realizada",
    },

    itens: [itemNotaSchema],

    xmlImportado: {
      type: Boolean,
      default: false,
    },

    observacao: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NotaFiscalEntrada", notaFiscalEntradaSchema);