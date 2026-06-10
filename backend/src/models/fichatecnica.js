const mongoose = require("mongoose");

const fichaTecnicaSchema = new mongoose.Schema(
  {
    produto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produto",
      required: true,
    },

    itens: [
      {
        materiaPrima: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MateriaPrima",
          required: true,
        },

        quantidade: {
          type: Number,
          required: true,
        },

        unidade: {
          type: String,
          default: "unidade",
        },

        custo: {
          type: Number,
          default: 0,
        },
      },
    ],

    custoTotal: {
      type: Number,
      default: 0,
    },

    observacao: {
      type: String,
      default: "",
    },

    ativa: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FichaTecnica", fichaTecnicaSchema);