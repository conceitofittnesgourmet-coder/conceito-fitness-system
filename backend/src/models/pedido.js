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

      cpfNota: {
  type: String,
  default: "",
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

      subtotal: {
  type: Number,
  default: 0,
},

taxaEntrega: {
  type: Number,
  default: 0,
},


pagamento: {
  type: String,
  default: "PIX",
},

tipo: {
  type: String,
  default: "balcao",
},

mesa: {
  type: String,
  default: "",
},

enderecoEntrega: {
  type: String,
  default: "",
},

cep: {
  type: String,
  default: "",
},

numeroEntrega: {
  type: String,
  default: "",
},

bairroEntrega: {
  type: String,
  default: "",
},

complementoEntrega: {
  type: String,
  default: "",
},

referenciaEntrega: {
  type: String,
  default: "",
},

desconto: {
  type: Number,
  default: 0,
},

motivoDesconto: {
  type: String,
  default: "",
},

observacao: {
  type: String,
  default: "",
},

numeroPedido: {
  type: Number,
  unique: true,
  sparse: true,
},




      status: {

        type: String,

        enum: [
  "pendente",
  "producao",
  "pronto",
  "entregue",
  "cancelado"
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