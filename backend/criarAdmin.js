const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Admin = require("./src/models/Admin");

async function criarAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "admin@conceito.com";
    const senha = "123456";

    const existe = await Admin.findOne({ email });

    if (existe) {
      existe.senha = await bcrypt.hash(senha, 10);
      existe.nome = "Administrador";
      await existe.save();

      console.log("✅ ADMIN JÁ EXISTIA, SENHA ATUALIZADA");
      console.log("Email:", email);
      console.log("Senha:", senha);
      process.exit();
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    await Admin.create({
      nome: "Administrador",
      email,
      senha: senhaHash,
    });

    console.log("✅ ADMIN CRIADO COM SUCESSO");
    console.log("Email:", email);
    console.log("Senha:", senha);

    process.exit();
  } catch (error) {
    console.log("❌ ERRO AO CRIAR ADMIN:");
    console.log(error);
    process.exit(1);
  }
}

criarAdmin();