const mongoose =
  require("mongoose");

const pedidoSchema =
  new mongoose.Schema(

    {

      empresa: {

  type:
    mongoose.Schema.Types.ObjectId,

  ref:"Empresa"

},




      cliente: {

        type: String,

        required: true

      },





      telefone: {

        type: String

      },





      produtos: [
  {
    produtoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produto",
    },

    senha: Number,

    nome: String,

    quantidade: Number,

    preco: Number,

    subtotal: Number,

    imagem: String,
  }
],





      total: {

        type: Number,

        required: true

      },





      status: {

        type: String,

        enum: [

          "pendente",

          "producao",

          "pronto",

          "entregue"

        ],

        default: "pendente"

      }

    },

    {

      timestamps: true

    }

  );



module.exports =
  mongoose.models.Pedido ||
  mongoose.model(
    "Pedido",
    pedidoSchema
  );