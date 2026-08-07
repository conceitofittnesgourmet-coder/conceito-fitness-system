const mongoose = require("mongoose");

const NutricaoSchema = new mongoose.Schema({

    energia: {
        type: Number,
        default: 0
    },

    carboidratos: {
        type: Number,
        default: 0
    },

    acucaresTotais: {
        type: Number,
        default: 0
    },

    acucaresAdicionados: {
        type: Number,
        default: 0
    },

    proteinas: {
        type: Number,
        default: 0
    },

    gordurasTotais: {
        type: Number,
        default: 0
    },

    gordurasSaturadas: {
        type: Number,
        default: 0
    },

    gordurasTrans: {
        type: Number,
        default: 0
    },

    fibras: {
        type: Number,
        default: 0
    },

    sodio: {
        type: Number,
        default: 0
    }

}, {

    _id: false

});

module.exports = NutricaoSchema;