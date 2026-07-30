const Cliente = require("../models/cliente");
const ClubeConfiguracao = require("../models/clubeconfiguracao");
const MovimentoClube = require("../models/movimentoclube");
const Clube = require("../services/ClubeConceitoService");

exports.obterConfiguracao = async (_req,res) => { try { res.json({success:true, configuracao: await Clube.obterConfiguracao()}); } catch(e){ res.status(500).json({success:false,message:e.message}); } };
exports.salvarConfiguracao = async (req,res) => { try {
  const dados = req.body || {};
  const config = await ClubeConfiguracao.findOneAndUpdate({chave:"principal"}, {$set:{
    ativo: dados.ativo !== false,
    nomePrograma: dados.nomePrograma || "Clube Conceito",
    pontosPorReal: Math.max(0, Number(dados.pontosPorReal ?? 1)),
    validadePontosDias: Math.max(0, Number(dados.validadePontosDias ?? 365)),
    adesaoAutomatica: dados.adesaoAutomatica !== false,
    ...(Array.isArray(dados.niveis) ? { niveis: dados.niveis } : {}),
  }}, {new:true,upsert:true,runValidators:true});
  res.json({success:true,configuracao:config});
} catch(e){ res.status(400).json({success:false,message:e.message}); } };
exports.painel = async (_req,res) => { try { res.json({success:true, ...(await Clube.painel())}); } catch(e){ res.status(500).json({success:false,message:e.message}); } };
exports.carteira = async (req,res) => { try { const c=await Clube.carteiraPorTelefone(req.query.telefone); if(!c)return res.status(404).json({success:false,message:"Cliente não encontrado."}); res.json({success:true,carteira:c}); } catch(e){res.status(500).json({success:false,message:e.message});} };
exports.lancarMovimento = async (req,res) => { try {
  const cliente = await Cliente.findById(req.body?.clienteId); if(!cliente)return res.status(404).json({success:false,message:"Cliente não encontrado."});
  const pontos = Number(req.body?.pontos || 0), cashback = Number(req.body?.cashback || 0), tipo=String(req.body?.tipo||"ajuste");
  const sinalP = tipo === "debito_pontos" ? -Math.abs(pontos) : Math.abs(pontos);
  const sinalC = tipo === "debito_cashback" ? -Math.abs(cashback) : Math.abs(cashback);
  cliente.pontos = Math.max(0, Number(cliente.pontos||0)+sinalP); cliente.cashback=Math.max(0,Number(cliente.cashback||0)+sinalC); await cliente.save();
  const movimento=await MovimentoClube.create({cliente:cliente._id,tipo,pontos:sinalP,cashback:sinalC,descricao:req.body?.descricao||"Ajuste manual",origem:"painel-admin"});
  res.status(201).json({success:true,movimento,carteira:await Clube.prepararCarteira(cliente)});
 } catch(e){res.status(400).json({success:false,message:e.message});} };

const CupomClube = require("../models/cupomclube");
const CampanhaClube = require("../models/campanhaclube");
const Promocoes = require("../services/ClubePromocoesService");

exports.listarCupons = async (_req,res) => { try { res.json({success:true,cupons:await CupomClube.find().sort({createdAt:-1})}); } catch(e){res.status(500).json({success:false,message:e.message});} };
exports.salvarCupom = async (req,res) => { try {
  const dados={...req.body,codigo:String(req.body?.codigo||"").trim().toUpperCase()};
  if(!dados.codigo||!dados.nome)return res.status(400).json({success:false,message:"Código e nome são obrigatórios."});
  const cupom=req.params.id?await CupomClube.findByIdAndUpdate(req.params.id,dados,{new:true,runValidators:true}):await CupomClube.create(dados);
  res.status(req.params.id?200:201).json({success:true,cupom});
 } catch(e){res.status(400).json({success:false,message:e.code===11000?"Já existe um cupom com este código.":e.message});} };
exports.excluirCupom = async (req,res) => { try { await CupomClube.findByIdAndDelete(req.params.id);res.json({success:true}); } catch(e){res.status(400).json({success:false,message:e.message});} };
exports.validarCupom = async (req,res) => { try { const r=await Promocoes.validarCupom(req.body||{});res.json({success:true,cupom:{id:r.cupom._id,codigo:r.cupom.codigo,nome:r.cupom.nome,tipo:r.cupom.tipo},desconto:r.desconto,total:r.total}); } catch(e){res.status(400).json({success:false,message:e.message});} };

exports.listarCampanhas = async (_req,res) => { try { res.json({success:true,campanhas:await CampanhaClube.find().sort({createdAt:-1})}); } catch(e){res.status(500).json({success:false,message:e.message});} };
exports.salvarCampanha = async (req,res) => { try {
  if(!req.body?.nome)return res.status(400).json({success:false,message:"Nome da campanha é obrigatório."});
  const campanha=req.params.id?await CampanhaClube.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true}):await CampanhaClube.create(req.body);
  res.status(req.params.id?200:201).json({success:true,campanha});
 } catch(e){res.status(400).json({success:false,message:e.message});} };
exports.excluirCampanha = async (req,res) => { try { await CampanhaClube.findByIdAndDelete(req.params.id);res.json({success:true}); } catch(e){res.status(400).json({success:false,message:e.message});} };
exports.simularBeneficios = async (req,res) => { try { res.json({success:true,beneficios:await Promocoes.calcularBeneficios(req.body||{})}); } catch(e){res.status(400).json({success:false,message:e.message});} };

const PlanoAssinaturaClube = require("../models/planoassinaturaclube");
const AssinaturaClube = require("../models/assinaturaclube");

function vencimentoPorPlano(plano, inicio = new Date()) {
  const data = new Date(inicio);
  data.setDate(data.getDate() + Math.max(1, Number(plano.duracaoDias || 30)));
  return data;
}

exports.listarPlanos = async (_req, res) => { try {
  res.json({ success: true, planos: await PlanoAssinaturaClube.find().sort({ destaque: -1, valor: 1 }) });
} catch (e) { res.status(500).json({ success: false, message: e.message }); } };

exports.salvarPlano = async (req, res) => { try {
  if (!req.body?.nome || Number(req.body?.valor) < 0) return res.status(400).json({ success: false, message: "Nome e valor do plano são obrigatórios." });
  const dados = { ...req.body, beneficios: Array.isArray(req.body.beneficios) ? req.body.beneficios : String(req.body.beneficios || "").split("\n").map(v => v.trim()).filter(Boolean) };
  const plano = req.params.id
    ? await PlanoAssinaturaClube.findByIdAndUpdate(req.params.id, dados, { new: true, runValidators: true })
    : await PlanoAssinaturaClube.create(dados);
  res.status(req.params.id ? 200 : 201).json({ success: true, plano });
} catch (e) { res.status(400).json({ success: false, message: e.message }); } };

exports.excluirPlano = async (req, res) => { try {
  const emUso = await AssinaturaClube.exists({ plano: req.params.id, status: { $in: ["ativa", "pendente", "pausada"] } });
  if (emUso) return res.status(409).json({ success: false, message: "Este plano possui assinaturas vinculadas. Desative-o em vez de excluir." });
  await PlanoAssinaturaClube.findByIdAndDelete(req.params.id);
  res.json({ success: true });
} catch (e) { res.status(400).json({ success: false, message: e.message }); } };

exports.listarAssinaturas = async (_req, res) => { try {
  await AssinaturaClube.updateMany({ status: "ativa", vencimento: { $lt: new Date() } }, { $set: { status: "vencida" } });
  const assinaturas = await AssinaturaClube.find().populate("cliente", "nome telefone email numeroAssociado").populate("plano").sort({ createdAt: -1 });
  res.json({ success: true, assinaturas });
} catch (e) { res.status(500).json({ success: false, message: e.message }); } };

exports.criarAssinatura = async (req, res) => { try {
  const cliente = await Cliente.findById(req.body?.clienteId);
  const plano = await PlanoAssinaturaClube.findById(req.body?.planoId);
  if (!cliente || !plano) return res.status(404).json({ success: false, message: "Cliente ou plano não encontrado." });
  await AssinaturaClube.updateMany({ cliente: cliente._id, status: "ativa" }, { $set: { status: "cancelada", canceladaEm: new Date() } });
  const inicio = req.body?.inicio ? new Date(req.body.inicio) : new Date();
  const assinatura = await AssinaturaClube.create({
    cliente: cliente._id, plano: plano._id, inicio,
    vencimento: req.body?.vencimento ? new Date(req.body.vencimento) : vencimentoPorPlano(plano, inicio),
    renovacaoAutomatica: Boolean(req.body?.renovacaoAutomatica), formaPagamento: req.body?.formaPagamento || "manual",
    valorContratado: Number(req.body?.valorContratado ?? plano.valor), observacao: req.body?.observacao || "", status: req.body?.status || "ativa",
  });
  res.status(201).json({ success: true, assinatura: await assinatura.populate(["cliente", "plano"]) });
} catch (e) { res.status(400).json({ success: false, message: e.message }); } };

exports.atualizarAssinatura = async (req, res) => { try {
  const dados = { ...req.body };
  if (dados.status === "cancelada") dados.canceladaEm = new Date();
  const assinatura = await AssinaturaClube.findByIdAndUpdate(req.params.id, dados, { new: true, runValidators: true }).populate("cliente", "nome telefone email numeroAssociado").populate("plano");
  if (!assinatura) return res.status(404).json({ success: false, message: "Assinatura não encontrada." });
  res.json({ success: true, assinatura });
} catch (e) { res.status(400).json({ success: false, message: e.message }); } };

exports.resumoAssinaturas = async (_req, res) => { try {
  await AssinaturaClube.updateMany({ status: "ativa", vencimento: { $lt: new Date() } }, { $set: { status: "vencida" } });
  const [ativas, pendentes, vencidas, receita] = await Promise.all([
    AssinaturaClube.countDocuments({ status: "ativa" }), AssinaturaClube.countDocuments({ status: "pendente" }),
    AssinaturaClube.countDocuments({ status: "vencida" }), AssinaturaClube.aggregate([{ $match: { status: "ativa" } }, { $group: { _id: null, total: { $sum: "$valorContratado" } } }]),
  ]);
  res.json({ success: true, resumo: { ativas, pendentes, vencidas, receitaRecorrente: receita[0]?.total || 0 } });
} catch (e) { res.status(500).json({ success: false, message: e.message }); } };
