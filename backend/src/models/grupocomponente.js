const mongoose = require("mongoose");

const canaisSchema = new mongoose.Schema(
  {
    pdv: { type: Boolean, default: true },
    cardapio: { type: Boolean, default: true },
    pwa: { type: Boolean, default: true },
    ifood: { type: Boolean, default: false },
  },
  { _id: false }
);

const grupoComponenteSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    descricao: {
      type: String,
      default: "",
      trim: true,
    },

    textoAjuda: {
      type: String,
      default: "",
      trim: true,
    },

    tipo: {
      type: String,
      enum: [
        "massa",
        "recheio",
        "cobertura",
        "bebida",
        "doce",
        "salgado",
        "adicional",
        "tamanho",
        "decoracao",
        "fruta",
        "calda",
        "personalizado",
      ],
      default: "personalizado",
    },

    tipoSelecao: {
      type: String,
      enum: ["unica", "multipla"],
      default: "unica",
    },

    visualizacao: {
      type: String,
      enum: ["lista", "cards", "seletor"],
      default: "lista",
    },

    obrigatorio: {
      type: Boolean,
      default: false,
    },

    minimoEscolhas: {
      type: Number,
      default: 0,
      min: 0,
    },

    maximoEscolhas: {
      type: Number,
      default: 1,
      min: 1,
    },

    permiteQuantidadePorOpcao: {
      type: Boolean,
      default: false,
    },

    quantidadeMaximaPorOpcao: {
      type: Number,
      default: 1,
      min: 1,
    },

    ordem: {
      type: Number,
      default: 0,
    },

    canais: {
      type: canaisSchema,
      default: () => ({}),
    },

    ativo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

grupoComponenteSchema.pre("validate", function normalizarRegras() {

    this.minimoEscolhas = Math.max(0, Number(this.minimoEscolhas || 0));
    this.maximoEscolhas = Math.max(1, Number(this.maximoEscolhas || 1));

    this.quantidadeMaximaPorOpcao = Math.max(
        1,
        Number(this.quantidadeMaximaPorOpcao || 1)
    );

    if (this.tipoSelecao === "unica") {
        this.maximoEscolhas = 1;
        this.minimoEscolhas = this.obrigatorio
            ? 1
            : Math.min(this.minimoEscolhas, 1);
    }

    if (this.obrigatorio && this.minimoEscolhas < 1) {
        this.minimoEscolhas = 1;
    }

    if (this.minimoEscolhas > this.maximoEscolhas) {
        this.minimoEscolhas = this.maximoEscolhas;
    }

});

module.exports =
  mongoose.models.GrupoComponente ||
  mongoose.model("GrupoComponente", grupoComponenteSchema);
