const mongoose = require("mongoose");

const itemIngredienteSchema = new mongoose.Schema(
  {
    materiaPrima: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MateriaPrima",
      required: true,
    },

    quantidade: {
      type: Number,
      required: true,
      min: 0,
    },

    unidade: {
      type: String,
      default: "unidade",
    },

    custo: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: true,
  }
);

const variacaoFichaSchema = new mongoose.Schema(
  {
    grupoComponente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GrupoComponente",
      required: true,
    },

    opcaoComponente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OpcaoComponente",
      required: true,
    },

    nomeGrupo: {
      type: String,
      default: "",
    },

    nomeOpcao: {
      type: String,
      default: "",
    },

    itens: {
      type: [itemIngredienteSchema],
      default: [],
    },

    custoTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    ativa: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
  }
);

const fichaTecnicaSchema = new mongoose.Schema(
  {
    produto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produto",
      required: true,
      index: true,
    },

    // Ingredientes usados sempre, independentemente das escolhas.
    itens: {
      type: [itemIngredienteSchema],
      default: [],
    },

    // Ingredientes usados somente quando determinada opção for escolhida.
    variacoes: {
      type: [variacaoFichaSchema],
      default: [],
    },

    custoBase: {
      type: Number,
      default: 0,
      min: 0,
    },

    custoVariacoes: {
      type: Number,
      default: 0,
      min: 0,
    },

    custoTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    observacao: {
      type: String,
      default: "",
    },

    ativa: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

fichaTecnicaSchema.index({
  produto: 1,
  ativa: 1,
});

module.exports =
  mongoose.models.FichaTecnica ||
  mongoose.model("FichaTecnica", fichaTecnicaSchema);