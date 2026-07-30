const mongoose = require("mongoose");

const assinaturaClubeSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente", required: true, index: true },
  plano: { type: mongoose.Schema.Types.ObjectId, ref: "PlanoAssinaturaClube", required: true, index: true },
  status: { type: String, enum: ["ativa", "pendente", "pausada", "cancelada", "vencida"], default: "ativa", index: true },
  inicio: { type: Date, default: Date.now },
  vencimento: { type: Date, required: true, index: true },
  renovacaoAutomatica: { type: Boolean, default: false },
  formaPagamento: { type: String, default: "manual", trim: true },
  valorContratado: { type: Number, min: 0, default: 0 },
  observacao: { type: String, default: "", trim: true },
  canceladaEm: { type: Date, default: null },
}, { timestamps: true });

assinaturaClubeSchema.index({ cliente: 1, status: 1 });
module.exports = mongoose.models.AssinaturaClube || mongoose.model("AssinaturaClube", assinaturaClubeSchema);
