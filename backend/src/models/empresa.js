const mongoose =
require("mongoose");

const empresaSchema =
new mongoose.Schema({

  nome: {

    type:String,

    required:true

  },





  email: {

    type:String,

    required:true

  },





  plano: {

    type:String,

    default:"basic"

  },





  ativa: {

    type:Boolean,

    default:true

  }

}, {

  timestamps:true

});

module.exports =

mongoose.model(

  "Empresa",

  empresaSchema

);