const MateriaPrima = require("../models/materiaprima");

const numero = (valor, padrao = 0) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : padrao;
};

const usuarioAtual = (req) => req.user?.nome || req.admin?.nome || req.body?.realizadoPor || "Sistema";

function diagnostico(materia) {
  const pendencias = [];
  if (!materia.codigo) pendencias.push("Código interno");
  if (!materia.categoria) pendencias.push("Categoria");
  if (!materia.unidade) pendencias.push("Unidade");
  if (!(materia.custoUnitario > 0)) pendencias.push("Custo");
  if (!materia.fornecedor && !materia.fornecedorPrincipal) pendencias.push("Fornecedor");
  if (materia.controlaValidade && !materia.lotes?.some((lote) => lote.validade)) pendencias.push("Validade/lote");
  const totalCampos = 6;
  const percentual = Math.max(0, Math.round(((totalCampos - pendencias.length) / totalCampos) * 100));
  return { percentual, pendencias, status: percentual === 100 ? "completo" : percentual >= 60 ? "atencao" : "incompleto" };
}

function validadeStatus(materia) {
  const hoje = new Date();
  const limite = new Date();
  limite.setDate(limite.getDate() + numero(materia.diasAlertaValidade, 7));
  const lotesAtivos = (materia.lotes || []).filter((lote) => numero(lote.quantidade) > 0 && lote.validade);
  return {
    vencidos: lotesAtivos.filter((lote) => new Date(lote.validade) < hoje).length,
    proximos: lotesAtivos.filter((lote) => new Date(lote.validade) >= hoje && new Date(lote.validade) <= limite).length,
  };
}

exports.listar = async (req, res) => {
  try {
    const { search = "", categoria = "todas", status = "todos", ativo = "todos" } = req.query;
    const filtro = {};
    if (search) filtro.$or = [
      { nome: { $regex: search, $options: "i" } },
      { codigo: { $regex: search, $options: "i" } },
      { codigoBarras: { $regex: search, $options: "i" } },
      { fornecedor: { $regex: search, $options: "i" } },
    ];
    if (categoria !== "todas") filtro.categoria = categoria;
    if (ativo !== "todos") filtro.ativo = ativo === "ativo";

    let materias = await MateriaPrima.find(filtro).sort({ nome: 1 }).lean();
    materias = materias.map((materia) => ({
      ...materia,
      diagnostico: diagnostico(materia),
      validade: validadeStatus(materia),
      abaixoMinimo: numero(materia.estoqueAtual) <= numero(materia.estoqueMinimo),
      valorEstoque: numero(materia.estoqueAtual) * numero(materia.custoUnitario),
    }));
    if (status !== "todos") materias = materias.filter((materia) => materia.diagnostico.status === status);

    const todas = await MateriaPrima.find().lean();
    const categorias = [...new Set(todas.map((item) => item.categoria).filter(Boolean))].sort();
    const resumo = {
      total: todas.length,
      ativos: todas.filter((item) => item.ativo).length,
      abaixoMinimo: todas.filter((item) => numero(item.estoqueAtual) <= numero(item.estoqueMinimo)).length,
      semCusto: todas.filter((item) => !(numero(item.custoUnitario) > 0)).length,
      valorEstoque: todas.reduce((soma, item) => soma + numero(item.estoqueAtual) * numero(item.custoUnitario), 0),
      vencidos: todas.reduce((soma, item) => soma + validadeStatus(item).vencidos, 0),
      proximosVencimento: todas.reduce((soma, item) => soma + validadeStatus(item).proximos, 0),
    };

    return res.json({ success: true, materias, categorias, resumo, alertas: materias.filter((m) => m.abaixoMinimo) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.buscarPorId = async (req, res) => {
  try {
    const materia = await MateriaPrima.findById(req.params.id).lean();
    if (!materia) return res.status(404).json({ success: false, message: "Ingrediente não encontrado." });
    return res.json({ success: true, materia: { ...materia, diagnostico: diagnostico(materia), validade: validadeStatus(materia) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.criar = async (req, res) => {
  try {
    if (!req.body.nome?.trim()) return res.status(400).json({ success: false, message: "Informe o nome do ingrediente." });
    const duplicado = await MateriaPrima.findOne({ nome: new RegExp(`^${req.body.nome.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    if (duplicado) return res.status(409).json({ success: false, message: "Já existe um ingrediente com esse nome." });
    const dados = { ...req.body, nome: req.body.nome.trim() };
    if (numero(dados.custoUnitario) > 0) {
      dados.ultimoCusto = numero(dados.custoUnitario);
      dados.historicoCustos = [{ custoAnterior: 0, custoNovo: numero(dados.custoUnitario), origem: "cadastro_inicial", alteradoPor: usuarioAtual(req) }];
    }
    const materia = await MateriaPrima.create(dados);
    return res.status(201).json({ success: true, materia });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const materia = await MateriaPrima.findById(req.params.id);
    if (!materia) return res.status(404).json({ success: false, message: "Ingrediente não encontrado." });
    const custoAnterior = numero(materia.custoUnitario);
    const custoNovo = req.body.custoUnitario === undefined ? custoAnterior : numero(req.body.custoUnitario);
    const camposPermitidos = [
  "nome",
  "codigo",
  "codigoBarras",
  "categoria",
  "unidade",
  "estoqueMinimo",
  "estoqueMaximo",
  "custoUnitario",
  "ultimoCusto",
  "fornecedor",
  "fornecedorPrincipal",
  "localizacao",
  "marca",
  "observacoes",
  "controlaLote",
  "controlaValidade",
  "diasAlertaValidade",
  "ativo",

  // Insumos / embalagens / materiais de consumo
  "tipoItem",
  "tamanho",
  "capacidade",
  "cor",
  "observacaoEstoque",
];
    camposPermitidos.forEach((campo) => { if (req.body[campo] !== undefined) materia[campo] = req.body[campo]; });
    if (custoNovo !== custoAnterior) {
      materia.ultimoCusto = custoNovo;
      materia.historicoCustos.push({ custoAnterior, custoNovo, origem: "ajuste_manual", observacao: req.body.observacaoCusto || "", alteradoPor: usuarioAtual(req) });
      materia.historicoCustos = materia.historicoCustos.slice(-100);
    }
    await materia.save();
    return res.json({ success: true, materia });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.movimentar = async (req, res) => {
  try {
    const materia = await MateriaPrima.findById(req.params.id);
    if (!materia) return res.status(404).json({ success: false, message: "Ingrediente não encontrado." });
    const tipo = req.body.tipo;
    const quantidade = numero(req.body.quantidade);
    if (!['entrada', 'saida', 'ajuste'].includes(tipo)) return res.status(400).json({ success: false, message: "Tipo de movimentação inválido." });
    if (quantidade < 0 || (tipo !== "ajuste" && quantidade <= 0)) return res.status(400).json({ success: false, message: "Informe uma quantidade válida." });

    const saldoAnterior = numero(materia.estoqueAtual);
    let saldoPosterior = saldoAnterior;
    if (tipo === "entrada") saldoPosterior += quantidade;
    if (tipo === "saida") saldoPosterior -= quantidade;
    if (tipo === "ajuste") saldoPosterior = quantidade;
    if (saldoPosterior < 0) return res.status(400).json({ success: false, message: "Estoque insuficiente para esta saída." });

    const custoEntrada = numero(req.body.custoUnitario, numero(materia.custoUnitario));
    if (tipo === "entrada" && custoEntrada > 0) {
      const valorAnterior = saldoAnterior * numero(materia.custoUnitario);
      const valorEntrada = quantidade * custoEntrada;
      const custoMedio = saldoPosterior > 0 ? (valorAnterior + valorEntrada) / saldoPosterior : custoEntrada;
      const custoAnterior = numero(materia.custoUnitario);
      materia.ultimoCusto = custoEntrada;
      materia.custoUnitario = Number(custoMedio.toFixed(6));
      if (materia.custoUnitario !== custoAnterior) {
        materia.historicoCustos.push({ custoAnterior, custoNovo: materia.custoUnitario, origem: "entrada_estoque", observacao: req.body.motivo || "Entrada de estoque", alteradoPor: usuarioAtual(req) });
      }
    }

    materia.estoqueAtual = saldoPosterior;
    materia.movimentacoes.push({
      tipo, quantidade, saldoAnterior, saldoPosterior,
      custoUnitario: custoEntrada, motivo: req.body.motivo || "", documento: req.body.documento || "",
      lote: req.body.lote || "", validade: req.body.validade || null, fornecedor: req.body.fornecedor || materia.fornecedor || "",
      realizadoPor: usuarioAtual(req),
    });
    materia.movimentacoes = materia.movimentacoes.slice(-200);

    if (tipo === "entrada" && (req.body.lote || req.body.validade) && quantidade > 0) {
      materia.lotes.push({ codigo: req.body.lote || "", validade: req.body.validade || null, quantidade, custoUnitario: custoEntrada, fornecedor: req.body.fornecedor || materia.fornecedor || "" });
      materia.lotes = materia.lotes.slice(-100);
    }
    materia.historicoCustos = materia.historicoCustos.slice(-100);
    await materia.save();
    return res.json({ success: true, message: "Movimentação registrada.", materia });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.excluir = async (req, res) => {
  try {
    const materia = await MateriaPrima.findById(req.params.id);
    if (!materia) return res.status(404).json({ success: false, message: "Ingrediente não encontrado." });
    if (numero(materia.estoqueAtual) > 0) return res.status(400).json({ success: false, message: "Não é possível excluir um ingrediente com estoque. Inative-o." });
    await materia.deleteOne();
    return res.json({ success: true, message: "Ingrediente excluído." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
