const mongoose = require("mongoose");

const opcaoComponenteSchema = new mongoose.Schema(
  {
    grupo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GrupoComponente",
      required: true,
    },

    nome: {
      type: String,
      required: true,
      trim: true,
    },

    descricao: {
      type: String,
      default: "",
    },

    precoAdicional: {
      type: Number,
      default: 0,
    },

    custoAdicional: {
      type: Number,
      default: 0,
    },

    imagem: {
      type: String,
      default: "",
    },

    ordem: {
      type: Number,
      default: 0,
    },

    ativo: {
      type: Boolean,
      default: true,
    },

    codigoExterno: {
      type: String,
      default: "",
      trim: true,
    },

    canais: {
      pdv: { type: Boolean, default: true },
      cardapio: { type: Boolean, default: true },
      pwa: { type: Boolean, default: true },
      ifood: { type: Boolean, default: false },
    },

    disponibilidade: {
      disponivel: { type: Boolean, default: true },
      motivo: { type: String, default: "", trim: true },
      controlarEstoque: { type: Boolean, default: false },
      estoque: { type: Number, default: 0 },
      estoqueMinimo: { type: Number, default: 1 },
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.OpcaoComponente ||
  mongoose.model("OpcaoComponente", opcaoComponenteSchema);