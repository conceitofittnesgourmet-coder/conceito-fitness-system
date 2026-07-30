const FichaTecnica = require("../models/fichatecnica");
const MateriaPrima = require("../models/materiaprima");
const Produto = require("../models/produto");

const FATORES = {
  kg: { base: "massa", fator: 1000 }, g: { base: "massa", fator: 1 },
  litro: { base: "volume", fator: 1000 }, l: { base: "volume", fator: 1000 }, ml: { base: "volume", fator: 1 },
  unidade: { base: "unidade", fator: 1 }, un: { base: "unidade", fator: 1 },
  pacote: { base: "pacote", fator: 1 }, caixa: { base: "caixa", fator: 1 },
};

function normalizarUnidade(valor) {
  return String(valor || "unidade").trim().toLowerCase();
}

function converterQuantidade(quantidade, unidadeOrigem, unidadeDestino) {
  const origem = FATORES[normalizarUnidade(unidadeOrigem)];
  const destino = FATORES[normalizarUnidade(unidadeDestino)];
  if (!origem || !destino || origem.base !== destino.base) {
    throw new Error(`Conversão incompatível: ${unidadeOrigem} para ${unidadeDestino}`);
  }
  return (Number(quantidade) * origem.fator) / destino.fator;
}

async function calcularItens(itens = []) {
  const ids = [...new Set(itens.map((i) => String(i?.materiaPrima || "")).filter(Boolean))];
  const materias = await MateriaPrima.find({ _id: { $in: ids } });
  const mapa = new Map(materias.map((m) => [String(m._id), m]));
  const calculados = [];
  let custoTotal = 0;

  for (const item of itens) {
    const materia = mapa.get(String(item?.materiaPrima || ""));
    if (!materia) throw new Error("Um dos ingredientes informados não foi encontrado.");
    const quantidade = Number(item.quantidade || 0);
    if (quantidade <= 0) continue;
    const unidade = normalizarUnidade(item.unidade || materia.unidade);
    const quantidadeConvertida = converterQuantidade(quantidade, unidade, materia.unidade);
    const custoUnitarioAplicado = Number(materia.custoUnitario || 0);
    const custo = quantidadeConvertida * custoUnitarioAplicado;
    custoTotal += custo;
    calculados.push({
      materiaPrima: materia._id,
      quantidade,
      unidade,
      quantidadeConvertida,
      custoUnitarioAplicado,
      custo,
    });
  }
  return { itens: calculados, custoTotal };
}

async function calcularVariacoes(variacoes = []) {
  const calculadas = [];
  let custoVariacoes = 0;
  for (const variacao of variacoes) {
    if (!variacao?.grupoComponente || !variacao?.opcaoComponente) continue;
    const calculo = await calcularItens(variacao.itens || []);
    custoVariacoes += calculo.custoTotal;
    calculadas.push({
      grupoComponente: variacao.grupoComponente,
      opcaoComponente: variacao.opcaoComponente,
      nomeGrupo: variacao.nomeGrupo || "",
      nomeOpcao: variacao.nomeOpcao || "",
      itens: calculo.itens,
      custoTotal: calculo.custoTotal,
      ativa: variacao.ativa !== false,
    });
  }
  return { variacoes: calculadas, custoVariacoes };
}

function indicadores({ custoBase, perdaPercentual, rendimento, precoVenda, custoVariacoes = 0 }) {
  const fatorPerda = 1 - (Number(perdaPercentual || 0) / 100);
  const custoComPerda = fatorPerda > 0 ? custoBase / fatorPerda : custoBase;
  const custoTotal = custoComPerda + custoVariacoes;
  const custoUnitario = custoComPerda / Math.max(Number(rendimento || 1), 0.0001);
  const lucroUnitario = Number(precoVenda || 0) - custoUnitario;
  const margemPercentual = Number(precoVenda || 0) > 0 ? (lucroUnitario / Number(precoVenda)) * 100 : 0;
  const markup = custoUnitario > 0 ? Number(precoVenda || 0) / custoUnitario : 0;
  return { custoComPerda, custoTotal, custoUnitario, lucroUnitario, margemPercentual, markup };
}

function popular(query) {
  return query.populate("produto").populate("itens.materiaPrima")
    .populate("variacoes.grupoComponente").populate("variacoes.opcaoComponente")
    .populate("variacoes.itens.materiaPrima");
}

exports.listar = async (_req, res) => {
  try {
    const fichas = await popular(FichaTecnica.find({ ativa: true }).sort({ updatedAt: -1 }));
    return res.json({ success: true, fichas });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.buscarPorProduto = async (req, res) => {
  try {
    const ficha = await popular(FichaTecnica.findOne({ produto: req.params.produtoId, ativa: true }));
    return res.json({ success: true, ficha });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.criarOuAtualizar = async (req, res) => {
  try {
    const { produto, itens = [], variacoes = [], rendimento = 1, unidadeRendimento = "UN", perdaPercentual = 0, modoPreparo = "", observacao = "", ativa = true } = req.body || {};
    if (!produto) return res.status(400).json({ success: false, message: "Produto é obrigatório." });
    const produtoDoc = await Produto.findById(produto);
    if (!produtoDoc) return res.status(404).json({ success: false, message: "Produto não encontrado." });
    if (Number(rendimento) <= 0) return res.status(400).json({ success: false, message: "O rendimento deve ser maior que zero." });

    const base = await calcularItens(itens);
    const vars = await calcularVariacoes(variacoes);
    const precoVenda = Number(produtoDoc.preco || 0);
    const calculados = indicadores({ custoBase: base.custoTotal, perdaPercentual, rendimento, precoVenda, custoVariacoes: vars.custoVariacoes });
    const usuario = String(req.admin?.nome || req.admin?.email || req.admin?.id || "Administrador");

    let ficha = await FichaTecnica.findOne({ produto, ativa: true });
    const fichaNova = !ficha;
    if (!ficha) ficha = new FichaTecnica({ produto });
    Object.assign(ficha, {
      itens: base.itens, variacoes: vars.variacoes, rendimento: Number(rendimento), unidadeRendimento,
      perdaPercentual: Number(perdaPercentual || 0), custoBase: base.custoTotal,
      custoVariacoes: vars.custoVariacoes, precoVenda, modoPreparo, observacao, ativa, ...calculados,
    });
    ficha.historico.push({ usuario, acao: fichaNova ? "criar" : "atualizar", custoBase: base.custoTotal, custoUnitario: calculados.custoUnitario, rendimento: Number(rendimento) });
    if (ficha.historico.length > 50) ficha.historico = ficha.historico.slice(-50);
    await ficha.save();

    produtoDoc.custo = calculados.custoUnitario;
    produtoDoc.lucro = calculados.lucroUnitario;
    produtoDoc.margem = calculados.margemPercentual;
    produtoDoc.cadastroMestre = produtoDoc.cadastroMestre || {};
    produtoDoc.cadastroMestre.producao = { ...(produtoDoc.cadastroMestre.producao?.toObject?.() || produtoDoc.cadastroMestre.producao || {}), controlaProducao: true, rendimentoPadrao: Number(rendimento), unidadeRendimento, perdaPercentual: Number(perdaPercentual || 0) };
    await produtoDoc.save();

    const completa = await popular(FichaTecnica.findById(ficha._id));
    return res.status(fichaNova ? 201 : 200).json({ success: true, message: "Ficha técnica salva e CMV do produto atualizado.", ficha: completa });
  } catch (error) {
    const status = /Conversão incompatível|rendimento|ingrediente/i.test(error.message) ? 400 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

exports.recalcular = async (req, res) => {
  try {
    const filtro = req.params.id ? { _id: req.params.id, ativa: true } : { ativa: true };
    const fichas = await FichaTecnica.find(filtro).populate("produto");
    let atualizadas = 0;
    for (const ficha of fichas) {
      const base = await calcularItens(ficha.itens || []);
      const vars = await calcularVariacoes(ficha.variacoes || []);
      const precoVenda = Number(ficha.produto?.preco || ficha.precoVenda || 0);
      const calc = indicadores({ custoBase: base.custoTotal, perdaPercentual: ficha.perdaPercentual, rendimento: ficha.rendimento, precoVenda, custoVariacoes: vars.custoVariacoes });
      Object.assign(ficha, { itens: base.itens, variacoes: vars.variacoes, custoBase: base.custoTotal, custoVariacoes: vars.custoVariacoes, precoVenda, ...calc });
      ficha.historico.push({ usuario: String(req.admin?.nome || req.admin?.email || "Administrador"), acao: "recalcular", custoBase: base.custoTotal, custoUnitario: calc.custoUnitario, rendimento: ficha.rendimento });
      if (ficha.historico.length > 50) ficha.historico = ficha.historico.slice(-50);
      await ficha.save();
      if (ficha.produto?._id) await Produto.findByIdAndUpdate(ficha.produto._id, { custo: calc.custoUnitario, lucro: calc.lucroUnitario, margem: calc.margemPercentual });
      atualizadas += 1;
    }
    return res.json({ success: true, message: `${atualizadas} ficha(s) recalculada(s).`, atualizadas });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.excluir = async (req, res) => {
  try {
    const ficha = await FichaTecnica.findByIdAndUpdate(req.params.id, { ativa: false }, { new: true });
    if (!ficha) return res.status(404).json({ success: false, message: "Ficha técnica não encontrada." });
    return res.json({ success: true, message: "Ficha técnica desativada." });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
