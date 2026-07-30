const mongoose = require("mongoose");

const nivelSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  gastoMinimo: { type: Number, required: true, min: 0 },
  multiplicadorPontos: { type: Number, default: 1, min: 0 },
  cashbackPercentual: { type: Number, default: 0, min: 0, max: 100 },
  beneficios: { type: [String], default: [] },
}, { _id: false });

const clubeConfiguracaoSchema = new mongoose.Schema({
  chave: { type: String, default: "principal", unique: true },
  ativo: { type: Boolean, default: true },
  nomePrograma: { type: String, default: "Clube Conceito", trim: true },
  pontosPorReal: { type: Number, default: 1, min: 0 },
  validadePontosDias: { type: Number, default: 365, min: 0 },
  adesaoAutomatica: { type: Boolean, default: true },
  niveis: { type: [nivelSchema], default: () => ([
    { nome: "Básico", gastoMinimo: 0, multiplicadorPontos: 1, cashbackPercentual: 0, beneficios: ["Carteira digital"] },
    { nome: "Prata", gastoMinimo: 250, multiplicadorPontos: 1.1, cashbackPercentual: 1, beneficios: ["Ofertas exclusivas"] },
    { nome: "Ouro", gastoMinimo: 500, multiplicadorPontos: 1.25, cashbackPercentual: 2, beneficios: ["Ofertas exclusivas", "Bônus de aniversário"] },
    { nome: "Premium", gastoMinimo: 1000, multiplicadorPontos: 1.5, cashbackPercentual: 3, beneficios: ["Bônus de aniversário", "Lançamentos antecipados"] },
    { nome: "Black", gastoMinimo: 2000, multiplicadorPontos: 2, cashbackPercentual: 5, beneficios: ["Benefícios máximos", "Atendimento prioritário"] },
  ]) },
}, { timestamps: true });

module.exports = mongoose.models.ClubeConfiguracao || mongoose.model("ClubeConfiguracao", clubeConfiguracaoSchema);
