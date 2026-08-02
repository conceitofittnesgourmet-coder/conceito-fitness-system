const mongoose =
  require("mongoose");

const pedidoSchema =
  new mongoose.Schema(

    {

      empresa: {

  type:
    mongoose.Schema.Types.ObjectId,

  ref:"Empresa"

},

      caixa: { type: mongoose.Schema.Types.ObjectId, ref: "Caixa", default: null, index: true },




      cliente: {

        type: String,

        required: true

      },





      telefone: {

        type: String

      },

      cpfNota: {
  type: String,
  default: "",
},





 produtos: [
  {
    produtoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produto",
    },

    senha: Number,
    nome: String,
    quantidade: Number,
    preco: Number,
    precoUnitario: Number,
    unidadeMedida: String,
    vendaPorPeso: Boolean,
    permiteFracionado: Boolean,
    subtotal: Number,
    imagem: String,

    categoria: {
  type: String,
  default: "",
},

sku: {
  type: String,
  default: "",
},

codigoBarras: {
  type: String,
  default: "",
},

custoNaVenda: {
  type: Number,
  default: 0,
},

precoOriginal: {
  type: Number,
  default: 0,
},

dadosFiscais: {
  ncm: {
    type: String,
    default: "",
  },

  cest: {
    type: String,
    default: "",
  },

  origemMercadoria: {
    type: String,
    default: "0",
  },

  codigoBeneficioFiscal: {
    type: String,
    default: "",
  },

  cfopInterno: {
    type: String,
    default: "5102",
  },

  cfopInterestadual: {
    type: String,
    default: "6102",
  },

  csosn: {
    type: String,
    default: "102",
  },

  cstIcms: {
    type: String,
    default: "",
  },

  aliquotaIcms: {
    type: Number,
    default: 0,
  },

  aliquotaFcp: {
    type: Number,
    default: 0,
  },

  cstPis: {
    type: String,
    default: "99",
  },

  aliquotaPis: {
    type: Number,
    default: 0,
  },

  cstCofins: {
    type: String,
    default: "99",
  },

  aliquotaCofins: {
    type: Number,
    default: 0,
  },

  cstIpi: {
    type: String,
    default: "",
  },

  aliquotaIpi: {
    type: Number,
    default: 0,
  },

  gtin: {
    type: String,
    default: "",
  },

  gtinTributavel: {
    type: String,
    default: "",
  },

  unidadeComercial: {
    type: String,
    default: "UN",
  },

  unidadeTributavel: {
    type: String,
    default: "UN",
  },

  cstIbsCbs: {
    type: String,
    default: "",
  },

  cClassTrib: {
    type: String,
    default: "",
  },

  aliquotaIbs: {
    type: Number,
    default: 0,
  },

  aliquotaCbs: {
    type: Number,
    default: 0,
  },

  produtoTributavel: {
    type: Boolean,
    default: true,
  },

  emitirNfce: {
    type: Boolean,
    default: true,
  },
},


    configuracoes: [
      {
        grupoId: String,
        grupo: String,
        grupoTipo: { type: String, default: "personalizado" },
        opcaoId: String,
        opcao: String,
        quantidade: { type: Number, default: 1, min: 1 },
        valorUnitario: { type: Number, default: 0 },
        valor: { type: Number, default: 0 },
      },
    ],

    observacaoItem: {
      type: String,
      default: "",
      maxlength: 300,
    },

    adicionais: {
      type: Number,
      default: 0,
    },
  },
],

      total: {

        type: Number,

        required: true

      },

      subtotal: {
  type: Number,
  default: 0,
},

taxaEntrega: {
  type: Number,
  default: 0,
},


pagamento: {
  type: String,
  default: "PIX",
},

tipo: {
  type: String,
  default: "balcao",
},

mesa: {
  type: String,
  default: "",
},

enderecoEntrega: {
  type: String,
  default: "",
},

cep: {
  type: String,
  default: "",
},

numeroEntrega: {
  type: String,
  default: "",
},

bairroEntrega: {
  type: String,
  default: "",
},

complementoEntrega: {
  type: String,
  default: "",
},

referenciaEntrega: {
  type: String,
  default: "",
},

desconto: {
  type: Number,
  default: 0,
},

motivoDesconto: {
  type: String,
  default: "",
},

observacao: {
  type: String,
  default: "",
},

numeroPedido: {
  type: Number,
  unique: true,
  sparse: true,
},




canalVenda: {
  type: String,
  enum: ["erp", "cardapio", "pdv", "ifood", "orcamento"],
  default: "erp",
  index: true,
},

ifoodOrderId: {
  type: String,
  default: undefined,
  unique: true,
  sparse: true,
  index: true,
},

ifoodDisplayId: {
  type: String,
  default: "",
},

ifoodMerchantId: {
  type: String,
  default: "",
},

ifoodStatus: {
  type: String,
  default: "",
},

ifoodOrderType: {
  type: String,
  default: "",
},

ifoodOrderTiming: {
  type: String,
  default: "",
},

ifoodCriadoEm: {
  type: Date,
  default: null,
},

ifoodAgendadoPara: {
  type: Date,
  default: null,
},

ifoodPayload: {
  type: mongoose.Schema.Types.Mixed,
  default: null,
},

ifoodPayloadUltimoEvento: {
  type: mongoose.Schema.Types.Mixed,
  default: null,
},

ifoodUltimaAcao: { type: String, default: "" },
ifoodUltimaAcaoEm: { type: Date, default: null },
ifoodUltimaAcaoOk: { type: Boolean, default: null },
ifoodUltimaAcaoErro: { type: String, default: "" },

  status: {
  type: String,

  enum: [
    "pendente",
    "producao",
    "pronto",
    "entregue",
    "cancelado"
  ],

  default: "pendente"
},

statusProducao: {
  type: String,
  enum: [
    "aguardando",
    "producao",
    "pronto",
    "entregue",
  ],
  default: "aguardando",
},

tempoPrevisto: {
  type: Number,
  default: 18,
},

inicioProducao: {
  type: Date,
  default: null,
},

fimProducao: {
  type: Date,
  default: null,
},

tempoReal: {
  type: Number,
  default: 0,
  min: 0,
},

prioridadeProducao: {
  type: Number,
  default: 0,
  min: 0,
  max: 10,
},

checklist: {
  type: [
    {
      nome: String,
      concluido: {
        type: Boolean,
        default: false,
      },
    },
  ],
  default: [],
},

},

{

  timestamps: true

}

);



module.exports =
  mongoose.models.Pedido ||
  mongoose.model(
    "Pedido",
    pedidoSchema
  );