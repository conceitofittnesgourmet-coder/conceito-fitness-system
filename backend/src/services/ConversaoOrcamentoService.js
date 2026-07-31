const Orcamento = require("../models/orcamento");
const Pedido = require("../models/pedido");
const Produto = require("../models/produto");
const ContaReceber = require("../models/contareceber");
const OrdemProducaoService = require("./OrdemProducaoService");

function erro(message, statusCode = 400, detalhes = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.detalhes = detalhes;
  return error;
}

function usuarioNome(usuario) {
  return usuario?.nome || usuario?.email || "Sistema";
}

async function proximoNumeroPedido() {
  const ultimo = await Pedido.findOne({ numeroPedido: { $ne: null } }).sort({ numeroPedido: -1 }).select("numeroPedido").lean();
  return Number(ultimo?.numeroPedido || 0) + 1;
}

function prioridadePorData(dataEvento) {
  if (!dataEvento) return 3;
  const dias = Math.ceil((new Date(dataEvento).getTime() - Date.now()) / 86400000);
  if (dias <= 1) return 10;
  if (dias <= 3) return 8;
  if (dias <= 7) return 6;
  return 3;
}

async function inspecionar(id, empresa) {
  const filtro = { _id: id };
  if (empresa) filtro.empresa = empresa;
  const orcamento = await Orcamento.findOne(filtro).lean();
  if (!orcamento) throw erro("Orçamento não encontrado.", 404);

  const ids = (orcamento.itens || []).map(i => i.produtoId).filter(Boolean);
  const produtos = await Produto.find({ _id: { $in: ids } }).select("nome preco custo unidadeMedida cadastroMestre produtoComposto").lean();
  const mapa = new Map(produtos.map(p => [String(p._id), p]));
  const pendencias = [];
  const avisos = [];

  if (orcamento.status !== "aprovado") pendencias.push("O orçamento precisa estar aprovado.");
  if (orcamento.pedidoId || orcamento.status === "convertido") pendencias.push("Este orçamento já foi convertido.");
  if (!orcamento.cliente?.trim()) pendencias.push("Cliente não informado.");
  if (!orcamento.telefone?.trim()) avisos.push("Telefone do cliente não informado.");
  if (!orcamento.dataEvento) avisos.push("Data do evento/entrega não informada.");
  if (!(orcamento.itens || []).length) pendencias.push("O orçamento não possui itens.");

  const itens = (orcamento.itens || []).map(item => {
    const produto = item.produtoId ? mapa.get(String(item.produtoId)) : null;
    if (!item.produtoId) pendencias.push(`O item “${item.nome}” não está vinculado a um produto cadastrado.`);
    else if (!produto) pendencias.push(`O produto do item “${item.nome}” não foi encontrado.`);
    const custo = Number(produto?.custo || 0) * Number(item.quantidade || 0);
    return {
      nome: item.nome,
      produtoId: item.produtoId || null,
      quantidade: Number(item.quantidade || 0),
      valor: Number(item.subtotal || 0),
      custo,
      controlaProducao: Boolean(produto?.cadastroMestre?.producao?.controlaProducao || produto?.produtoComposto),
    };
  });

  const custoEstimado = itens.reduce((s, i) => s + i.custo, 0);
  const lucroEstimado = Number(orcamento.total || 0) - custoEstimado;
  const margem = Number(orcamento.total || 0) > 0 ? (lucroEstimado / Number(orcamento.total)) * 100 : 0;
  if (margem < 30) avisos.push("Margem estimada abaixo de 30%.");

  const pontuacao = Math.max(0, 100 - pendencias.length * 25 - avisos.length * 7);
  return {
    orcamento,
    validacao: {
      podeConverter: pendencias.length === 0,
      pontuacao,
      classificacao: pontuacao >= 90 ? "Conversão segura" : pontuacao >= 70 ? "Revisar avisos" : "Conversão bloqueada",
      pendencias,
      avisos,
      itens,
      financeiro: {
        total: Number(orcamento.total || 0),
        sinal: Number(orcamento.valorSinal || 0),
        saldo: Math.max(0, Number(orcamento.total || 0) - Number(orcamento.valorSinal || 0)),
        custoEstimado,
        lucroEstimado,
        margem: Number(margem.toFixed(2)),
      },
    },
  };
}

async function converter({ id, empresa, usuario, dados = {} }) {
  const analise = await inspecionar(id, empresa);
  if (!analise.validacao.podeConverter) throw erro("A conversão possui pendências obrigatórias.", 409, analise.validacao);

  const claim = await Orcamento.findOneAndUpdate(
    { _id: id, status: "aprovado", pedidoId: null, "conversao.emProcessamento": { $ne: true } },
    { $set: { "conversao.emProcessamento": true, "conversao.iniciadoEm": new Date(), "conversao.usuario": usuarioNome(usuario) } },
    { new: true }
  );
  if (!claim) throw erro("O orçamento já foi convertido ou está sendo processado.", 409);

  let pedido = null;
  const ordens = [];
  const contas = [];
  try {
    const produtosBanco = await Produto.find({ _id: { $in: claim.itens.map(i => i.produtoId).filter(Boolean) } }).lean();
    const mapa = new Map(produtosBanco.map(p => [String(p._id), p]));
    const produtos = claim.itens.map(item => {
      const p = mapa.get(String(item.produtoId));
      return {
        produtoId: p._id,
        nome: p.nome,
        categoria: p.categoria || "",
        sku: p.sku || "",
        codigoBarras: p.codigoBarras || "",
        quantidade: Number(item.quantidade || 1),
        preco: Number(item.valorUnitario || 0),
        precoUnitario: Number(item.valorUnitario || 0),
        precoOriginal: Number(p.preco || 0),
        custoNaVenda: Number(p.custo || 0),
        subtotal: Number(item.subtotal || 0),
        unidadeMedida: p.unidadeMedida || "UN",
        imagem: p.imagem || p.foto || "",
        configuracoes: [],
        dadosFiscais: p.dadosFiscais || {},
      };
    });

    pedido = await Pedido.create({
      empresa: empresa || claim.empresa || null,
      numeroPedido: await proximoNumeroPedido(),
      cliente: claim.cliente,
      telefone: claim.telefone || "",
      produtos,
      total: Number(claim.total || 0),
      subtotal: Number(claim.subtotal || 0),
      taxaEntrega: Number(claim.taxaEntrega || 0),
      desconto: Number(claim.desconto || 0),
      motivoDesconto: `Conversão do orçamento ${claim.numero}`,
      observacao: [claim.observacoes, `Origem: ${claim.numero}`].filter(Boolean).join("\n"),
      pagamento: dados.formaPagamento || "PIX",
      tipo: dados.tipoPedido || "encomenda",
      status: "pendente",
      statusProducao: "aguardando",
      prioridadeProducao: prioridadePorData(claim.dataEvento),
    });

    for (const item of claim.itens) {
      const p = mapa.get(String(item.produtoId));
      const controla = Boolean(p?.cadastroMestre?.producao?.controlaProducao || p?.produtoComposto);
      if (!controla) continue;
      const ordem = await OrdemProducaoService.criar({
        empresa: empresa || claim.empresa || null,
        usuario,
        dados: {
          produto: p._id,
          quantidadePlanejada: Number(item.quantidade || 1),
          unidade: p.unidadeMedida || "UN",
          prioridade: prioridadePorData(claim.dataEvento),
          dataPlanejada: claim.dataEvento || null,
          observacoes: `Gerada automaticamente pelo orçamento ${claim.numero} / pedido #${pedido.numeroPedido}.`,
        },
      });
      ordens.push(ordem);
    }

    const total = Number(claim.total || 0);
    const sinal = Math.min(total, Math.max(0, Number(claim.valorSinal || 0)));
    const saldo = Math.max(0, total - sinal);
    const vencimentoSinal = dados.vencimentoSinal ? new Date(dados.vencimentoSinal) : new Date();
    const vencimentoSaldo = dados.vencimentoSaldo ? new Date(dados.vencimentoSaldo) : (claim.dataEvento || new Date());
    if (sinal > 0) contas.push(await ContaReceber.create({ descricao: `Sinal - ${claim.numero}`, cliente: claim.cliente, valor: sinal, vencimento: vencimentoSinal, status: "pendente", formaRecebimento: dados.formaPagamento || "PIX", pedido: pedido._id, empresa: empresa || claim.empresa || null, observacao: "Sinal gerado na conversão do orçamento." }));
    if (saldo > 0) contas.push(await ContaReceber.create({ descricao: `Saldo - ${claim.numero}`, cliente: claim.cliente, valor: saldo, vencimento: vencimentoSaldo, status: "pendente", formaRecebimento: dados.formaPagamento || "PIX", pedido: pedido._id, empresa: empresa || claim.empresa || null, observacao: "Saldo gerado na conversão do orçamento." }));

    claim.status = "convertido";
    claim.pedidoId = pedido._id;
    claim.ordensProducaoIds = ordens.map(o => o._id);
    claim.contasReceberIds = contas.map(c => c._id);
    claim.convertidoEm = new Date();
    claim.conversao.emProcessamento = false;
    claim.conversao.concluidoEm = new Date();
    claim.timeline.push({ tipo: "convertido", titulo: "Orçamento convertido", descricao: `Pedido #${pedido.numeroPedido} criado com ${ordens.length} ordem(ns) de produção e ${contas.length} conta(s) a receber.`, usuario: usuarioNome(usuario) });
    await claim.save();

    return { orcamento: claim, pedido, ordensProducao: ordens, contasReceber: contas };
  } catch (e) {
    await Orcamento.updateOne({ _id: id }, { $set: { "conversao.emProcessamento": false }, $push: { timeline: { tipo: "falha_conversao", titulo: "Falha na conversão", descricao: e.message, usuario: usuarioNome(usuario), data: new Date() } } });
    if (pedido?._id) await Pedido.deleteOne({ _id: pedido._id }).catch(() => {});
    if (ordens.length) {
      const OrdemProducao = require("../models/ordemproducao");
      await OrdemProducao.deleteMany({ _id: { $in: ordens.map(o => o._id) } }).catch(() => {});
    }
    if (contas.length) await ContaReceber.deleteMany({ _id: { $in: contas.map(c => c._id) } }).catch(() => {});
    throw e;
  }
}

module.exports = { inspecionar, converter };
