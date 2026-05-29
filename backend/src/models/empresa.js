const mongoose = require("mongoose");

const empresaSchema = new mongoose.Schema(
  {
    nomeFantasia: {
      type: String,
      required: true,
      default: "Conceito Fitness Gourmet",
    },

    razaoSocial: {
      type: String,
      default: "",
    },

    cnpj: {
      type: String,
      default: "",
    },

    inscricaoEstadual: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
    },

    telefone: {
      type: String,
      default: "",
    },

    whatsapp: {
      type: String,
      default: "",
    },

    instagram: {
      type: String,
      default: "",
    },

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

    logo: {
      type: String,
      default: "",
    },

    mensagemCupom: {
      type: String,
      default: "Obrigado pela preferência! Alimentação saudável com sabor premium.",
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
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Empresa || mongoose.model("Empresa", empresaSchema);