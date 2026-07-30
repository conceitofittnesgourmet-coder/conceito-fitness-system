const mongoose = require("mongoose");

const cupomClubeSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  nome: { type: String, required: true, trim: true },
  descricao: { type: String, default: "", trim: true },
  tipo: { type: String, enum: ["percentual", "fixo", "frete_gratis"], default: "percentual" },
  valor: { type: Number, default: 0, min: 0 },
  pedidoMinimo: { type: Number, default: 0, min: 0 },
  limiteTotal: { type: Number, default: 0, min: 0 },
  limitePorCliente: { type: Number, default: 1, min: 0 },
  usos: { type: Number, default: 0, min: 0 },
  inicio: { type: Date, default: null },
  fim: { type: Date, default: null },
  niveisPermitidos: { type: [String], default: [] },
  ativo: { type: Boolean, default: true, index: true },
}, { timestamps: true });

module.exports = mongoose.models.CupomClube || mongoose.model("CupomClube", cupomClubeSchema);
