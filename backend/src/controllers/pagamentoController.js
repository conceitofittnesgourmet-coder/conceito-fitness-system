const {

  client,

  Payment

} = require(

  "../config/mercadopago"

);

exports.criarPix =
async (req, res) => {

  try {

    const {

      total,

      cliente

    } = req.body;





    const payment =
new Payment(client);

const pagamento =
await payment.create({

  body: {

    transaction_amount:
      Number(total),

    description:
      "Pedido Gourmet",

    payment_method_id:
      "pix",

    payer: {

      email:
        "cliente@email.com",

      first_name:
        cliente

    }

  }

});





    res.json({

      pix:

        pagamento
          .point_of_interaction
          .transaction_data

    });

  } catch (error) {

    console.log(error);





    res.status(500).json({

      message:
        error.message

    });

  }

};