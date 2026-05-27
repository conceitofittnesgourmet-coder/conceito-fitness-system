const mongoose =
require("mongoose");

const estoqueSchema =
new mongoose.Schema({

  nome: {

    type:String,

    required:true

  },





  quantidade: {

    type:Number,

    default:0

  },





  minimo: {

    type:Number,

    default:5

  },





  unidade: {

    type:String,

    default:"un"

  }

}, {

  timestamps:true

});

module.exports =

mongoose.model(

  "Estoque",

  estoqueSchema

);