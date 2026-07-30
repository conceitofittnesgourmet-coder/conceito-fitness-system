const mongoose = require("mongoose");

const enderecoSchema = new mongoose.Schema(
  {
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
  {
    _id: false,
  }
);

const clienteSchema = new mongoose.Schema(
  {
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      default: null,
      index: true,
    },

    tipoPessoa: {
      type: String,
      enum: ["fisica", "juridica"],
      default: "fisica",
      index: true,
    },

    /*
     * Campo legado.
     * Mantido para não quebrar o cadastro, os pedidos,
     * o clube e as telas já existentes.
     */
    nome: {
      type: String,
      required: true,
      trim: true,
    },

    nomeFantasia: {
      type: String,
      default: "",
      trim: true,
    },

    razaoSocial: {
      type: String,
      default: "",
      trim: true,
    },

    cpf: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    cnpj: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    inscricaoEstadual: {
      type: String,
      default: "",
      trim: true,
    },

    inscricaoMunicipal: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * Indicador da inscrição estadual:
     *
     * 1 = contribuinte do ICMS;
     * 2 = contribuinte isento;
     * 9 = não contribuinte.
     */
    indicadorIe: {
      type: Number,
      enum: [1, 2, 9],
      default: 9,
    },

    contribuinteIcms: {
      type: Boolean,
      default: false,
    },

    isentoIe: {
      type: Boolean,
      default: false,
    },

    consumidorFinal: {
      type: Boolean,
      default: true,
    },

    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    telefone: {
      type: String,
      required: true,
      trim: true,
    },

    whatsapp: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * Campo legado.
     * Será mantido enquanto as telas antigas ainda utilizarem cidade.
     */
    cidade: {
      type: String,
      default: "",
      trim: true,
    },

    endereco: {
      type: enderecoSchema,
      default: () => ({}),
    },

    aniversario: {
      type: String,
      default: "",
    },

    pedidos: {
      type: Number,
      default: 0,
    },

    gasto: {
      type: Number,
      default: 0,
    },

    pontos: {
      type: Number,
      default: 0,
    },

    cashback: {
      type: Number,
      default: 0,
    },

    favoritosCardapio: {
      type: [String],
      default: [],
    },

    clube: {
      type: String,
      enum: ["Básico", "Prata", "Ouro", "Premium", "Black"],
      default: "Básico",
    },

    membroClube: { type: Boolean, default: true, index: true },
    numeroAssociado: { type: String, default: "", trim: true, index: true },
    dataAdesaoClube: { type: Date, default: null },

    observacaoFiscal: {
      type: String,
      default: "",
      trim: true,
    },

    ativo: {
      type: Boolean,
      default: true,
      index: true,
    },

    ultimoPedido: {
      type: Date,
      default: null,
    },

    origem: {
      type: String,
      default: "manual",
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Evita CPF duplicado dentro da mesma empresa.
 *
 * O índice somente será aplicado quando existir um CPF preenchido.
 * Assim os clientes antigos sem CPF continuam funcionando normalmente.
 */
clienteSchema.index(
  {
    empresa: 1,
    cpf: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      cpf: {
        $type: "string",
        $ne: "",
      },
    },
  }
);

/*
 * Evita CNPJ duplicado dentro da mesma empresa.
 *
 * O índice somente será aplicado quando existir um CNPJ preenchido.
 */
clienteSchema.index(
  {
    empresa: 1,
    cnpj: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      cnpj: {
        $type: "string",
        $ne: "",
      },
    },
  }
);

/*
 * Validação básica antes de salvar o cliente.
 */
clienteSchema.pre("validate", function validarCliente() {
  if (this.tipoPessoa === "juridica") {
    if (!String(this.cnpj || "").trim()) {
      throw new Error(
        "CNPJ é obrigatório para cliente pessoa jurídica."
      );
    }

    if (!String(this.razaoSocial || this.nome || "").trim()) {
      throw new Error(
        "Razão social é obrigatória para cliente pessoa jurídica."
      );
    }
  }

  if (
    this.tipoPessoa === "fisica" &&
    !String(this.nome || "").trim()
  ) {
    throw new Error(
      "Nome é obrigatório para cliente pessoa física."
    );
  }
});

module.exports =
  mongoose.models.Cliente ||
  mongoose.model("Cliente", clienteSchema);