const mongoose = require("mongoose");

const historicoCustoSchema = new mongoose.Schema({
  custoAnterior: { type: Number, default: 0 },
  custoNovo: { type: Number, required: true },
  origem: { type: String, default: "ajuste_manual", trim: true },
  observacao: { type: String, default: "", trim: true },
  alteradoPor: { type: String, default: "Sistema", trim: true },
  data: { type: Date, default: Date.now },
}, { _id: true });

const loteSchema = new mongoose.Schema({
  codigo: { type: String, default: "", trim: true },
  validade: { type: Date, default: null },
  quantidade: { type: Number, default: 0, min: 0 },
  custoUnitario: { type: Number, default: 0, min: 0 },
  fornecedor: { type: String, default: "", trim: true },
  criadoEm: { type: Date, default: Date.now },
}, { _id: true });

const movimentacaoSchema = new mongoose.Schema({
  tipo: { type: String, enum: ["entrada", "saida", "ajuste"], required: true },
  quantidade: { type: Number, required: true },
  saldoAnterior: { type: Number, required: true },
  saldoPosterior: { type: Number, required: true },
  custoUnitario: { type: Number, default: 0, min: 0 },
  motivo: { type: String, default: "", trim: true },
  documento: { type: String, default: "", trim: true },
  lote: { type: String, default: "", trim: true },
  validade: { type: Date, default: null },
  fornecedor: { type: String, default: "", trim: true },
  realizadoPor: { type: String, default: "Sistema", trim: true },
  data: { type: Date, default: Date.now },
}, { _id: true });

const materiaPrimaSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  codigo: { type: String, default: "", trim: true, uppercase: true },
  codigoBarras: { type: String, default: "", trim: true },
  categoria: { type: String, default: "Insumos", trim: true },
  unidade: {
    type: String,
    enum: ["kg", "g", "litro", "ml", "unidade", "pacote", "caixa"],
    default: "unidade",
  },
  estoqueAtual: { type: Number, default: 0, min: 0 },
  estoqueMinimo: { type: Number, default: 0, min: 0 },
  estoqueMaximo: { type: Number, default: 0, min: 0 },
  custoUnitario: { type: Number, default: 0, min: 0 },
  ultimoCusto: { type: Number, default: 0, min: 0 },
  fornecedor: { type: String, default: "", trim: true },
  fornecedorPrincipal: { type: mongoose.Schema.Types.ObjectId, ref: "Fornecedor", default: null },
  localizacao: { type: String, default: "", trim: true },
  marca: { type: String, default: "", trim: true },
  observacoes: { type: String, default: "", trim: true },
  controlaLote: { type: Boolean, default: false },
  controlaValidade: { type: Boolean, default: false },
  diasAlertaValidade: { type: Number, default: 7, min: 0 },
  lotes: { type: [loteSchema], default: [] },
  historicoCustos: { type: [historicoCustoSchema], default: [] },
  movimentacoes: { type: [movimentacaoSchema], default: [] },
  ativo: { type: Boolean, default: true },
}, { timestamps: true });

materiaPrimaSchema.index({ nome: 1 });
materiaPrimaSchema.index({ codigo: 1 }, { sparse: true });
materiaPrimaSchema.index({ codigoBarras: 1 }, { sparse: true });
materiaPrimaSchema.index({ categoria: 1, ativo: 1 });

module.exports = mongoose.model("MateriaPrima", materiaPrimaSchema);
