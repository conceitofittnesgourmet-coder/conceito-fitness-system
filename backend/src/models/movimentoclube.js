const mongoose = require("mongoose");

const movimentoClubeSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente", required: true, index: true },
  tipo: { type: String, enum: ["credito_pontos", "debito_pontos", "credito_cashback", "debito_cashback", "ajuste"], required: true, index: true },
  pontos: { type: Number, default: 0 },
  cashback: { type: Number, default: 0 },
  descricao: { type: String, required: true, trim: true },
  origem: { type: String, default: "manual", trim: true },
  referencia: { type: String, default: "", trim: true },
  expiraEm: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.models.MovimentoClube || mongoose.model("MovimentoClube", movimentoClubeSchema);
