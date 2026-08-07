const mongoose = require("mongoose");

const RecipeIngredientSchema = new mongoose.Schema(
{
    produto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Produto",
        required: true,
        index: true
    },

    quantidade: {
        type: Number,
        required: true,
        min: 0
    },

    unidade: {
        type: String,
        enum: [
            "g",
            "kg",
            "ml",
            "l",
            "un"
        ],
        default: "g"
    },

    fatorCorrecao: {
        type: Number,
        default: 1
    },

    fatorCoccao: {
        type: Number,
        default: 1
    },

    perda: {
        type: Number,
        default: 0
    },

    obrigatorio: {
        type: Boolean,
        default: true
    },

    observacao: {
        type: String,
        default: ""
    }

},
{
    _id: false
});

const RecipeSchema = new mongoose.Schema({

    empresa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Empresa",
        index: true
    },

    produto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Produto",
        required: true,
        index: true
    },

    nome: {
        type: String,
        required: true,
        trim: true
    },

    versao: {
        type: Number,
        default: 1
    },

    status: {
        type: String,
        enum: [
            "RASCUNHO",
            "ATIVA",
            "INATIVA"
        ],
        default: "ATIVA"
    },

    rendimento: {
        type: Number,
        default: 1
    },

    pesoFinal: {
        type: Number,
        default: 0
    },

    perdaTotal: {
        type: Number,
        default: 0
    },

    tempoPreparo: {
        type: Number,
        default: 0
    },

    modoPreparo: {
        type: String,
        default: ""
    },

    observacoes: {
        type: String,
        default: ""
    },

    ingredientes: [RecipeIngredientSchema]

},
{
    timestamps: true
});

RecipeSchema.index({
    empresa: 1,
    produto: 1,
    versao: 1
});

module.exports = mongoose.model("Recipe", RecipeSchema);