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
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.OpcaoComponente ||
  mongoose.model("OpcaoComponente", opcaoComponenteSchema);