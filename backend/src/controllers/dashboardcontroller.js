const Produto =
  require("../models/produto");

const Pedido =
  require("../models/pedido");

const Usuario =
  require("../models/usuario");

exports.dashboard =
  async (req, res) => {

  try {

    // ==========================================
    // PRODUTOS
    // ==========================================

    const totalProdutos =
      await Produto.countDocuments();

    // ==========================================
    // PEDIDOS
    // ==========================================

    const totalPedidos =
      await Pedido.countDocuments();

    // ==========================================
    // CLIENTES
    // ==========================================

    const totalClientes =
      await Usuario.countDocuments();

    // ==========================================
    // FATURAMENTO
    // ==========================================

    const pedidos =
      await Pedido.find();

    let faturamento = 0;

    pedidos.forEach((pedido) => {

      faturamento +=
        pedido.total || 0;

    });

    return res.status(200).json({

      success: true,

      dashboard: {

        totalProdutos,

        totalPedidos,

        totalClientes,

        faturamento

      }

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,

      message: error.message

    });

  }

};