const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({

  nome: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  senha: {
    type: String,
    required: true
  }

}, {

  timestamps: true

});

module.exports =
  mongoose.model(
    "Admin",
    adminSchema
  );