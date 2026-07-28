const mongoose = require("mongoose");

const enderecoFiscalSchema = new mongoose.Schema(
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

const empresaSchema = new mongoose.Schema(
  {
    nomeFantasia: {
      type: String,
      required: true,
      default: "Conceito Fitness Gourmet",
      trim: true,
    },

    razaoSocial: {
      type: String,
      default: "",
      trim: true,
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

    cnae: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * Código de Regime Tributário:
     *
     * 1 = Simples Nacional
     * 2 = Simples Nacional com excesso de sublimite
     * 3 = Regime Normal
     * 4 = MEI
     */
    crt: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 1,
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

    whatsapp: {
      type: String,
      default: "",
      trim: true,
    },

    instagram: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * Campos legados mantidos para compatibilidade
     * com as telas e funções existentes.
     */
    endereco: {
      type: String,
      default: "",
    },

    cidade: {
      type: String,
      default: "",
    },

    estado: {
      type: String,
      default: "",
    },

    cep: {
      type: String,
      default: "",
    },

    /*
     * Endereço estruturado usado na emissão fiscal.
     */
    enderecoFiscal: {
      type: enderecoFiscalSchema,
      default: () => ({}),
    },

    logo: {
      type: String,
      default: "",
    },

    mensagemCupom: {
      type: String,
      default:
        "Obrigado pela preferência! Alimentação saudável com sabor premium.",
    },

    taxaEntregaPadrao: {
      type: Number,
      default: 0,
    },

    plano: {
      type: String,
      default: "basic",
    },

    ativa: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Empresa ||
  mongoose.model("Empresa", empresaSchema);