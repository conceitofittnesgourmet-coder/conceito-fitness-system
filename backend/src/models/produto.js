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

dadosFiscais: {
  ncm: {
    type: String,
    default: "",
    trim: true,
  },

  cest: {
    type: String,
    default: "",
    trim: true,
  },

  origemMercadoria: {
    type: String,
    default: "0",
  },

  codigoBeneficioFiscal: {
    type: String,
    default: "",
    trim: true,
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

    // PUBLICAÇÃO DIGITAL
    // Mantém os campos legados e adiciona a estrutura avançada.
    publicacao: {
      publicado: {
        type: Boolean,
        default: true,
      },

      // Campos legados — preservados para compatibilidade.
      pdv: {
        type: Boolean,
        default: true,
      },
      cardapioOnline: {
        type: Boolean,
        default: true,
      },
      whatsapp: {
        type: Boolean,
        default: true,
      },
      ifood: {
        type: Boolean,
        default: false,
      },
      aiqfome: {
        type: Boolean,
        default: false,
      },
      destaque: {
        type: Boolean,
        default: false,
      },
      novidade: {
        type: Boolean,
        default: false,
      },
      maisVendido: {
        type: Boolean,
        default: false,
      },
      promocao: {
        type: Boolean,
        default: false,
      },
      exclusivoClube: {
        type: Boolean,
        default: false,
      },
      ordem: {
        type: Number,
        default: 0,
      },

      // Estrutura nova.
      canais: {
        pdv: { type: Boolean, default: true },
        cardapio: { type: Boolean, default: true },
        site: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: true },
        ifood: { type: Boolean, default: false },
        aiqfome: { type: Boolean, default: false },
      },

      destaques: {
        destaque: { type: Boolean, default: false },
        novidade: { type: Boolean, default: false },
        maisVendido: { type: Boolean, default: false },
        exclusivoClube: { type: Boolean, default: false },
        ultimasUnidades: { type: Boolean, default: false },
        lancamento: { type: Boolean, default: false },
      },

      prioridadeExibicao: {
        type: Number,
        default: 0,
      },

      promocaoDetalhada: {
        ativa: { type: Boolean, default: false },
        tipo: {
          type: String,
          enum: ["preco_fixo", "percentual", "valor_fixo"],
          default: "preco_fixo",
        },
        precoOriginal: { type: Number, default: 0 },
        precoPromocional: { type: Number, default: 0 },
        desconto: { type: Number, default: 0 },
        inicio: { type: Date, default: null },
        fim: { type: Date, default: null },
        cupom: { type: String, default: "", trim: true },
        exclusivaClube: { type: Boolean, default: false },
        prioridade: { type: Number, default: 0 },
      },

      cicloVida: {
        dataLancamento: { type: Date, default: null },
        dataExpiracao: { type: Date, default: null },
        ocultarAntesLancamento: { type: Boolean, default: true },
        ocultarAposExpiracao: { type: Boolean, default: true },
      },
    },

    disponibilidade: {
      disponivel: { type: Boolean, default: true },
      ocultarQuandoIndisponivel: { type: Boolean, default: false },
      motivoIndisponibilidade: { type: String, default: "", trim: true },
      pausadoAte: { type: Date, default: null },
      diasSemana: { type: [Number], default: [] },
      horarioInicio: { type: String, default: "" },
      horarioFim: { type: String, default: "" },
      limiteDiario: { type: Number, default: 0 },
      quantidadeVendidaHoje: { type: Number, default: 0 },
      dataControleDiario: { type: Date, default: null },

      controlarPorHorario: { type: Boolean, default: false },
      controlarPorEstoque: { type: Boolean, default: true },
      estoqueMinimoDisponivel: { type: Number, default: 1 },

      lojas: [
        {
          lojaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Empresa",
            default: null,
          },
          nome: { type: String, default: "" },
          disponivel: { type: Boolean, default: true },
          precoExclusivo: { type: Number, default: null },
          estoqueExclusivo: { type: Number, default: null },
        },
      ],
    },

    // Campos promocionais legados — mantidos durante a migração.
    precoPromocional: { type: Number, default: 0 },
    promocaoInicio: { type: Date, default: null },
    promocaoFim: { type: Date, default: null },

    marketing: {
      campanhasSazonais: [
        {
          campanhaId: { type: mongoose.Schema.Types.ObjectId, default: null },
          nome: { type: String, default: "", trim: true },
          ativa: { type: Boolean, default: true },
          inicio: { type: Date, default: null },
          fim: { type: Date, default: null },
          precoPromocional: { type: Number, default: 0 },
          descontoTipo: {
            type: String,
            enum: ["nenhum", "percentual", "valor_fixo", "preco_fixo"],
            default: "nenhum",
          },
          descontoValor: { type: Number, default: 0 },
          prioridade: { type: Number, default: 0 },
          canais: { type: [String], default: [] },
          etiquetas: { type: [String], default: [] },
        },
      ],

      etiquetasAutomaticas: {
        novo: {
          habilitado: { type: Boolean, default: true },
          dias: { type: Number, default: 30 },
        },
        maisVendido: {
          habilitado: { type: Boolean, default: true },
          quantidadeMinima: { type: Number, default: 20 },
          periodoDias: { type: Number, default: 30 },
        },
        ultimasUnidades: {
          habilitado: { type: Boolean, default: true },
          estoqueMaximo: { type: Number, default: 5 },
        },
      },

      seo: {
        titulo: { type: String, default: "", trim: true },
        descricao: { type: String, default: "", trim: true },
        palavrasChave: { type: [String], default: [] },
        slug: { type: String, default: "", trim: true },
        canonical: { type: String, default: "", trim: true },
        indexar: { type: Boolean, default: true },
        imagemOG: { type: String, default: "", trim: true },
      },
    },

    recomendacoes: {
      produtosRelacionados: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Produto" },
      ],
      vendaCruzada: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Produto" },
      ],
      combinaCom: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Produto" },
      ],
      upsell: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Produto" },
      ],
    },

    combosAutomaticos: {
      habilitado: { type: Boolean, default: false },
      grupos: [
        {
          nome: { type: String, default: "", trim: true },
          quantidadeMinima: { type: Number, default: 1 },
          quantidadeMaxima: { type: Number, default: 1 },
          produtos: [
            { type: mongoose.Schema.Types.ObjectId, ref: "Produto" },
          ],
          descontoTipo: {
            type: String,
            enum: ["nenhum", "percentual", "valor_fixo"],
            default: "nenhum",
          },
          descontoValor: { type: Number, default: 0 },
          ativo: { type: Boolean, default: true },
        },
      ],
    },

    analytics: {
      visualizacoes: { type: Number, default: 0 },
      favoritos: { type: Number, default: 0 },
      adicionadosCarrinho: { type: Number, default: 0 },
      vendas: { type: Number, default: 0 },
      faturamento: { type: Number, default: 0 },
      ticketMedio: { type: Number, default: 0 },
      conversao: { type: Number, default: 0 },
      ultimaVenda: { type: Date, default: null },
      ultimaVisualizacao: { type: Date, default: null },
      ranking: { type: Number, default: 0 },
    },

    integracoes: {
      ifood: {
        habilitado: { type: Boolean, default: false },
        produtoExternoId: { type: String, default: "" },
        categoriaExterna: { type: String, default: "" },
        sincronizarPreco: { type: Boolean, default: true },
        sincronizarEstoque: { type: Boolean, default: true },
        sincronizarDisponibilidade: { type: Boolean, default: true },
        statusSincronizacao: {
          type: String,
          enum: ["nao_configurado", "pendente", "sincronizado", "erro"],
          default: "nao_configurado",
        },
        ultimaSincronizacao: { type: Date, default: null },
        mensagemErro: { type: String, default: "" },
      },

      aiqfome: {
        habilitado: { type: Boolean, default: false },
        produtoExternoId: { type: String, default: "" },
        categoriaExterna: { type: String, default: "" },
        sincronizarPreco: { type: Boolean, default: true },
        sincronizarEstoque: { type: Boolean, default: true },
        sincronizarDisponibilidade: { type: Boolean, default: true },
        statusSincronizacao: {
          type: String,
          enum: ["nao_configurado", "pendente", "sincronizado", "erro"],
          default: "nao_configurado",
        },
        ultimaSincronizacao: { type: Date, default: null },
        mensagemErro: { type: String, default: "" },
      },
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