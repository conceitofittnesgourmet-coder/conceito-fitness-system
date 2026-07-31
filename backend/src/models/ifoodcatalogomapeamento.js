const mongoose = require("mongoose");

const ifoodCatalogoMapeamentoSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: ["categoria", "produto"],
      required: true,
      index: true,
    },
    referenciaLocal: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    nomeLocal: { type: String, default: "", trim: true },
    merchantId: { type: String, required: true, trim: true, index: true },
    catalogId: { type: String, default: "", trim: true },
    ifoodId: { type: String, required: true, trim: true },
    externalCode: { type: String, default: "", trim: true },
    categoriaIfoodId: { type: String, default: "", trim: true },
    hashPayload: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pendente", "sincronizado", "erro", "ignorado"],
      default: "pendente",
      index: true,
    },
    ultimaSincronizacaoEm: { type: Date, default: null },
    ultimoErro: { type: String, default: "" },
    respostaIfood: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

ifoodCatalogoMapeamentoSchema.index(
  { tipo: 1, referenciaLocal: 1, merchantId: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.IfoodCatalogoMapeamento ||
  mongoose.model("IfoodCatalogoMapeamento", ifoodCatalogoMapeamentoSchema);
