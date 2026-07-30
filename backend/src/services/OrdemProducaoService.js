const mongoose = require("mongoose");
const OrdemProducao = require("../models/ordemproducao");
const Produto = require("../models/produto");
const FichaTecnica = require("../models/fichatecnica");
const MateriaPrima = require("../models/materiaprima");
const CmvProducao = require("../models/cmvproducao");

const TRANSICOES = {
  aberta: ["em_producao", "cancelada"],
  em_producao: ["concluida", "cancelada"],
  concluida: [],
  cancelada: [],
};

const { arredondar, converter } = require("./ProducaoCalculoService");

function erro(mensagem, statusCode = 400) {
  const error = new Error(mensagem);
  error.statusCode = statusCode;
  return error;
}

function usuarioNome(usuario) {
  return usuario?.nome || usuario?.email || "Sistema";
}

function gerarCodigo() {
  const agora = new Date();
  const data = agora.toISOString().slice(0, 10).replace(/-/g, "");
  return `OP-${data}-${`${agora.getTime()}`.slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
}

function gerarLote(ordem) {
  const data = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const sufixo = String(ordem.codigo || ordem._id).replace(/[^A-Z0-9]/gi, "").slice(-8).toUpperCase();
  return `PRD-${data}-${sufixo}`;
}


async function listar({ empresa, status, busca, limite = 100 } = {}) {
  const filtro = {};
  if (empresa) filtro.empresa = empresa;
  if (status) filtro.status = status;

  if (busca) {
    const produtos = await Produto.find({ nome: { $regex: busca, $options: "i" } }).select("_id").lean();
    filtro.$or = [
      { codigo: { $regex: busca, $options: "i" } },
      { responsavel: { $regex: busca, $options: "i" } },
      { loteProducao: { $regex: busca, $options: "i" } },
      { produto: { $in: produtos.map((produto) => produto._id) } },
    ];
  }

  return OrdemProducao.find(filtro)
    .populate("produto", "nome sku estoque preco custo foto")
    .populate("fichaTecnica", "rendimento unidadeRendimento custoUnitario")
    .sort({ prioridade: -1, createdAt: -1 })
    .limit(Math.min(Math.max(Number(limite) || 100, 1), 300))
    .lean();
}

async function resumo({ empresa } = {}) {
  const dados = await OrdemProducao.aggregate([
    { $match: empresa ? { empresa } : {} },
    { $group: { _id: "$status", total: { $sum: 1 } } },
  ]);

  const saida = { aberta: 0, em_producao: 0, concluida: 0, cancelada: 0, totalAtivas: 0 };
  dados.forEach((item) => {
    if (item._id in saida) saida[item._id] = item.total;
  });
  saida.totalAtivas = saida.aberta + saida.em_producao;
  return saida;
}

async function buscarPorId(id, empresa, session = null) {
  const filtro = { _id: id };
  if (empresa) filtro.empresa = empresa;

  let consulta = OrdemProducao.findOne(filtro)
    .populate("produto", "nome sku estoque preco custo unidadeMedida")
    .populate("fichaTecnica")
    .populate("analiseInsumos.itens.materiaPrima", "nome unidade estoqueAtual")
    .populate("consumoRealizado.materiaPrima", "nome unidade");

  if (session) consulta = consulta.session(session);
  const ordem = await consulta;
  if (!ordem) throw erro("Ordem de produção não encontrada.", 404);
  return ordem;
}

async function montarAnalise(ordem, quantidadeReferencia, { session = null } = {}) {
  let fichaQuery = FichaTecnica.findById(ordem.fichaTecnica).populate("itens.materiaPrima");
  if (session) fichaQuery = fichaQuery.session(session);
  const ficha = await fichaQuery;
  if (!ficha || !ficha.ativa) throw erro("O produto não possui ficha técnica ativa.", 409);

  const rendimento = Number(ficha.rendimento || 1);
  if (!(rendimento > 0)) throw erro("A ficha técnica possui rendimento inválido.", 409);
  const fator = Number(quantidadeReferencia) / rendimento;

  let reservasQuery = OrdemProducao.find({
    _id: { $ne: ordem._id },
    reservaAtiva: true,
    status: "em_producao",
  }).select("analiseInsumos.itens").lean();
  if (session) reservasQuery = reservasQuery.session(session);
  const reservas = await reservasQuery;

  const mapaReservas = {};
  for (const reserva of reservas) {
    for (const item of reserva.analiseInsumos?.itens || []) {
      const chave = String(item.materiaPrima);
      mapaReservas[chave] = (mapaReservas[chave] || 0) + Number(item.necessario || 0);
    }
  }

  const itens = ficha.itens.map((item) => {
    const materia = item.materiaPrima;
    if (!materia) throw erro("A ficha técnica possui ingrediente removido ou inválido.", 409);

    const necessario = converter(Number(item.quantidade || 0) * fator, item.unidade, materia.unidade);
    const reservadoOutrasOrdens = arredondar(mapaReservas[String(materia._id)] || 0);
    const estoqueAtual = arredondar(materia.estoqueAtual || 0);
    const disponivel = arredondar(Math.max(estoqueAtual - reservadoOutrasOrdens, 0));
    const falta = arredondar(Math.max(necessario - disponivel, 0));

    return {
      materiaPrima: materia._id,
      nome: materia.nome,
      unidade: materia.unidade,
      necessario,
      estoqueAtual,
      reservadoOutrasOrdens,
      disponivel,
      falta,
      suficiente: falta <= 1e-9,
    };
  });

  return {
    analisadaEm: new Date(),
    podeProduzir: itens.every((item) => item.suficiente),
    itens,
  };
}

async function analisarInsumos(id, empresa, { salvar = true } = {}) {
  const ordem = await OrdemProducao.findOne({ _id: id, ...(empresa ? { empresa } : {}) });
  if (!ordem) throw erro("Ordem de produção não encontrada.", 404);

  const analise = await montarAnalise(ordem, ordem.quantidadePlanejada);
  if (salvar) {
    ordem.analiseInsumos = analise;
    await ordem.save();
  }
  return analise;
}

async function criar({ dados, empresa, usuario } = {}) {
  const quantidade = Number(dados.quantidadePlanejada);
  if (!dados.produto || !Number.isFinite(quantidade) || quantidade <= 0) {
    throw erro("Selecione o produto e informe uma quantidade maior que zero.");
  }

  const produto = await Produto.findById(dados.produto);
  if (!produto) throw erro("Produto não encontrado.", 404);
  const ficha = await FichaTecnica.findOne({ produto: produto._id, ativa: true }).sort({ updatedAt: -1 });

  const ordem = await OrdemProducao.create({
    empresa: empresa || produto.empresa || null,
    codigo: gerarCodigo(),
    produto: produto._id,
    fichaTecnica: ficha?._id || null,
    quantidadePlanejada: quantidade,
    unidade: dados.unidade || ficha?.unidadeRendimento || "UN",
    responsavel: String(dados.responsavel || "").trim(),
    prioridade: Math.min(Math.max(Number(dados.prioridade) || 0, 0), 10),
    dataPlanejada: dados.dataPlanejada || null,
    observacoes: String(dados.observacoes || "").trim(),
    historico: [{
      usuario: usuarioNome(usuario),
      acao: "ordem_criada",
      statusNovo: "aberta",
      observacao: "Ordem de produção criada.",
    }],
  });

  return buscarPorId(ordem._id, empresa);
}

async function atualizar(id, dados, empresa, usuario) {
  const ordem = await buscarPorId(id, empresa);
  if (["concluida", "cancelada"].includes(ordem.status)) {
    throw erro("Ordens concluídas ou canceladas não podem ser editadas.", 409);
  }

  if (dados.quantidadePlanejada !== undefined) {
    const quantidade = Number(dados.quantidadePlanejada);
    if (quantidade <= 0) throw erro("A quantidade deve ser maior que zero.");
    ordem.quantidadePlanejada = quantidade;
    ordem.analiseInsumos = undefined;
    ordem.reservaAtiva = false;
  }

  ["responsavel", "unidade", "observacoes"].forEach((campo) => {
    if (dados[campo] !== undefined) ordem[campo] = String(dados[campo] || "").trim();
  });

  if (dados.prioridade !== undefined) {
    ordem.prioridade = Math.min(Math.max(Number(dados.prioridade) || 0, 0), 10);
  }
  if (dados.dataPlanejada !== undefined) ordem.dataPlanejada = dados.dataPlanejada || null;

  ordem.historico.push({
    usuario: usuarioNome(usuario),
    acao: "ordem_editada",
    statusNovo: ordem.status,
    observacao: "Dados atualizados.",
  });
  await ordem.save();
  return buscarPorId(ordem._id, empresa);
}

function consumirLotes(materia, quantidade) {
  if (!materia.controlaLote || !Array.isArray(materia.lotes) || !materia.lotes.length) return [];

  let restante = arredondar(quantidade);
  const consumidos = [];
  const ordenados = [...materia.lotes]
    .filter((lote) => Number(lote.quantidade || 0) > 0)
    .sort((a, b) => {
      const validadeA = a.validade ? new Date(a.validade).getTime() : Number.MAX_SAFE_INTEGER;
      const validadeB = b.validade ? new Date(b.validade).getTime() : Number.MAX_SAFE_INTEGER;
      if (validadeA !== validadeB) return validadeA - validadeB;
      return new Date(a.criadoEm || 0).getTime() - new Date(b.criadoEm || 0).getTime();
    });

  for (const loteOrdenado of ordenados) {
    if (restante <= 1e-9) break;
    const lote = materia.lotes.id(loteOrdenado._id);
    const disponivel = Number(lote.quantidade || 0);
    const retirado = arredondar(Math.min(disponivel, restante));
    lote.quantidade = arredondar(disponivel - retirado);
    restante = arredondar(restante - retirado);
    consumidos.push({ codigo: lote.codigo || "", validade: lote.validade || null, quantidade: retirado });
  }

  if (restante > 1e-9) {
    throw erro(`Os lotes do ingrediente ${materia.nome} não possuem saldo suficiente.`, 409);
  }

  return consumidos;
}

async function concluirProducao(id, dados, empresa, usuario) {
  const quantidadeProduzida = Number(dados.quantidadeProduzida);
  if (!Number.isFinite(quantidadeProduzida) || quantidadeProduzida <= 0) {
    throw erro("Informe uma quantidade produzida maior que zero.");
  }

  const session = await mongoose.startSession();
  let ordemId;

  try {
    await session.withTransaction(async () => {
      const filtro = { _id: id, status: "em_producao", conclusaoProcessada: false };
      if (empresa) filtro.empresa = empresa;

      const ordem = await OrdemProducao.findOne(filtro).session(session);
      if (!ordem) {
        const existente = await OrdemProducao.findById(id).session(session);
        if (existente?.conclusaoProcessada || existente?.status === "concluida") {
          throw erro("Esta ordem já teve a conclusão processada.", 409);
        }
        throw erro("A ordem precisa estar em produção para ser concluída.", 409);
      }

      const analise = await montarAnalise(ordem, quantidadeProduzida, { session });
      if (!analise.podeProduzir) {
        const faltantes = analise.itens
          .filter((item) => !item.suficiente)
          .map((item) => `${item.nome}: falta ${item.falta} ${item.unidade}`)
          .join("; ");
        throw erro(`Conclusão bloqueada por estoque insuficiente. ${faltantes}`, 409);
      }

      const agora = new Date();
      const loteProducao = gerarLote(ordem);
      const consumoRealizado = [];
      let custoTotalProducao = 0;

      for (const item of analise.itens) {
        const materia = await MateriaPrima.findById(item.materiaPrima).session(session);
        if (!materia) throw erro(`Ingrediente ${item.nome} não foi encontrado.`, 409);

        const quantidade = arredondar(item.necessario);
        const saldoAnterior = arredondar(materia.estoqueAtual || 0);
        if (saldoAnterior + 1e-9 < quantidade) {
          throw erro(`Estoque insuficiente para ${materia.nome}.`, 409);
        }

        const lotesConsumidos = consumirLotes(materia, quantidade);
        const saldoPosterior = arredondar(saldoAnterior - quantidade);
        const custoUnitario = arredondar(materia.custoUnitario || 0);
        const custoTotal = arredondar(quantidade * custoUnitario);

        materia.estoqueAtual = saldoPosterior;
        materia.movimentacoes.push({
          tipo: "saida",
          quantidade,
          saldoAnterior,
          saldoPosterior,
          custoUnitario,
          motivo: `Consumo na produção ${ordem.codigo}`,
          documento: ordem.codigo,
          lote: lotesConsumidos.map((lote) => lote.codigo).filter(Boolean).join(", "),
          realizadoPor: usuarioNome(usuario),
          data: agora,
        });
        materia.movimentacoes = materia.movimentacoes.slice(-200);
        await materia.save({ session });

        custoTotalProducao = arredondar(custoTotalProducao + custoTotal);
        consumoRealizado.push({
          materiaPrima: materia._id,
          nome: materia.nome,
          unidade: materia.unidade,
          quantidade,
          custoUnitario,
          custoTotal,
          saldoAnterior,
          saldoPosterior,
          lotesConsumidos,
        });
      }

      const produto = await Produto.findById(ordem.produto).session(session);
      if (!produto) throw erro("O produto acabado não foi encontrado.", 409);

      const estoqueProdutoAntes = arredondar(produto.estoque || 0);
      const estoqueProdutoDepois = arredondar(estoqueProdutoAntes + quantidadeProduzida);
      const custoUnitarioProducao = arredondar(custoTotalProducao / quantidadeProduzida);
      const valorEstoqueAnterior = estoqueProdutoAntes * Number(produto.custo || 0);
      const novoCustoMedio = estoqueProdutoDepois > 0
        ? arredondar((valorEstoqueAnterior + custoTotalProducao) / estoqueProdutoDepois)
        : custoUnitarioProducao;

      produto.estoque = estoqueProdutoDepois;
      produto.custo = novoCustoMedio;
      produto.lucro = arredondar(Number(produto.preco || 0) - novoCustoMedio);
      produto.margem = Number(produto.preco || 0) > 0
        ? arredondar((produto.lucro / Number(produto.preco)) * 100, 4)
        : 0;
      produto.movimentacoes.push({
        tipo: "producao",
        quantidade: quantidadeProduzida,
        saldoAnterior: estoqueProdutoAntes,
        saldoPosterior: estoqueProdutoDepois,
        custoUnitario: custoUnitarioProducao,
        documento: ordem.codigo,
        lote: loteProducao,
        realizadoPor: usuarioNome(usuario),
        motivo: `Entrada por conclusão da ordem ${ordem.codigo}`,
        data: agora,
      });
      produto.movimentacoes = produto.movimentacoes.slice(-300);
      await produto.save({ session });

      const precoVendaUnitario = arredondar(produto.preco || 0);
      const valorVendaPotencial = arredondar(precoVendaUnitario * quantidadeProduzida);
      const lucroBrutoPotencial = arredondar(valorVendaPotencial - custoTotalProducao);
      const margemBrutaPotencial = valorVendaPotencial > 0
        ? arredondar((lucroBrutoPotencial / valorVendaPotencial) * 100, 4)
        : 0;

      await CmvProducao.create([{
        empresa: ordem.empresa || empresa || produto.empresa || null,
        ordem: ordem._id,
        produto: produto._id,
        codigoOrdem: ordem.codigo,
        loteProducao,
        quantidadeProduzida,
        custoTotal: custoTotalProducao,
        custoUnitario: custoUnitarioProducao,
        precoVendaUnitario,
        valorVendaPotencial,
        lucroBrutoPotencial,
        margemBrutaPotencial,
        responsavel: usuarioNome(usuario),
        dataProducao: agora,
      }], { session });

      ordem.quantidadeProduzida = quantidadeProduzida;
      ordem.concluidaEm = agora;
      ordem.status = "concluida";
      ordem.reservaAtiva = false;
      ordem.conclusaoProcessada = true;
      ordem.loteProducao = loteProducao;
      ordem.custoTotalProducao = custoTotalProducao;
      ordem.custoUnitarioProducao = custoUnitarioProducao;
      ordem.estoqueProdutoAntes = estoqueProdutoAntes;
      ordem.estoqueProdutoDepois = estoqueProdutoDepois;
      ordem.analiseInsumos = analise;
      ordem.consumoRealizado = consumoRealizado;
      ordem.historico.push({
        usuario: usuarioNome(usuario),
        acao: "producao_concluida",
        statusAnterior: "em_producao",
        statusNovo: "concluida",
        observacao: `Produção concluída. Lote ${loteProducao}. ${quantidadeProduzida} ${ordem.unidade} adicionados ao estoque.`,
      });
      await ordem.save({ session });
      ordemId = ordem._id;
    });
  } catch (error) {
    if (String(error.message || "").includes("Transaction numbers are only allowed")) {
      throw erro("O banco de dados precisa estar em replica set para concluir a produção com segurança transacional.", 503);
    }
    throw error;
  } finally {
    await session.endSession();
  }

  return buscarPorId(ordemId, empresa);
}

async function alterarStatus(id, novoStatus, dados, empresa, usuario) {
  const ordem = await buscarPorId(id, empresa);
  const destino = String(novoStatus || "").toLowerCase();

  if (!TRANSICOES[ordem.status]?.includes(destino)) {
    throw erro("Transição de status não permitida.", 409);
  }

  if (destino === "concluida") {
    return concluirProducao(id, dados, empresa, usuario);
  }

  const statusAnterior = ordem.status;
  const agora = new Date();

  if (destino === "em_producao") {
    const analise = await analisarInsumos(ordem._id, empresa);
    if (!analise.podeProduzir) throw erro("Produção bloqueada: há ingredientes insuficientes.", 409);
    ordem.analiseInsumos = analise;
    ordem.reservaAtiva = true;
    ordem.reservadoEm = agora;
    ordem.iniciadaEm = agora;
  }

  if (destino === "cancelada") {
    const motivo = String(dados.motivoCancelamento || "").trim();
    if (!motivo) throw erro("Informe o motivo do cancelamento.");
    ordem.motivoCancelamento = motivo;
    ordem.canceladaEm = agora;
    ordem.reservaAtiva = false;
  }

  ordem.status = destino;
  ordem.historico.push({
    usuario: usuarioNome(usuario),
    acao: destino === "cancelada" ? "ordem_cancelada" : "status_alterado",
    statusAnterior,
    statusNovo: destino,
    observacao: destino === "em_producao"
      ? "Insumos conferidos e reservados."
      : String(dados.observacao || ordem.motivoCancelamento || ""),
  });
  await ordem.save();
  return buscarPorId(ordem._id, empresa);
}

async function indicadoresGerenciais({ empresa, dias = 30, limite = 12 } = {}) {
  const quantidadeDias = Math.min(Math.max(Number(dias) || 30, 1), 365);
  const desde = new Date();
  desde.setDate(desde.getDate() - quantidadeDias);

  const filtro = { dataProducao: { $gte: desde } };
  if (empresa) filtro.empresa = empresa;

  const [totais, recentes, porProduto] = await Promise.all([
    CmvProducao.aggregate([
      { $match: filtro },
      { $group: {
        _id: null,
        ordensConcluidas: { $sum: 1 },
        unidadesProduzidas: { $sum: "$quantidadeProduzida" },
        cmvProduzido: { $sum: "$custoTotal" },
        valorVendaPotencial: { $sum: "$valorVendaPotencial" },
        lucroBrutoPotencial: { $sum: "$lucroBrutoPotencial" },
      } },
    ]),
    CmvProducao.find(filtro)
      .populate("produto", "nome sku")
      .sort({ dataProducao: -1 })
      .limit(Math.min(Math.max(Number(limite) || 12, 1), 50))
      .lean(),
    CmvProducao.aggregate([
      { $match: filtro },
      { $group: {
        _id: "$produto",
        quantidadeProduzida: { $sum: "$quantidadeProduzida" },
        custoTotal: { $sum: "$custoTotal" },
        lucroBrutoPotencial: { $sum: "$lucroBrutoPotencial" },
      } },
      { $sort: { custoTotal: -1 } },
      { $limit: 5 },
      { $lookup: { from: "produtos", localField: "_id", foreignField: "_id", as: "produto" } },
      { $unwind: { path: "$produto", preserveNullAndEmptyArrays: true } },
      { $project: {
        _id: 0, produtoId: "$_id", nome: { $ifNull: ["$produto.nome", "Produto removido"] },
        quantidadeProduzida: 1, custoTotal: 1, lucroBrutoPotencial: 1,
      } },
    ]),
  ]);

  const base = totais[0] || {};
  const cmvProduzido = arredondar(base.cmvProduzido || 0, 2);
  const valorVendaPotencial = arredondar(base.valorVendaPotencial || 0, 2);
  const lucroBrutoPotencial = arredondar(base.lucroBrutoPotencial || 0, 2);

  return {
    periodoDias: quantidadeDias,
    ordensConcluidas: Number(base.ordensConcluidas || 0),
    unidadesProduzidas: arredondar(base.unidadesProduzidas || 0, 2),
    cmvProduzido,
    valorVendaPotencial,
    lucroBrutoPotencial,
    margemBrutaPotencial: valorVendaPotencial > 0
      ? arredondar((lucroBrutoPotencial / valorVendaPotencial) * 100, 2)
      : 0,
    recentes,
    porProduto,
  };
}

module.exports = {
  listar,
  resumo,
  buscarPorId,
  criar,
  atualizar,
  alterarStatus,
  analisarInsumos,
  concluirProducao,
  indicadoresGerenciais,
};
