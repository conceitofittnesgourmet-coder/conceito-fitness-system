const Pedido =
require("../models/pedido");

const Produto =
require("../models/produto");

const {

  analisarPedidos

} = require(

  "../utils/aiAnalytics"

);

exports.getAnalytics =
async (req, res) => {

  try {

    const pedidos =
      await Pedido.find();





    const produtos =
      await Produto.find();





    const faturamento =

      pedidos.reduce(

        (acc, pedido) =>

          acc + (
            pedido.total || 0
          ),

        0

      );





    const totalPedidos =
      pedidos.length;





    const ticketMedio =

      totalPedidos > 0

        ? faturamento /
          totalPedidos

        : 0;





    // PRODUTOS MAIS VENDIDOS

    const ranking = {};





    pedidos.forEach(
      (pedido) => {

        pedido.produtos?.forEach(
          (produto) => {

            if (
              !ranking[
                produto.nome
              ]
            ) {

              ranking[
                produto.nome
              ] = 0;

            }





            ranking[
              produto.nome
            ] +=
              produto.quantidade;

          }
        );

      }
    );





    const topProdutos =

      Object.entries(
        ranking
      )

      .sort(

        (a, b) =>
          b[1] - a[1]

      )

      .slice(0, 5);

const ia =

  analisarPedidos(
    pedidos
  );



    res.json({

      faturamento,

      totalPedidos,

      ticketMedio,

      totalProdutos:
        produtos.length,

      topProdutos,
      
    ia
      
    });

  } catch (error) {

    console.log(error);





    res.status(500).json({

      message:
        error.message

    });

  }

};