require("dotenv").config();
const mongoose = require("mongoose");
const Nfce = require("./src/models/nfce");
const Pedido = require("./src/models/pedido");

async function testar() {
  await mongoose.connect(process.env.MONGO_URI);

  console.log("=== NFCES ===");
  console.log(
    await Nfce.find({}, {
      numero: 1,
      status: 1,
      pedido: 1,
      cStat: 1,
      createdAt: 1
    }).sort({ createdAt: -1 }).limit(10)
  );

  console.log("=== PEDIDOS ===");
  console.log(
    await Pedido.find({}, {
      numeroPedido: 1,
      status: 1,
      total: 1,
      cpfNota: 1,
      createdAt: 1
    }).sort({ createdAt: -1 }).limit(10)
  );

  await mongoose.disconnect();
}

testar();