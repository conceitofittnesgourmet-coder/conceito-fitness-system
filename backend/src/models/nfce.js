const mongoose = require("mongoose");

const nfceSchema = new mongoose.Schema(
  {
    pedido: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pedido",
      required: true,
    },

    numero: {
      type: Number,
      required: true,
    },

    serie: {
      type: Number,
      default: 1,
    },

    modelo: {
      type: String,
      default: "65",
    },

    ambiente: {
      type: String,
      enum: ["homologacao", "producao"],
      default: "homologacao",
    },

    chaveAcesso: {
      type: String,
      default: "",
    },

    cpfNota: {
      type: String,
      default: "",
    },

    valorTotal: {
      type: Number,
      default: 0,
    },

    xml: {
      type: String,
      default: "",
    },

    xmlAssinado: {
  type: String,
  default: "",
},

    status: {
      type: String,
      enum: [
        "gerada",
        "assinada",
        "autorizada",
        "rejeitada",
        "cancelada",
        "erro",
      ],
      default: "gerada",
    },

    protocolo: {
      type: String,
      default: "",
    },

    recibo: {
  type: String,
  default: "",
},

cStat: {
  type: String,
  default: "",
},

dataAutorizacao: {
  type: Date,
},

    mensagemSefaz: {
      type: String,
      default: "",
    },

    qrCodeUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

nfceSchema.index(
  {
    ambiente: 1,
    serie: 1,
    numero: 1,
  },
  {
    unique: true,
    name: "UK_NFCE_NUMERO_SERIE_AMBIENTE",
  }
);

module.exports =
  mongoose.models.Nfce || mongoose.model("Nfce", nfceSchema);