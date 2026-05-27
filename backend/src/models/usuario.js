const mongoose = require("mongoose");

const UsuarioSchema = new mongoose.Schema({

    nome: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    senha: {
        type: String,
        required: true
    },

    role: {

        type: String,

        enum: [
            "superadmin",
            "admin",
            "gerente",
            "financeiro",
            "estoque"
        ],

        default: "admin"
    },

    ativo: {
        type: Boolean,
        default: true
    },

    ultimoLogin: Date

}, {

    timestamps: true
});

module.exports =
    mongoose.model("Usuario", UsuarioSchema);