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
