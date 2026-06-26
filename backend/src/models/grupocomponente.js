const mongoose = require("mongoose");

const grupoComponenteSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    descricao: {
      type: String,
      default: "",
    },

    tipo: {
      type: String,
      enum: [
        "massa",
        "recheio",
        "cobertura",
        "bebida",
        "doce",
        "salgado",
        "adicional",
        "tamanho",
        "personalizado",
      ],
      default: "personalizado",
    },

    obrigatorio: {
      type: Boolean,
      default: false,
    },

    minimoEscolhas: {
      type: Number,
      default: 0,
    },

    maximoEscolhas: {
      type: Number,
      default: 1,
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
  mongoose.models.GrupoComponente ||
  mongoose.model("GrupoComponente", grupoComponenteSchema);