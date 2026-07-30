const mongoose = require("mongoose");

const planoAssinaturaClubeSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  descricao: { type: String, default: "", trim: true },
  valor: { type: Number, required: true, min: 0 },
  periodicidade: { type: String, enum: ["mensal", "trimestral", "semestral", "anual"], default: "mensal" },
  duracaoDias: { type: Number, min: 1, default: 30 },
  pontosBonus: { type: Number, min: 0, default: 0 },
  cashbackExtra: { type: Number, min: 0, default: 0 },
  descontoPercentual: { type: Number, min: 0, max: 100, default: 0 },
  beneficios: { type: [String], default: [] },
  destaque: { type: Boolean, default: false },
  ativo: { type: Boolean, default: true, index: true },
}, { timestamps: true });

module.exports = mongoose.models.PlanoAssinaturaClube || mongoose.model("PlanoAssinaturaClube", planoAssinaturaClubeSchema);
