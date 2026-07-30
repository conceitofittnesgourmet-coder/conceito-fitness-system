const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  produtoId: { type: mongoose.Schema.Types.ObjectId, ref: "Produto", default: null },
  nome: { type: String, required: true, trim: true },
  descricao: { type: String, default: "", trim: true },
  quantidade: { type: Number, required: true, min: 0.001 },
  valorUnitario: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, default: 0, min: 0 },
}, { _id: true });

const orcamentoSchema = new mongoose.Schema({
  numero: { type: String, unique: true, index: true },
  empresa: { type: mongoose.Schema.Types.ObjectId, ref: "Empresa", default: null, index: true },
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente", default: null },
  cliente: { type: String, required: true, trim: true },
  telefone: { type: String, default: "", trim: true },
  email: { type: String, default: "", trim: true, lowercase: true },
  tipoEvento: { type: String, default: "Encomenda", trim: true },
  dataEvento: { type: Date, default: null },
  dataValidade: { type: Date, default: null },
  itens: { type: [itemSchema], validate: [(v) => v.length > 0, "Inclua ao menos um item"] },
  subtotal: { type: Number, default: 0 },
  desconto: { type: Number, default: 0 },
  taxaEntrega: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  percentualSinal: { type: Number, default: 50, min: 0, max: 100 },
  valorSinal: { type: Number, default: 0 },
  valorPago: { type: Number, default: 0 },
  saldo: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["rascunho", "enviado", "aprovado", "recusado", "expirado", "convertido", "cancelado"],
    default: "rascunho",
    index: true,
  },
  observacoes: { type: String, default: "" },
  condicoes: { type: String, default: "" },
  pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: "Pedido", default: null },
  aprovadoEm: { type: Date, default: null },
  convertidoEm: { type: Date, default: null },
}, { timestamps: true });

orcamentoSchema.pre("validate", function calcular() {
  this.itens = (this.itens || []).map((item) => {
    item.subtotal = Number(item.quantidade || 0) * Number(item.valorUnitario || 0);
    return item;
  });
  this.subtotal = this.itens.reduce((soma, item) => soma + Number(item.subtotal || 0), 0);
  this.total = Math.max(0, this.subtotal - Number(this.desconto || 0) + Number(this.taxaEntrega || 0));
  this.valorSinal = this.total * (Number(this.percentualSinal || 0) / 100);
  this.saldo = Math.max(0, this.total - Number(this.valorPago || 0));
});

module.exports = mongoose.models.Orcamento || mongoose.model("Orcamento", orcamentoSchema);
