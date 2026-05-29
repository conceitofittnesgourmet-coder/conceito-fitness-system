const mongoose = require("mongoose");

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MONGODB CONECTADO");
  } catch (error) {
    console.error("❌ ERRO MONGODB");
    console.error(error);

    // NÃO derruba o servidor
  }
}

module.exports = connectDatabase;