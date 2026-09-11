const mongoose = require("mongoose");

const fornecedorProdutoVinculoSchema = new mongoose.Schema(
  {
    fornecedor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fornecedor",
      default: null,
      index: true,
    },

    fornecedorDocumento: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    codigoFornecedor: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    codigoBarras: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    descricaoFornecedor: {
      type: String,
      default: "",
      trim: true,
    },

    materiaPrima: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MateriaPrima",
      required: true,
      index: true,
    },

    fatorConversao: {
      type: Number,
      required: true,
      min: 0.000001,
    },

    unidadeEstoque: {
      type: String,
      required: true,
      trim: true,
    },

    ativo: {
      type: Boolean,
      default: true,
      index: true,
    },

    origem: {
      type: String,
      enum: ["xml", "manual", "conferencia"],
      default: "conferencia",
    },
  },
  { timestamps: true }
);

fornecedorProdutoVinculoSchema.index(
  {
    fornecedorDocumento: 1,
    codigoFornecedor: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      fornecedorDocumento: { $type: "string", $gt: "" },
      codigoFornecedor: { $type: "string", $gt: "" },
    },
  }
);

fornecedorProdutoVinculoSchema.index(
  {
    fornecedorDocumento: 1,
    codigoBarras: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      fornecedorDocumento: { $type: "string", $gt: "" },
      codigoBarras: { $type: "string", $gt: "" },
    },
  }
);

module.exports = mongoose.model(
  "FornecedorProdutoVinculo",
  fornecedorProdutoVinculoSchema
);
