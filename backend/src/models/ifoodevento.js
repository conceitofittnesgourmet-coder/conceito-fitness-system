const mongoose = require("mongoose");

const ifoodEventoSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, default: "", index: true },
    merchantId: { type: String, default: "", index: true },
    code: { type: String, default: "" },
    fullCode: { type: String, default: "" },
    grupo: { type: String, default: "" },
    criadoNoIfoodEm: { type: Date, default: null },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    statusProcessamento: {
      type: String,
      enum: ["recebido", "processado", "erro", "ignorado"],
      default: "recebido",
      index: true,
    },
    tentativas: { type: Number, default: 0 },
    processadoEm: { type: Date, default: null },
    reconhecidoEm: { type: Date, default: null },
    ultimoErro: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.IfoodEvento || mongoose.model("IfoodEvento", ifoodEventoSchema);
