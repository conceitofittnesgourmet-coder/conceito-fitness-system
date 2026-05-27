const Pedido =
require("../models/pedido");

exports.webhookMercadoPago =
async (req, res) => {

  try {

    const body =
      req.body;





    console.log(
      "WEBHOOK:",
      body
    );





    // EVENTO PAGAMENTO

    if (

      body.type ===
      "payment"

    ) {

      const paymentId =
        body.data.id;





      // FUTURO:
      // CONSULTAR MP API





      await Pedido.findOneAndUpdate(

  {

    paymentId

  },

  {

    statusPagamento:
      "aprovado"

  }

);





console.log(

  "Pagamento aprovado"

);

    }





    res.sendStatus(200);

  } catch (error) {

    console.log(error);





    res.sendStatus(500);

  }

};