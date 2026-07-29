const mongoose = require("mongoose");

const nfceSchema = new mongoose.Schema(
  {
    pedido: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Pedido",
},

    numero: {
      type: Number,
      required: true,
    },

    serie: {
      type: Number,
      default: 1,
    },

    modelo: {
      type: String,
      default: "65",
    },

    ambiente: {
      type: String,
      enum: ["homologacao", "producao"],
      default: "homologacao",
    },

    chaveAcesso: {
      type: String,
      default: "",
      index: true,
    },

    cpfNota: {
      type: String,
      default: "",
    },

    valorTotal: {
      type: Number,
      default: 0,
    },

    /*
     * XML original da NFC-e antes da assinatura.
     */
    xml: {
      type: String,
      default: "",
    },

    /*
     * XML da NFC-e assinado com o certificado A1.
     */
    xmlAssinado: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "gerada",
        "assinada",
        "autorizada",
        "rejeitada",
        "cancelada",
        "erro",
      ],
      default: "gerada",
      index: true,
    },

    /*
     * Dados da autorização da NFC-e.
     */
    protocolo: {
      type: String,
      default: "",
    },

    recibo: {
      type: String,
      default: "",
    },

    cStat: {
      type: String,
      default: "",
    },

    dataAutorizacao: {
      type: Date,
    },

    mensagemSefaz: {
      type: String,
      default: "",
    },

    qrCodeUrl: {
      type: String,
      default: "",
    },

    /*
     * Dados do cancelamento da NFC-e.
     */
    cancelamento: {
      justificativa: {
        type: String,
        default: "",
      },

      protocolo: {
        type: String,
        default: "",
      },

      cStat: {
        type: String,
        default: "",
      },

      xMotivo: {
        type: String,
        default: "",
      },

      dataEvento: {
        type: Date,
      },

      dataRegistro: {
        type: Date,
      },

      sequenciaEvento: {
        type: Number,
        default: 1,
      },

      tipoEvento: {
        type: String,
        default: "",
      },

      eventoDuplicado: {
        type: Boolean,
        default: false,
      },

      xmlEvento: {
        type: String,
        default: "",
      },

      xmlEventoAssinado: {
        type: String,
        default: "",
      },

      xmlLote: {
        type: String,
        default: "",
      },

      xmlRetorno: {
        type: String,
        default: "",
      },

      xmlSoap: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Impede a criação acidental de duas NFC-e
 * para o mesmo pedido.
 */
nfceSchema.index(
  {
    pedido: 1,
  },
  {
    unique: true,
  }
);

/*
 * Evita duplicidade de número e série
 * dentro do mesmo ambiente fiscal.
 */
nfceSchema.index(
  {
    ambiente: 1,
    modelo: 1,
    serie: 1,
    numero: 1,
  },
  {
    unique: true,
  }
);

module.exports =
  mongoose.models.Nfce ||
  mongoose.model("Nfce", nfceSchema);