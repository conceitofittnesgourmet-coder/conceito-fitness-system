const mongoose = require("mongoose");

const itemNfeSchema = new mongoose.Schema(
  {
    produto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produto",
      default: null,
    },

    codigo: {
      type: String,
      default: "",
      trim: true,
    },

    descricao: {
      type: String,
      required: true,
      trim: true,
    },

    ncm: {
      type: String,
      required: true,
      trim: true,
    },

    cest: {
      type: String,
      default: "",
      trim: true,
    },

    cfop: {
      type: String,
      required: true,
      trim: true,
    },

    unidadeComercial: {
      type: String,
      default: "UN",
      trim: true,
    },

    quantidadeComercial: {
      type: Number,
      required: true,
      min: 0,
    },

    valorUnitarioComercial: {
      type: Number,
      required: true,
      min: 0,
    },

    valorProduto: {
      type: Number,
      required: true,
      min: 0,
    },

    unidadeTributavel: {
      type: String,
      default: "UN",
      trim: true,
    },

    quantidadeTributavel: {
      type: Number,
      required: true,
      min: 0,
    },

    valorUnitarioTributavel: {
      type: Number,
      required: true,
      min: 0,
    },

    gtin: {
      type: String,
      default: "SEM GTIN",
      trim: true,
    },

    gtinTributavel: {
      type: String,
      default: "SEM GTIN",
      trim: true,
    },

    origem: {
      type: String,
      default: "0",
      trim: true,
    },

    csosn: {
      type: String,
      default: "102",
      trim: true,
    },

    cstIcms: {
      type: String,
      default: "",
      trim: true,
    },

    aliquotaIcms: {
      type: Number,
      default: 0,
    },

    valorIcms: {
      type: Number,
      default: 0,
    },

    cstPis: {
      type: String,
      default: "99",
      trim: true,
    },

    aliquotaPis: {
      type: Number,
      default: 0,
    },

    valorPis: {
      type: Number,
      default: 0,
    },

    cstCofins: {
      type: String,
      default: "99",
      trim: true,
    },

    aliquotaCofins: {
      type: Number,
      default: 0,
    },

    valorCofins: {
      type: Number,
      default: 0,
    },

    cstIpi: {
      type: String,
      default: "",
      trim: true,
    },

    aliquotaIpi: {
      type: Number,
      default: 0,
    },

    valorIpi: {
      type: Number,
      default: 0,
    },

    codigoBeneficioFiscal: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: true,
  }
);

const volumeSchema = new mongoose.Schema(
  {
    quantidade: {
      type: Number,
      default: 0,
    },

    especie: {
      type: String,
      default: "",
      trim: true,
    },

    marca: {
      type: String,
      default: "",
      trim: true,
    },

    numeracao: {
      type: String,
      default: "",
      trim: true,
    },

    pesoLiquido: {
      type: Number,
      default: 0,
    },

    pesoBruto: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const cartaCorrecaoSchema = new mongoose.Schema(
  {
    sequencia: {
      type: Number,
      default: 1,
    },

    correcao: {
      type: String,
      required: true,
      trim: true,
    },

    protocolo: {
      type: String,
      default: "",
      trim: true,
    },

    cStat: {
      type: String,
      default: "",
      trim: true,
    },

    xMotivo: {
      type: String,
      default: "",
      trim: true,
    },

    dataEvento: {
      type: Date,
      default: null,
    },

    xmlEvento: {
      type: String,
      default: "",
    },

    xmlEventoAssinado: {
      type: String,
      default: "",
    },

    xmlRetorno: {
      type: String,
      default: "",
    },
  },
  {
    _id: true,
  }
);


const processamentoNfeSchema = new mongoose.Schema(
  {
    etapa: { type: String, required: true, trim: true },
    status: { type: String, default: "", trim: true },
    cStat: { type: String, default: "", trim: true },
    mensagem: { type: String, default: "", trim: true },
    protocolo: { type: String, default: "", trim: true },
    recibo: { type: String, default: "", trim: true },
    data: { type: Date, default: Date.now },
  },
  { _id: true }
);

const nfeSchema = new mongoose.Schema(
  {
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: true,
      index: true,
    },

    pedido: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pedido",
      required: true,
      index: true,
    },

    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
      default: null,
      index: true,
    },

    numero: {
      type: Number,
      required: true,
      min: 1,
    },

    serie: {
      type: Number,
      default: 1,
      min: 1,
    },

    modelo: {
      type: String,
      default: "55",
      immutable: true,
    },

    ambiente: {
      type: String,
      enum: ["homologacao", "producao"],
      default: "homologacao",
      index: true,
    },

    naturezaOperacao: {
      type: String,
      default: "Venda de mercadoria",
      trim: true,
    },

    tipoOperacao: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },

    finalidade: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 1,
    },

    consumidorFinal: {
      type: Boolean,
      default: true,
    },

    indicadorPresenca: {
      type: Number,
      default: 1,
    },

    destinoOperacao: {
      type: Number,
      enum: [1, 2, 3],
      default: 1,
    },

    modalidadeFrete: {
      type: Number,
      enum: [0, 1, 2, 3, 4, 9],
      default: 9,
    },

    chaveAcesso: {
      type: String,
      default: "",
      trim: true,
    },

    protocolo: {
      type: String,
      default: "",
      trim: true,
    },

    recibo: {
      type: String,
      default: "",
      trim: true,
    },

    cStat: {
      type: String,
      default: "",
      trim: true,
    },

    mensagemSefaz: {
      type: String,
      default: "",
      trim: true,
    },

    dataEmissao: {
      type: Date,
      default: Date.now,
    },

    dataAutorizacao: {
      type: Date,
      default: null,
    },

    destinatario: {
      tipoPessoa: {
        type: String,
        enum: ["fisica", "juridica"],
        default: "juridica",
      },

      nomeRazaoSocial: {
        type: String,
        default: "",
        trim: true,
      },

      nomeFantasia: {
        type: String,
        default: "",
        trim: true,
      },

      cpf: {
        type: String,
        default: "",
        trim: true,
      },

      cnpj: {
        type: String,
        default: "",
        trim: true,
      },

      inscricaoEstadual: {
        type: String,
        default: "",
        trim: true,
      },

      indicadorIe: {
        type: Number,
        enum: [1, 2, 9],
        default: 9,
      },

      email: {
        type: String,
        default: "",
        lowercase: true,
        trim: true,
      },

      telefone: {
        type: String,
        default: "",
        trim: true,
      },

      endereco: {
        cep: {
          type: String,
          default: "",
          trim: true,
        },

        logradouro: {
          type: String,
          default: "",
          trim: true,
        },

        numero: {
          type: String,
          default: "",
          trim: true,
        },

        complemento: {
          type: String,
          default: "",
          trim: true,
        },

        bairro: {
          type: String,
          default: "",
          trim: true,
        },

        cidade: {
          type: String,
          default: "",
          trim: true,
        },

        codigoMunicipioIbge: {
          type: String,
          default: "",
          trim: true,
        },

        uf: {
          type: String,
          default: "",
          uppercase: true,
          trim: true,
          maxlength: 2,
        },

        codigoPais: {
          type: String,
          default: "1058",
          trim: true,
        },

        pais: {
          type: String,
          default: "Brasil",
          trim: true,
        },
      },
    },

    itens: {
      type: [itemNfeSchema],
      default: [],
    },

    totais: {
      valorProdutos: {
        type: Number,
        default: 0,
      },

      valorFrete: {
        type: Number,
        default: 0,
      },

      valorSeguro: {
        type: Number,
        default: 0,
      },

      valorDesconto: {
        type: Number,
        default: 0,
      },

      outrasDespesas: {
        type: Number,
        default: 0,
      },

      valorIcms: {
        type: Number,
        default: 0,
      },

      valorIpi: {
        type: Number,
        default: 0,
      },

      valorPis: {
        type: Number,
        default: 0,
      },

      valorCofins: {
        type: Number,
        default: 0,
      },

      valorTotal: {
        type: Number,
        default: 0,
      },
    },

    pagamento: {
      forma: {
        type: String,
        default: "17",
        trim: true,
      },

      descricao: {
        type: String,
        default: "PIX",
        trim: true,
      },

      valor: {
        type: Number,
        default: 0,
      },
    },

    transportadora: {
      nomeRazaoSocial: {
        type: String,
        default: "",
        trim: true,
      },

      cpfCnpj: {
        type: String,
        default: "",
        trim: true,
      },

      inscricaoEstadual: {
        type: String,
        default: "",
        trim: true,
      },

      endereco: {
        type: String,
        default: "",
        trim: true,
      },

      municipio: {
        type: String,
        default: "",
        trim: true,
      },

      uf: {
        type: String,
        default: "",
        uppercase: true,
        trim: true,
      },
    },

    volumes: {
      type: [volumeSchema],
      default: [],
    },

    informacoesComplementares: {
      type: String,
      default: "",
      trim: true,
    },

    xml: {
      type: String,
      default: "",
    },

    xmlAssinado: {
      type: String,
      default: "",
    },

    xmlAutorizado: {
      type: String,
      default: "",
    },

    xmlRetornoSefaz: {
      type: String,
      default: "",
    },

    ultimaTentativaSefaz: {
      type: Date,
      default: null,
    },

    quantidadeTentativasSefaz: {
      type: Number,
      default: 0,
      min: 0,
    },

    historicoProcessamento: {
      type: [processamentoNfeSchema],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "gerada",
        "assinada",
        "transmitida",
        "processando",
        "autorizada",
        "rejeitada",
        "cancelada",
        "denegada",
        "erro",
      ],
      default: "gerada",
      index: true,
    },

    cancelamento: {
      justificativa: {
        type: String,
        default: "",
        trim: true,
      },

      protocolo: {
        type: String,
        default: "",
        trim: true,
      },

      cStat: {
        type: String,
        default: "",
        trim: true,
      },

      xMotivo: {
        type: String,
        default: "",
        trim: true,
      },

      dataEvento: {
        type: Date,
        default: null,
      },

      xmlEvento: {
        type: String,
        default: "",
      },

      xmlEventoAssinado: {
        type: String,
        default: "",
      },

      xmlRetorno: {
        type: String,
        default: "",
      },
    },

    cartaCorrecao: {
      type: [cartaCorrecaoSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Impede a criação de duas NF-e para o mesmo pedido.
 */
nfeSchema.index(
  {
    empresa: 1,
    pedido: 1,
  },
  {
    unique: true,
  }
);

/*
 * Impede duplicidade de número e série dentro da mesma empresa,
 * modelo e ambiente fiscal.
 */
nfeSchema.index(
  {
    empresa: 1,
    ambiente: 1,
    modelo: 1,
    serie: 1,
    numero: 1,
  },
  {
    unique: true,
  }
);

/*
 * Impede duplicidade de chave de acesso quando ela já existir.
 */
nfeSchema.index(
  {
    chaveAcesso: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      chaveAcesso: {
        $type: "string",
        $ne: "",
      },
    },
  }
);

module.exports =
  mongoose.models.Nfe ||
  mongoose.model("Nfe", nfeSchema);
