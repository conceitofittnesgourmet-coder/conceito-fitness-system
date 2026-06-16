const mongoose = require("mongoose");

const configuracaoFiscalSchema = new mongoose.Schema(
  {
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
    },

    ambiente: {
      type: String,
      enum: ["homologacao", "producao"],
      default: "homologacao",
    },

    modelo: {
      type: String,
      default: "65",
    },

    serieNfce: {
      type: Number,
      default: 1,
    },

    proximoNumeroNfce: {
      type: Number,
      default: 1,
    },

    cscId: {
      type: String,
      default: "",
    },

    cscToken: {
      type: String,
      default: "",
    },

    certificadoConfigurado: {
      type: Boolean,
      default: false,
    },

    credenciadoNfce: {
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

module.exports =
  mongoose.models.ConfiguracaoFiscal ||
  mongoose.model("ConfiguracaoFiscal", configuracaoFiscalSchema);