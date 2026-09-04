const mongoose = require("mongoose");

const nfeRecebidaSchema = new mongoose.Schema(
  {
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: true,
      index: true,
    },

    nsu: {
      type: String,
      required: true,
      trim: true,
    },

    nsus: {
  type: [String],
},

    chaveAcesso: {
      type: String,
      default: "",
      trim: true,
    },

    schema: {
      type: String,
      default: "",
      trim: true,
    },

    tipoDocumento: {
      type: String,
      enum: [
        "resumo_nfe",
        "nfe_completa",
        "evento",
        "desconhecido",
      ],
      default: "desconhecido",
    },

    emitenteNome: {
      type: String,
      default: "",
      trim: true,
    },

    emitenteDocumento: {
      type: String,
      default: "",
      trim: true,
    },

    dataEmissao: {
      type: Date,
      default: null,
    },

    valorNfe: {
      type: Number,
      default: 0,
    },

    situacaoNfe: {
      type: String,
      default: "",
      trim: true,
    },

    resumoXml: {
      type: String,
      default: "",
    },

    xmlCompleto: {
      type: String,
      default: "",
    },

    statusDistribuicao: {
      type: String,
      enum: [
        "resumo_recebido",
        "xml_recebido",
        "evento_recebido",
        "aguardando_xml",
        "erro",
      ],
      default: "resumo_recebido",
    },

    statusManifestacao: {
      type: String,
      enum: [
        "nao_manifestada",
        "ciencia_operacao",
        "confirmacao_operacao",
        "desconhecimento_operacao",
        "operacao_nao_realizada",
      ],
      default: "nao_manifestada",
    },

    protocoloManifestacao: {
      type: String,
      default: "",
      trim: true,
    },

    dataManifestacao: {
      type: Date,
      default: null,
    },

    importada: {
      type: Boolean,
      default: false,
    },

    notaEntrada: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NotaFiscalEntrada",
      default: null,
    },

    primeiraSincronizacao: {
      type: Date,
      default: Date.now,
    },

    ultimaSincronizacao: {
      type: Date,
      default: Date.now,
    },

    observacao: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

/*
 * Um mesmo NSU não pode ser gravado duas vezes
 * para a mesma empresa.
 */
nfeRecebidaSchema.index(
  {
    empresa: 1,
    nsu: 1,
  },
  {
    unique: true,
  }
);

/*
 * Impede duplicidade da mesma chave de NF-e
 * dentro da mesma empresa.
 *
 * O índice só é aplicado quando existe
 * uma chave de 44 dígitos.
 */
nfeRecebidaSchema.index(
  {
    empresa: 1,
    chaveAcesso: 1,
  },
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

module.exports =
  mongoose.models.NfeRecebida ||
  mongoose.model(
    "NfeRecebida",
    nfeRecebidaSchema
  );