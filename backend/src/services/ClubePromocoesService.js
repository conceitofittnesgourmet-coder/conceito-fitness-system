const Cupom = require("../models/cupomclube");
const Campanha = require("../models/campanhaclube");
const UsoCupom = require("../models/usocupomclube");
const Cliente = require("../models/cliente");
const Clube = require("./ClubeConceitoService");

const telefoneNumeros = (v) => String(v || "").replace(/\D/g, "");
const vigente = (item, agora = new Date()) => item.ativo !== false && (!item.inicio || new Date(item.inicio) <= agora) && (!item.fim || new Date(item.fim) >= agora);

async function validarCupom({ codigo, telefone, subtotal = 0, frete = 0 }) {
  const cupom = await Cupom.findOne({ codigo: String(codigo || "").trim().toUpperCase() });
  if (!cupom || !vigente(cupom)) throw new Error("Cupom inválido ou fora da validade.");
  if (Number(subtotal) < Number(cupom.pedidoMinimo || 0)) throw new Error(`Pedido mínimo de R$ ${Number(cupom.pedidoMinimo).toFixed(2)}.`);
  if (cupom.limiteTotal > 0 && cupom.usos >= cupom.limiteTotal) throw new Error("Limite total de usos atingido.");
  const tel = telefoneNumeros(telefone);
  const cliente = tel ? await Cliente.findOne({ telefone: tel }) : null;
  if (cupom.niveisPermitidos?.length && (!cliente || !cupom.niveisPermitidos.includes(cliente.clube))) throw new Error("Cupom indisponível para o nível deste cliente.");
  if (cupom.limitePorCliente > 0 && tel) {
    const usos = await UsoCupom.countDocuments({ cupom: cupom._id, telefone: tel });
    if (usos >= cupom.limitePorCliente) throw new Error("Limite de uso por cliente atingido.");
  }
  let desconto = 0;
  if (cupom.tipo === "percentual") desconto = Number(subtotal) * Number(cupom.valor || 0) / 100;
  if (cupom.tipo === "fixo") desconto = Math.min(Number(subtotal), Number(cupom.valor || 0));
  if (cupom.tipo === "frete_gratis") desconto = Number(frete || 0);
  return { cupom, desconto: Number(desconto.toFixed(2)), total: Math.max(0, Number(subtotal) + Number(frete) - desconto) };
}

async function calcularBeneficios({ telefone, subtotal = 0, itens = [] }) {
  const tel = telefoneNumeros(telefone);
  const cliente = tel ? await Cliente.findOne({ telefone: tel }) : null;
  const config = await Clube.obterConfiguracao();
  const nivel = cliente ? Clube.nivelPorGasto(config, cliente.gasto) : config.niveis?.[0];
  const agora = new Date();
  const campanhas = (await Campanha.find({ ativo: true }).lean()).filter(c => vigente(c, agora))
    .filter(c => !c.diasSemana?.length || c.diasSemana.includes(agora.getDay()))
    .filter(c => !c.niveisPermitidos?.length || c.niveisPermitidos.includes(nivel?.nome))
    .filter(c => Number(subtotal) >= Number(c.pedidoMinimo || 0));
  let multiplicador = Number(nivel?.multiplicadorPontos || 1);
  let cashbackPercentual = Number(nivel?.cashbackPercentual || 0);
  campanhas.forEach(c => {
    if (["pontos", "pontos_cashback"].includes(c.tipoBeneficio)) multiplicador = Math.max(multiplicador, Number(c.multiplicadorPontos || 1));
    if (["cashback", "pontos_cashback"].includes(c.tipoBeneficio)) cashbackPercentual += Number(c.cashbackPercentual || 0);
  });
  const pontos = Math.floor(Number(subtotal) * Number(config.pontosPorReal || 0) * multiplicador);
  let cashback = Number(subtotal) * cashbackPercentual / 100;
  const limites = campanhas.map(c => Number(c.limiteCashback || 0)).filter(v => v > 0);
  if (limites.length) cashback = Math.min(cashback, Math.min(...limites));
  return { nivel: nivel?.nome || "Básico", pontos, cashback: Number(cashback.toFixed(2)), cashbackPercentual, campanhas: campanhas.map(c => ({ id:c._id, nome:c.nome })) };
}

module.exports = { validarCupom, calcularBeneficios, vigente };
