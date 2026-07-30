const mongoose = require("mongoose");
const Pedido = require("../models/pedido");
const Produto = require("../models/produto");
const FichaTecnica = require("../models/fichatecnica");
const OrdemProducao = require("../models/ordemproducao");
const OrdemProducaoService = require("./OrdemProducaoService");
const { arredondar, converter, criarErro } = require("./ProducaoCalculoService");

function inicioDoDia(data) {
  const valor = new Date(data);
  valor.setHours(0, 0, 0, 0);
  return valor;
}

function fimDoDia(data) {
  const valor = new Date(data);
  valor.setHours(23, 59, 59, 999);
  return valor;
}

function dataPedidoField() {
  return "$createdAt";
}

async function vendasHistoricas({ empresa, desde, ate }) {
  const filtro = { createdAt: { $gte: desde, $lte: ate } };
  if (empresa) filtro.empresa = mongoose.Types.ObjectId.isValid(empresa) ? new mongoose.Types.ObjectId(empresa) : empresa;

  return Pedido.aggregate([
    { $match: filtro },
    { $unwind: "$produtos" },
    { $match: { "produtos.produtoId": { $ne: null } } },
    { $group: {
      _id: "$produtos.produtoId",
      quantidade: { $sum: { $ifNull: ["$produtos.quantidade", 0] } },
      diasComVenda: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: dataPedidoField() } } },
    } },
    { $project: { quantidade: 1, diasComVenda: { $size: "$diasComVenda" } } },
  ]);
}

async function montarNecessidades(sugestoes) {
  const produtoIds = sugestoes.filter((item) => item.quantidadeSugerida > 0).map((item) => item.produtoId);
  const fichas = await FichaTecnica.find({ produto: { $in: produtoIds }, ativa: true })
    .populate("itens.materiaPrima")
    .sort({ updatedAt: -1 })
    .lean();

  const fichaPorProduto = new Map();
  for (const ficha of fichas) {
    const chave = String(ficha.produto);
    if (!fichaPorProduto.has(chave)) fichaPorProduto.set(chave, ficha);
  }

  const mapa = new Map();
  for (const sugestao of sugestoes) {
    const ficha = fichaPorProduto.get(String(sugestao.produtoId));
    if (!ficha || sugestao.quantidadeSugerida <= 0) continue;
    const fator = sugestao.quantidadeSugerida / Number(ficha.rendimento || 1);

    for (const item of ficha.itens || []) {
      const materia = item.materiaPrima;
      if (!materia) continue;
      const necessario = converter(Number(item.quantidade || 0) * fator, item.unidade, materia.unidade);
      const chave = String(materia._id);
      const atual = mapa.get(chave) || {
        materiaPrima: materia._id,
        nome: materia.nome,
        unidade: materia.unidade,
        estoqueAtual: Number(materia.estoqueAtual || 0),
        necessario: 0,
      };
      atual.necessario = arredondar(atual.necessario + necessario);
      mapa.set(chave, atual);
    }
  }

  return [...mapa.values()].map((item) => ({
    ...item,
    falta: arredondar(Math.max(item.necessario - item.estoqueAtual, 0)),
    suficiente: item.estoqueAtual + 1e-9 >= item.necessario,
  })).sort((a, b) => Number(b.falta) - Number(a.falta) || a.nome.localeCompare(b.nome));
}

async function sugerir({ empresa, dataPlanejada, diasHistorico = 28, diasCobertura = 1 } = {}) {
  const alvo = inicioDoDia(dataPlanejada || new Date());
  const historico = Math.min(Math.max(Number(diasHistorico) || 28, 7), 180);
  const cobertura = Math.min(Math.max(Number(diasCobertura) || 1, 0.5), 14);
  const ate = fimDoDia(new Date(alvo.getTime() - 24 * 60 * 60 * 1000));
  const desde = inicioDoDia(new Date(ate.getTime() - (historico - 1) * 24 * 60 * 60 * 1000));

  const [vendas, produtos, ordensAtivas] = await Promise.all([
    vendasHistoricas({ empresa, desde, ate }),
    Produto.find({ ...(empresa ? { empresa } : {}), ativo: { $ne: false } })
      .select("nome sku estoque preco custo unidadeMedida")
      .sort({ nome: 1 }).lean(),
    OrdemProducao.find({
      ...(empresa ? { empresa } : {}),
      status: { $in: ["aberta", "em_producao"] },
      dataPlanejada: { $gte: inicioDoDia(alvo), $lte: fimDoDia(alvo) },
    }).select("produto quantidadePlanejada").lean(),
  ]);

  const vendasMap = new Map(vendas.map((item) => [String(item._id), item]));
  const ordensMap = new Map();
  for (const ordem of ordensAtivas) {
    const chave = String(ordem.produto);
    ordensMap.set(chave, (ordensMap.get(chave) || 0) + Number(ordem.quantidadePlanejada || 0));
  }

  const sugestoes = produtos.map((produto) => {
    const venda = vendasMap.get(String(produto._id)) || { quantidade: 0, diasComVenda: 0 };
    const mediaDiaria = arredondar(Number(venda.quantidade || 0) / historico, 3);
    const demandaProjetada = arredondar(mediaDiaria * cobertura, 2);
    const estoqueAtual = Number(produto.estoque || 0);
    const jaPlanejado = arredondar(ordensMap.get(String(produto._id)) || 0, 2);
    const quantidadeSugerida = Math.max(Math.ceil(demandaProjetada - estoqueAtual - jaPlanejado), 0);
    const confianca = Math.min(Math.round((Number(venda.diasComVenda || 0) / Math.min(historico, 28)) * 100), 100);

    return {
      produtoId: produto._id,
      nome: produto.nome,
      sku: produto.sku || "",
      unidade: produto.unidadeMedida || "UN",
      estoqueAtual,
      jaPlanejado,
      vendidoNoPeriodo: arredondar(venda.quantidade || 0, 2),
      mediaDiaria,
      demandaProjetada,
      quantidadeSugerida,
      confianca,
      motivo: quantidadeSugerida > 0
        ? `Demanda projetada de ${demandaProjetada}; estoque e ordens somam ${arredondar(estoqueAtual + jaPlanejado, 2)}.`
        : "Estoque e ordens existentes atendem à demanda projetada.",
    };
  }).filter((item) => item.vendidoNoPeriodo > 0 || item.quantidadeSugerida > 0)
    .sort((a, b) => b.quantidadeSugerida - a.quantidadeSugerida || b.vendidoNoPeriodo - a.vendidoNoPeriodo);

  const necessidades = await montarNecessidades(sugestoes);
  return {
    dataPlanejada: alvo,
    periodoHistorico: { desde, ate, dias: historico },
    diasCobertura: cobertura,
    sugestoes,
    necessidades,
    podeProduzirTudo: necessidades.every((item) => item.suficiente),
    totalProdutosSugeridos: sugestoes.filter((item) => item.quantidadeSugerida > 0).length,
  };
}

async function criarOrdens({ empresa, usuario, dataPlanejada, itens } = {}) {
  if (!Array.isArray(itens) || !itens.length) throw criarErro("Selecione ao menos um produto para planejar.");
  const data = dataPlanejada ? new Date(dataPlanejada) : new Date();
  const criadas = [];

  for (const item of itens) {
    const quantidade = Number(item.quantidade);
    if (!item.produto || !(quantidade > 0)) continue;
    const ordem = await OrdemProducaoService.criar({
      empresa,
      usuario,
      dados: {
        produto: item.produto,
        quantidadePlanejada: quantidade,
        dataPlanejada: data,
        responsavel: item.responsavel || "",
        prioridade: Number(item.prioridade || 0),
        observacoes: "Criada pelo Planejamento Inteligente de Produção.",
      },
    });
    criadas.push(ordem);
  }

  if (!criadas.length) throw criarErro("Nenhuma ordem válida foi informada.");
  return criadas;
}

module.exports = { sugerir, criarOrdens };
