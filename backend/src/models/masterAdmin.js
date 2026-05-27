const mongoose =
require("mongoose");

const masterSchema =
new mongoose.Schema({

  nome: {

    type:String,

    required:true

  },





  email: {

    type:String,

    required:true,

    unique:true

  },





  senha: {

    type:String,

    required:true

  },





  role: {

    type:String,

    default:"master"

  }

}, {

  timestamps:true

});

module.exports =

mongoose.model(

  "MasterAdmin",

  masterSchema

);