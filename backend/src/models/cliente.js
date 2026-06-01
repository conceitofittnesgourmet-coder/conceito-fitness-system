const mongoose = require("mongoose");

const clienteSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    email: { type: String, default: "" },
    telefone: { type: String, required: true, unique: true },
    cidade: { type: String, default: "" },
    aniversario: { type: String, default: "" },

    pedidos: { type: Number, default: 0 },
    gasto: { type: Number, default: 0 },
    pontos: { type: Number, default: 0 },
    cashback: { type: Number, default: 0 },

    clube: {
      type: String,
      enum: ["Básico", "Prata", "Ouro", "Premium", "Black"],
      default: "Básico",
    },

    ativo: { type: Boolean, default: true },
    ultimoPedido: { type: Date, default: null },
    origem: { type: String, default: "manual" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Cliente || mongoose.model("Cliente", clienteSchema);