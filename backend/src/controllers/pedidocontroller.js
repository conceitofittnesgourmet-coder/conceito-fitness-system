const Produto = require("../models/produto");

const Pedido = require("../models/pedido");

let baixarEstoque = async () => {};

try {
  baixarEstoque = require("../utils/estoqueIA").baixarEstoque;
} catch (error) {
  console.log("Estoque IA não carregado.");
}

// LISTAR
exports.listarPedidos = async (req, res) => {
  try {
    const filtro = {};

    if (req.usuario?.empresa) {
      filtro.empresa = req.usuario.empresa;
    }

    const pedidos = await Pedido.find(filtro).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      pedidos,
    });
  } catch (error) {
    console.log("ERRO LISTAR PEDIDOS:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// BUSCAR POR ID
exports.buscarPedido = async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido não encontrado",
      });
    }

    return res.json({
      success: true,
      pedido,
    });
  } catch (error) {
    console.log("ERRO BUSCAR PEDIDO:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// CRIAR
exports.criarPedido = async (req, res) => {
  try {
    const { cliente, telefone, produtos, total } = req.body || {};

    if (!cliente) {
      return res.status(400).json({
        success: false,
        message: "Cliente é obrigatório",
      });
    }

    if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Pedido precisa ter produtos",
      });
    }

    const dadosPedido = {
      cliente,
      telefone: telefone || "",
      produtos,
      total: Number(total || 0),
      senha: proximaSenha,
    };

    if (req.usuario?.empresa) {
      dadosPedido.empresa = req.usuario.empresa;
    }

    const pedidoCriado = await Pedido.create(novoPedido);

const io = req.app.get("io");

io.emit("novo_pedido", pedidoCriado);

for (const item of pedido.produtos || []) {
  if (!item.produtoId) continue;

  try {
    await Produto.findByIdAndUpdate(item.produtoId, {
      $inc: {
        estoque: -Number(item.quantidade || 1),
      },
    });
  } catch (estoqueError) {
    console.log("ERRO AO BAIXAR ESTOQUE:", estoqueError.message);
  }
}

if (global.io) {
  global.io.emit("novo-pedido", pedido);
  global.io.emit("produto-atualizado");
}

    return res.status(201).json({
      success: true,
      pedido,
    });
  } catch (error) {
    console.log("ERRO CRIAR PEDIDO:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ATUALIZAR STATUS
exports.atualizarStatus = async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido não encontrado",
      });
    }

    if (global.io) {
      global.io.emit("pedido-atualizado", pedido);
    }

    return res.json({
      success: true,
      pedido,
    });
  } catch (error) {
    console.log("ERRO ATUALIZAR STATUS:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};