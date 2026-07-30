const mongoose = require("mongoose");

const progressoMissaoClubeSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente", required: true, index: true },
  missao: { type: mongoose.Schema.Types.ObjectId, ref: "MissaoClube", required: true, index: true },
  progresso: { type: Number, default: 0, min: 0 },
  concluida: { type: Boolean, default: false, index: true },
  concluidaEm: { type: Date, default: null },
  recompensaEntregue: { type: Boolean, default: false },
  recompensaEntregueEm: { type: Date, default: null },
  ciclo: { type: String, default: "unico", index: true },
}, { timestamps: true });
progressoMissaoClubeSchema.index({ cliente: 1, missao: 1, ciclo: 1 }, { unique: true });
module.exports = mongoose.models.ProgressoMissaoClube || mongoose.model("ProgressoMissaoClube", progressoMissaoClubeSchema);
