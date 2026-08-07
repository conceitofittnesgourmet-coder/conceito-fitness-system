const mongoose = require("mongoose");

const ProducaoSchema = new mongoose.Schema({

    pesoBruto: {
        type: Number,
        default: 0
    },

    pesoLiquido: {
        type: Number,
        default: 0
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

    rendimento: {
        type: Number,
        default: 1
    }

}, {

    _id: false

});

module.exports = ProducaoSchema;