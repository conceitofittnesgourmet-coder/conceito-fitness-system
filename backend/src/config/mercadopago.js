const {

  MercadoPagoConfig,

  Payment

} = require(
  "mercadopago"
);

const client =
new MercadoPagoConfig({

  accessToken:
    process.env.MP_TOKEN

});

module.exports = {

  client,

  Payment

};