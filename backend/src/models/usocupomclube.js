const mongoose = require("mongoose");

const usoCupomClubeSchema = new mongoose.Schema({
  cupom: { type: mongoose.Schema.Types.ObjectId, ref: "CupomClube", required: true, index: true },
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente", default: null, index: true },
  pedido: { type: mongoose.Schema.Types.ObjectId, ref: "Pedido", default: null },
  telefone: { type: String, default: "", trim: true, index: true },
  desconto: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

module.exports = mongoose.models.UsoCupomClube || mongoose.model("UsoCupomClube", usoCupomClubeSchema);
