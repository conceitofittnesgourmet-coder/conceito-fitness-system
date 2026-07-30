const mongoose = require("mongoose");

const itemIngredienteSchema = new mongoose.Schema({
  materiaPrima: { type: mongoose.Schema.Types.ObjectId, ref: "MateriaPrima", required: true },
  quantidade: { type: Number, required: true, min: 0 },
  unidade: { type: String, default: "unidade" },
  custoUnitarioAplicado: { type: Number, default: 0, min: 0 },
  quantidadeConvertida: { type: Number, default: 0, min: 0 },
  custo: { type: Number, default: 0, min: 0 },
}, { _id: true });

const variacaoFichaSchema = new mongoose.Schema({
  grupoComponente: { type: mongoose.Schema.Types.ObjectId, ref: "GrupoComponente", required: true },
  opcaoComponente: { type: mongoose.Schema.Types.ObjectId, ref: "OpcaoComponente", required: true },
  nomeGrupo: { type: String, default: "" },
  nomeOpcao: { type: String, default: "" },
  itens: { type: [itemIngredienteSchema], default: [] },
  custoTotal: { type: Number, default: 0, min: 0 },
  ativa: { type: Boolean, default: true },
}, { _id: true });

const historicoSchema = new mongoose.Schema({
  data: { type: Date, default: Date.now },
  usuario: { type: String, default: "Sistema" },
  acao: { type: String, default: "salvar" },
  custoBase: { type: Number, default: 0 },
  custoUnitario: { type: Number, default: 0 },
  rendimento: { type: Number, default: 1 },
}, { _id: true });

const fichaTecnicaSchema = new mongoose.Schema({
  produto: { type: mongoose.Schema.Types.ObjectId, ref: "Produto", required: true, index: true },
  itens: { type: [itemIngredienteSchema], default: [] },
  variacoes: { type: [variacaoFichaSchema], default: [] },
  rendimento: { type: Number, default: 1, min: 0.0001 },
  unidadeRendimento: { type: String, default: "UN", trim: true },
  perdaPercentual: { type: Number, default: 0, min: 0, max: 99.99 },
  custoBase: { type: Number, default: 0, min: 0 },
  custoComPerda: { type: Number, default: 0, min: 0 },
  custoVariacoes: { type: Number, default: 0, min: 0 },
  custoTotal: { type: Number, default: 0, min: 0 },
  custoUnitario: { type: Number, default: 0, min: 0 },
  precoVenda: { type: Number, default: 0, min: 0 },
  lucroUnitario: { type: Number, default: 0 },
  margemPercentual: { type: Number, default: 0 },
  markup: { type: Number, default: 0 },
  modoPreparo: { type: String, default: "" },
  observacao: { type: String, default: "" },
  historico: { type: [historicoSchema], default: [] },
  ativa: { type: Boolean, default: true },
}, { timestamps: true });

fichaTecnicaSchema.index({ produto: 1, ativa: 1 });

module.exports = mongoose.models.FichaTecnica || mongoose.model("FichaTecnica", fichaTecnicaSchema);
