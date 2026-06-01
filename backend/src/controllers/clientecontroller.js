const Cliente = require("../models/cliente");

function calcularClube(gasto) {
  if (gasto >= 2000) return "Black";
  if (gasto >= 1000) return "Premium";
  if (gasto >= 500) return "Ouro";
  if (gasto >= 250) return "Prata";
  return "Básico";
}

exports.listarClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      clientes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.criarCliente = async (req, res) => {
  try {
    const { nome, telefone, email, cidade, aniversario } = req.body || {};

    if (!nome || !telefone) {
      return res.status(400).json({
        success: false,
        message: "Nome e telefone são obrigatórios.",
      });
    }

    const clienteExistente = await Cliente.findOne({ telefone });

    if (clienteExistente) {
      return res.status(400).json({
        success: false,
        message: "Já existe cliente com este telefone.",
      });
    }

    const cliente = await Cliente.create({
      nome,
      telefone,
      email: email || "",
      cidade: cidade || "",
      aniversario: aniversario || "",
      origem: "manual",
    });

    return res.status(201).json({
      success: true,
      cliente,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.atualizarCliente = async (req, res) => {
  try {
    const dados = { ...req.body };

    if (dados.gasto !== undefined) {
      dados.clube = calcularClube(Number(dados.gasto || 0));
      dados.pontos = Math.floor(Number(dados.gasto || 0));
      dados.cashback = Number(dados.gasto || 0) * 0.03;
    }

    const cliente = await Cliente.findByIdAndUpdate(req.params.id, dados, {
      new: true,
      runValidators: true,
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: "Cliente não encontrado.",
      });
    }

    return res.json({
      success: true,
      cliente,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deletarCliente = async (req, res) => {
  try {
    await Cliente.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Cliente removido com sucesso.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};