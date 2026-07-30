const mongoose = require("mongoose");

const recompensaSchema = new mongoose.Schema({
  tipo: { type: String, enum: ["pontos", "cashback", "cupom", "produto", "frete_gratis"], default: "pontos" },
  valor: { type: Number, default: 0, min: 0 },
  descricao: { type: String, default: "", trim: true },
  cupomCodigo: { type: String, default: "", trim: true, uppercase: true },
}, { _id: false });

const missaoClubeSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  descricao: { type: String, default: "", trim: true },
  icone: { type: String, default: "⭐", trim: true },
  categoria: { type: String, enum: ["compras", "valor", "produtos", "categoria", "frequencia", "indicacao", "especial"], default: "compras" },
  criterio: { type: String, enum: ["quantidade_compras", "valor_acumulado", "quantidade_itens", "produto_especifico", "categoria_especifica", "dias_com_compra"], default: "quantidade_compras" },
  meta: { type: Number, required: true, min: 1, default: 1 },
  produtoId: { type: mongoose.Schema.Types.ObjectId, ref: "Produto", default: null },
  categoriaProduto: { type: String, default: "", trim: true },
  inicio: { type: Date, default: null },
  fim: { type: Date, default: null },
  recompensa: { type: recompensaSchema, default: () => ({}) },
  medalha: { type: String, default: "", trim: true },
  recorrente: { type: Boolean, default: false },
  ativo: { type: Boolean, default: true, index: true },
}, { timestamps: true });

module.exports = mongoose.models.MissaoClube || mongoose.model("MissaoClube", missaoClubeSchema);
