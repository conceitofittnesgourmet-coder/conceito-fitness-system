const mongoose = require("mongoose");

const FoodCoreSchema = new mongoose.Schema({

    ultimaAtualizacao: {
        type: Date
    },

    custoProducao: {
        type: Number,
        default: 0
    },

    custoPorPorcao: {
        type: Number,
        default: 0
    },

    custoPorGrama: {
        type: Number,
        default: 0
    },

    quantidadeReceitas: {
        type: Number,
        default: 0
    }

}, {

    _id: false

});

module.exports = FoodCoreSchema;