const Pedido = require("../models/Pedido");
const { MercadoPagoConfig, Payment } = require("mercadopago");

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_TOKEN
});

const payment = new Payment(client);

module.exports = async (req, res) => {

  try {

    const paymentId = req.body.data?.id;

    if (!paymentId) return res.sendStatus(200);

    const result = await payment.get({ id: paymentId });

    const pedidoId = result.external_reference;

    if (result.status === "approved") {

      const pedido = await Pedido.findById(pedidoId);

      if (pedido) {
        pedido.status = "pago";
        await pedido.save();
        console.log("✅ Pedido atualizado para PAGO");
      }
    }

    res.sendStatus(200);

  } catch (e) {
    console.log("Erro webhook:", e.message);
    res.sendStatus(500);
  }

};