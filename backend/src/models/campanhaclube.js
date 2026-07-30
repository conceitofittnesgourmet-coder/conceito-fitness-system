const mongoose = require("mongoose");

const campanhaClubeSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  descricao: { type: String, default: "", trim: true },
  tipoBeneficio: { type: String, enum: ["cashback", "pontos", "pontos_cashback"], default: "cashback" },
  cashbackPercentual: { type: Number, default: 0, min: 0, max: 100 },
  multiplicadorPontos: { type: Number, default: 1, min: 0 },
  pedidoMinimo: { type: Number, default: 0, min: 0 },
  inicio: { type: Date, default: null },
  fim: { type: Date, default: null },
  diasSemana: { type: [Number], default: [] },
  niveisPermitidos: { type: [String], default: [] },
  categorias: { type: [String], default: [] },
  produtos: { type: [mongoose.Schema.Types.ObjectId], ref: "Produto", default: [] },
  limiteCashback: { type: Number, default: 0, min: 0 },
  ativo: { type: Boolean, default: true, index: true },
}, { timestamps: true });

module.exports = mongoose.models.CampanhaClube || mongoose.model("CampanhaClube", campanhaClubeSchema);
