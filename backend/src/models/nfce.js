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

module.exports =
  mongoose.models.Nfce || mongoose.model("Nfce", nfceSchema);