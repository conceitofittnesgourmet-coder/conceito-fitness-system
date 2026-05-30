const mongoose = require("mongoose");

const produtoSchema = new mongoose.Schema(
  {
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
    },

    nome: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      unique: true,
    },

    descricao: {
      type: String,
      default: "",
    },

    categoria: {
     type: String,
     default: "Gourmet"
    },

    preco: {
      type: Number,
      required: true,
    },

    estoque: {
      type: Number,
      default: 0,
    },

    estoqueMinimo: {
      type: Number,
      default: 5,
    },

    movimentacoes: [
  {
    tipo: {
      type: String,
      enum: [
        "entrada",
        "saida",
        "ajuste",
        "venda",
      ],
    },

    quantidade: Number,

    motivo: String,

    data: {
      type: Date,
      default: Date.now,
    },
  },
],

    tempoPreparo: {
      type: Number,
      default: 0
    },

    restricoes: {
      type: String,
      default: ""
    },

    peso: {
      type: String,
      default: ""
    },

    destaque: {
      type: Boolean,
      default: false,
    },

    ativo: {
      type: Boolean,
      default: true,
    },

    imagens: [
      {
        url: String,
        public_id: String,
        filename: String,
        path: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Produto",
  produtoSchema
);