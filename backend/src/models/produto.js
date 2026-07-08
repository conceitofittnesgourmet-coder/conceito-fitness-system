const mongoose = require("mongoose");

const produtoSchema = new mongoose.Schema(
  {
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
    },

    nome: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      unique: true,
    },

    codigoBarras: {
  type: String,
  default: "",
  trim: true,
  index: true,
},

sku: {
  type: String,
  default: "",
  trim: true,
},

    descricao: {
      type: String,
      default: "",
    },

    categoria: {
     type: String,
     default: "Gourmet"
    },

    unidadeMedida: {
  type: String,
  enum: ["UN", "KG", "G", "L", "ML", "PACOTE", "FARDO", "CAIXA"],
  default: "UN",
},

vendaPorPeso: {
  type: Boolean,
  default: false,
},

permiteFracionado: {
  type: Boolean,
  default: false,
},

    categorias: {
     type: [String],
     default: [],
   },

   produtoComposto: {
  type: Boolean,
  default: false,
},

tipoComposicao: {
  type: String,
  enum: ["simples", "combo", "kit", "cesta", "bolo_personalizado"],
  default: "simples",
},

itensComposicao: [
  {
    produto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produto",
    },
    nome: String,
    quantidade: {
      type: Number,
      default: 1,
    },
    obrigatorio: {
      type: Boolean,
      default: true,
    },
  },
],

informacoesNutricionais: {
  calorias: { type: Number, default: 0 },
  proteinas: { type: Number, default: 0 },
  carboidratos: { type: Number, default: 0 },
  gorduras: { type: Number, default: 0 },
  fibras: { type: Number, default: 0 },
  sodio: { type: Number, default: 0 },
},

alergenos: {
  contemLeite: { type: Boolean, default: false },
  contemOvos: { type: Boolean, default: false },
  contemSoja: { type: Boolean, default: false },
  contemCastanhas: { type: Boolean, default: false },
  contemAmendoim: { type: Boolean, default: false },
  contemGluten: { type: Boolean, default: false },
},

selos: {
  semGluten: { type: Boolean, default: false },
  zeroLactose: { type: Boolean, default: false },
  zeroAcucar: { type: Boolean, default: false },
  lowCarb: { type: Boolean, default: false },
  vegano: { type: Boolean, default: false },
  fit: { type: Boolean, default: false },
},

gruposComponentes: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GrupoComponente",
  },
],

configuracaoGrupos: [
  {
    grupoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GrupoComponente",
    },

    nome: { type: String, default: "" },
    tipo: { type: String, default: "personalizado" },

    obrigatorio: { type: Boolean, default: false },
    minimoEscolhas: { type: Number, default: 0 },
    maximoEscolhas: { type: Number, default: 1 },
    ordem: { type: Number, default: 0 },

    mostrarPDV: { type: Boolean, default: true },
    mostrarCardapio: { type: Boolean, default: true },
    mostrarPWA: { type: Boolean, default: true },

    regraPreco: {
      type: String,
      enum: ["sem_alteracao", "somar", "substituir", "percentual"],
      default: "sem_alteracao",
    },

    valorPreco: { type: Number, default: 0 },
  },
],

configuravel: {
  type: Boolean,
  default: false,
},

permiteObservacao: {
  type: Boolean,
  default: true,
},

quantidadeMinima: {
  type: Number,
  default: 1,
},

quantidadeMaxima: {
  type: Number,
  default: 1,
},

permiteMontagemCliente: {
  type: Boolean,
  default: false,
},

    preco: {
      type: Number,
      required: true,
    },

    custo: {
  type: Number,
  default: 0,
},

lucro: {
  type: Number,
  default: 0,
},

margem: {
  type: Number,
  default: 0,
},

tipoProduto: {
  type: String,
  default: "producao",
},

    estoque: {
      type: Number,
      default: 0,
    },

    estoqueMinimo: {
      type: Number,
      default: 5,
    },

    movimentacoes: [
  {
    tipo: {
      type: String,
      enum: [
  "entrada",
  "saida",
  "ajuste",
  "venda",
  "producao",
],
    },

    quantidade: Number,

    motivo: String,

    data: {
      type: Date,
      default: Date.now,
    },
  },
],

    tempoPreparo: {
      type: Number,
      default: 0
    },

    restricoes: {
      type: String,
      default: ""
    },

    peso: {
      type: String,
      default: ""
    },

    destaque: {
      type: Boolean,
      default: false,
    },

    ativo: {
      type: Boolean,
      default: true,
    },

    imagens: [
      {
        url: String,
        public_id: String,
        filename: String,
        path: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Produto",
  produtoSchema
);