const mongoose = require("mongoose");

const historicoOrdemSchema = new mongoose.Schema({
  data: { type: Date, default: Date.now },
  usuario: { type: String, default: "Sistema", trim: true },
  acao: { type: String, required: true, trim: true },
  statusAnterior: { type: String, default: "", trim: true },
  statusNovo: { type: String, default: "", trim: true },
  observacao: { type: String, default: "", trim: true },
}, { _id: true });

const ordemProducaoSchema = new mongoose.Schema({
  empresa: { type: mongoose.Schema.Types.ObjectId, ref: "Empresa", default: null, index: true },
  codigo: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  produto: { type: mongoose.Schema.Types.ObjectId, ref: "Produto", required: true, index: true },
  fichaTecnica: { type: mongoose.Schema.Types.ObjectId, ref: "FichaTecnica", default: null },
  quantidadePlanejada: { type: Number, required: true, min: 0.0001 },
  quantidadeProduzida: { type: Number, default: 0, min: 0 },
  unidade: { type: String, default: "UN", trim: true },
  responsavel: { type: String, default: "", trim: true },
  prioridade: { type: Number, default: 0, min: 0, max: 10 },
  status: {
    type: String,
    enum: ["aberta", "em_producao", "concluida", "cancelada"],
    default: "aberta",
    index: true,
  },
  dataPlanejada: { type: Date, default: null },
  iniciadaEm: { type: Date, default: null },
  concluidaEm: { type: Date, default: null },
  canceladaEm: { type: Date, default: null },
  motivoCancelamento: { type: String, default: "", trim: true },
  observacoes: { type: String, default: "", trim: true },
  analiseInsumos: {
    analisadaEm: { type: Date, default: null },
    podeProduzir: { type: Boolean, default: false },
    itens: { type: [new mongoose.Schema({
      materiaPrima: { type: mongoose.Schema.Types.ObjectId, ref: "MateriaPrima", required: true },
      nome: { type: String, default: "" },
      unidade: { type: String, default: "unidade" },
      necessario: { type: Number, default: 0 },
      estoqueAtual: { type: Number, default: 0 },
      reservadoOutrasOrdens: { type: Number, default: 0 },
      disponivel: { type: Number, default: 0 },
      falta: { type: Number, default: 0 },
      suficiente: { type: Boolean, default: false },
    }, { _id: false })], default: [] },
  },
  reservaAtiva: { type: Boolean, default: false, index: true },
  reservadoEm: { type: Date, default: null },
  historico: { type: [historicoOrdemSchema], default: [] },
}, { timestamps: true });

ordemProducaoSchema.index({ empresa: 1, status: 1, createdAt: -1 });
ordemProducaoSchema.index({ produto: 1, createdAt: -1 });

module.exports = mongoose.models.OrdemProducao || mongoose.model("OrdemProducao", ordemProducaoSchema);
