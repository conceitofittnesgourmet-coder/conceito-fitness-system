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

    // Numeração exclusiva da NFC-e, modelo 65.
    serieNfce: {
      type: Number,
      default: 1,
      min: 1,
    },

    proximoNumeroNfce: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Numeração exclusiva da NF-e, modelo 55.
    serieNfe: {
      type: Number,
      default: 1,
      min: 1,
    },

    proximoNumeroNfe: {
      type: Number,
      default: 1,
      min: 1,
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

    credenciadoNfe: {
      type: Boolean,
      default: false,
    },

    ultimoNsuDistribuicao: {
  type: String,
  default: "000000000000000",
  trim: true,
},

maxNsuDistribuicao: {
  type: String,
  default: "",
  trim: true,
},

ultimaConsultaDistribuicao: {
  type: Date,
  default: null,
},

    observacao: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Uma configuração fiscal por empresa.
configuracaoFiscalSchema.index(
  { empresa: 1 },
  {
    unique: true,
    partialFilterExpression: { empresa: { $type: "objectId" } },
  }
);

module.exports =
  mongoose.models.ConfiguracaoFiscal ||
  mongoose.model("ConfiguracaoFiscal", configuracaoFiscalSchema);
