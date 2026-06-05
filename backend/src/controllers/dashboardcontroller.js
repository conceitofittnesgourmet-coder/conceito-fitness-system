const Produto =
  require("../models/produto");

const Pedido =
  require("../models/pedido");

const Usuario =
  require("../models/usuario");

const Cliente =
  require("../models/cliente");

exports.dashboard = async (req, res) => {
  try {
    const totalProdutos =
      await Produto.countDocuments();

    const totalPedidos =
      await Pedido.countDocuments();

    const totalClientes =
      await Cliente.countDocuments();

    const pedidos =
      await Pedido.find();

    const clientes =
      await Cliente.find()
        .sort({ gasto: -1 })
        .limit(10);

    const hoje = new Date();

    const inicioHoje = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate()
    );

    const inicioSemana = new Date();
    inicioSemana.setDate(
      hoje.getDate() - 7
    );

    const inicioMes = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      1
    );

    let faturamento = 0;
    let faturamentoHoje = 0;
    let faturamentoSemana = 0;
    let faturamentoMes = 0;

    let pix = 0;
    let credito = 0;
    let debito = 0;
    let dinheiro = 0;

    let maiorVenda = 0;

    const produtosVendidos = {};

    pedidos.forEach((pedido) => {
      const total =
        Number(pedido.total || 0);

      faturamento += total;

      if (total > maiorVenda) {
        maiorVenda = total;
      }

      const dataPedido =
        new Date(pedido.createdAt);

      if (dataPedido >= inicioHoje) {
        faturamentoHoje += total;
      }

      if (dataPedido >= inicioSemana) {
        faturamentoSemana += total;
      }

      if (dataPedido >= inicioMes) {
        faturamentoMes += total;
      }

      switch (pedido.pagamento) {
        case "PIX":
          pix += total;
          break;

        case "CREDITO":
          credito += total;
          break;

        case "DEBITO":
          debito += total;
          break;

        case "DINHEIRO":
          dinheiro += total;
          break;
      }

      pedido.produtos?.forEach(
        (produto) => {
          const nome =
            produto.nome ||
            "Produto";

          produtosVendidos[nome] =
            (produtosVendidos[nome] || 0) +
            Number(
              produto.quantidade || 1
            );
        }
      );
    });

    const ticketMedio =
      totalPedidos > 0
        ? faturamento /
          totalPedidos
        : 0;

    const topProdutos =
      Object.entries(
        produtosVendidos
      )
        .sort(
          (a, b) =>
            b[1] - a[1]
        )
        .slice(0, 10)
        .map((item) => ({
          nome: item[0],
          quantidade: item[1],
        }));

    return res.status(200).json({
      success: true,

      dashboard: {
        totalProdutos,
        totalPedidos,
        totalClientes,

        faturamento,
        faturamentoHoje,
        faturamentoSemana,
        faturamentoMes,

        ticketMedio,
        maiorVenda,

        pagamentos: {
          pix,
          credito,
          debito,
          dinheiro,
        },

        topClientes:
          clientes.map((c) => ({
            nome: c.nome,
            gasto: c.gasto,
            clube: c.clube,
          })),

        topProdutos,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};