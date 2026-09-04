const mongoose = require("mongoose");

const itemNotaSchema = new mongoose.Schema(
  {
    materiaPrima: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "MateriaPrima",
  required: false,
},

    nome: {
      type: String,
      required: true,
      trim: true,
    },

    codigo: {
      type: String,
      default: "",
    },

    ncmOrigem: {
  type: String,
  default: "",
  trim: true,
},

cestOrigem: {
  type: String,
  default: "",
  trim: true,
},

cfopOrigem: {
  type: String,
  default: "",
  trim: true,
},

    unidade: {
      type: String,
      default: "unidade",
    },

    quantidade: {
      type: Number,
      default: 0,
    },

    fatorConversao: {
  type: Number,
  default: null,
  min: 0,
},

quantidadeEstoque: {
  type: Number,
  default: null,
  min: 0,
},

unidadeEstoque: {
  type: String,
  default: "",
  trim: true,
},

    valorUnitario: {
      type: Number,
      default: 0,
    },

    valorTotal: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const notaFiscalEntradaSchema = new mongoose.Schema(
  {
    numero: {
      type: String,
      required: true,
      trim: true,
    },

    serie: {
      type: String,
      default: "",
    },

    chaveAcesso: {
      type: String,
      default: "",
      trim: true,
    },

    fornecedor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fornecedor",
      default: null,
    },

    fornecedorNome: {
      type: String,
      default: "",
    },

    fornecedorDocumento: {
      type: String,
      default: "",
    },

    dataEmissao: {
      type: Date,
      default: Date.now,
    },

    dataEntrada: {
      type: Date,
      default: Date.now,
    },

    valorProdutos: {
      type: Number,
      default: 0,
    },

    valorFrete: {
      type: Number,
      default: 0,
    },

    valorDesconto: {
      type: Number,
      default: 0,
    },

    valorSeguro: {
  type: Number,
  default: 0,
},

valorOutrasDespesas: {
  type: Number,
  default: 0,
},

valorICMS: {
  type: Number,
  default: 0,
},

valorICMSST: {
  type: Number,
  default: 0,
},

valorFCP: {
  type: Number,
  default: 0,
},

valorFCPST: {
  type: Number,
  default: 0,
},

valorIPI: {
  type: Number,
  default: 0,
},

    valorTotal: {
      type: Number,
      default: 0,
    },

    formaPagamento: {
      type: String,
      default: "PIX",
    },

    status: {
  type: String,
  enum: [
  "rascunho",
  "conferida",
  "processando",
  "entrada_realizada",
  "cancelada",
],
  default: "rascunho",
},

    itens: [itemNotaSchema],

    xmlImportado: {
      type: Boolean,
      default: false,
    },

    estoqueProcessado: {
  type: Boolean,
  default: false,
},

compraGerada: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Compra",
  default: null,
},

vencimentoPagamento: {
  type: Date,
  default: null,
},

parcelas: {
  type: [
    {
      numero: {
        type: String,
        default: "",
      },

      vencimento: {
        type: Date,
        default: null,
      },

      valor: {
        type: Number,
        default: 0,
      },
    },
  ],
  default: [],
},

    observacao: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

notaFiscalEntradaSchema.index(
  { chaveAcesso: 1 },
  {
    unique: true,
    partialFilterExpression: {
  chaveAcesso: {
    $type: "string",
    $gt: "",
  },
},
  }
);

module.exports = mongoose.model("NotaFiscalEntrada", notaFiscalEntradaSchema);