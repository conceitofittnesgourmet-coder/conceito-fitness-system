const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");

// REGISTER
exports.register = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        success: false,
        message: "Nome, email e senha são obrigatórios",
      });
    }

    const adminExiste = await Admin.findOne({ email });

    if (adminExiste) {
      return res.status(400).json({
        success: false,
        message: "Admin já existe",
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const admin = await Admin.create({
      nome,
      email,
      senha: senhaHash,
    });

    return res.status(201).json({
      success: true,
      admin: {
        id: admin._id,
        nome: admin.nome,
        email: admin.email,
      },
    });
  } catch (error) {
    console.log("ERRO REGISTER:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: "Email e senha são obrigatórios",
      });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Email inválido",
      });
    }

    const senhaCorreta = await bcrypt.compare(senha, admin.senha);

    if (!senhaCorreta) {
      return res.status(400).json({
        success: false,
        message: "Senha inválida",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        nome: admin.nome,
        email: admin.email,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        nome: admin.nome,
        email: admin.email,
      },
    });
  } catch (error) {
    console.log("ERRO LOGIN:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};