const mongoose = require("mongoose");

const cmvProducaoSchema = new mongoose.Schema({
  empresa: { type: mongoose.Schema.Types.ObjectId, ref: "Empresa", default: null, index: true },
  ordem: { type: mongoose.Schema.Types.ObjectId, ref: "OrdemProducao", required: true, unique: true, index: true },
  produto: { type: mongoose.Schema.Types.ObjectId, ref: "Produto", required: true, index: true },
  codigoOrdem: { type: String, required: true, trim: true, index: true },
  loteProducao: { type: String, default: "", trim: true, index: true },
  quantidadeProduzida: { type: Number, required: true, min: 0 },
  custoTotal: { type: Number, required: true, min: 0 },
  custoUnitario: { type: Number, required: true, min: 0 },
  precoVendaUnitario: { type: Number, default: 0, min: 0 },
  valorVendaPotencial: { type: Number, default: 0, min: 0 },
  lucroBrutoPotencial: { type: Number, default: 0 },
  margemBrutaPotencial: { type: Number, default: 0 },
  responsavel: { type: String, default: "Sistema", trim: true },
  dataProducao: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

cmvProducaoSchema.index({ empresa: 1, dataProducao: -1 });
cmvProducaoSchema.index({ empresa: 1, produto: 1, dataProducao: -1 });

module.exports = mongoose.models.CmvProducao || mongoose.model("CmvProducao", cmvProducaoSchema);
