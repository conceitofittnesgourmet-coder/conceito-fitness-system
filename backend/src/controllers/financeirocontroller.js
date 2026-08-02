const ContaPagar = require("../models/contapagar");
const ContaReceber = require("../models/contareceber");
const MovimentacaoFinanceira = require("../models/movimentacaofinanceira");
const { inicioMesSaoPaulo, dataBrParaInicio, dataBrParaFim, filtroEmpresa } = require("../services/vendasMetricsService");

function atualizarStatusVencimento(conta) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const vencimento = new Date(conta.vencimento);
  vencimento.setHours(0, 0, 0, 0);

  if (
    conta.status === "pendente" &&
    vencimento < hoje
  ) {
    conta.status = "vencida";
  }

  return conta;
}

// ===============================
// DASHBOARD FINANCEIRO
// ===============================
exports.resumoFinanceiro = async (req, res) => {
  try {
    const {
  inicio,
  fim,
  busca = "",
  formaPagamento = "",
  tipo = "",
} = req.query;

const filtroData = { data: {} };

if (inicio || fim) {

  if (inicio) {
    filtroData.data.$gte = dataBrParaInicio(inicio);
  }

  if (fim) {
    filtroData.data.$lte = dataBrParaFim(fim);
  }
}
else {
  filtroData.data.$gte = inicioMesSaoPaulo(new Date());
  filtroData.data.$lte = new Date();
}

const filtroBusca = busca
  ? {
      $or: [
        { descricao: { $regex: busca, $options: "i" } },
        { categoria: { $regex: busca, $options: "i" } },
        { formaPagamento: { $regex: busca, $options: "i" } },
      ],
    }
  : {};

const empresa = filtroEmpresa(req);
const filtroMovimentacoes = {
  ...empresa,
  ...filtroData,
  ...filtroBusca,
};

if (formaPagamento) {
  filtroMovimentacoes.formaPagamento = formaPagamento;
}

if (tipo) {
  filtroMovimentacoes.tipo = tipo;
}

const contasPagar = await ContaPagar.find(empresa).sort({ vencimento: 1 });
const contasReceber = await ContaReceber.find(empresa).sort({ vencimento: 1 });

const movimentacoes = await MovimentacaoFinanceira.find(filtroMovimentacoes)
  .sort({ data: -1 })
  .limit(500);

    const pagarAtualizadas = contasPagar.map(atualizarStatusVencimento);
    const receberAtualizadas = contasReceber.map(atualizarStatusVencimento);

    const totalPagar = pagarAtualizadas
      .filter((c) => c.status !== "cancelada")
      .reduce((acc, c) => acc + Number(c.valor || 0), 0);

    const totalPago = pagarAtualizadas
      .filter((c) => c.status === "paga")
      .reduce((acc, c) => acc + Number(c.valor || 0), 0);

    const totalPagarPendente = pagarAtualizadas
      .filter((c) => c.status === "pendente" || c.status === "vencida")
      .reduce((acc, c) => acc + Number(c.valor || 0), 0);

    const totalReceber = receberAtualizadas
      .filter((c) => c.status !== "cancelada")
      .reduce((acc, c) => acc + Number(c.valor || 0), 0);

    const totalRecebido = receberAtualizadas
      .filter((c) => c.status === "recebida")
      .reduce((acc, c) => acc + Number(c.valor || 0), 0);

    const totalReceberPendente = receberAtualizadas
      .filter((c) => c.status === "pendente" || c.status === "vencida")
      .reduce((acc, c) => acc + Number(c.valor || 0), 0);

    const entradas = movimentacoes
      .filter((m) => m.tipo === "entrada")
      .reduce((acc, m) => acc + Number(m.valor || 0), 0);

    const saidas = movimentacoes
      .filter((m) => m.tipo === "saida")
      .reduce((acc, m) => acc + Number(m.valor || 0), 0);

    const saldo = entradas - saidas;
    const entradasPorForma = movimentacoes
  .filter((m) => m.tipo === "entrada")
  .reduce((acc, mov) => {
    const forma = mov.formaPagamento || "Não informado";
    acc[forma] = (acc[forma] || 0) + Number(mov.valor || 0);
    return acc;
  }, {});

const saidasPorForma = movimentacoes
  .filter((m) => m.tipo === "saida")
  .reduce((acc, mov) => {
    const forma = mov.formaPagamento || "Não informado";
    acc[forma] = (acc[forma] || 0) + Number(mov.valor || 0);
    return acc;
  }, {});

    return res.json({
      success: true,
      resumo: {
        totalPagar,
        totalPago,
        totalPagarPendente,
        totalReceber,
        totalRecebido,
        totalReceberPendente,
        entradas,
        saidas,
        saldo,
        entradasPorForma,
        saidasPorForma,
        lucroEstimado: totalRecebido - totalPago,
        quantidadeContasPagar: contasPagar.length,
        quantidadeContasReceber: contasReceber.length,
        quantidadeMovimentacoes: movimentacoes.length,
      },
      contasPagar: pagarAtualizadas,
      contasReceber: receberAtualizadas,
      movimentacoes,
    });
  } catch (error) {
    console.log("ERRO RESUMO FINANCEIRO:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// CONTAS A PAGAR
// ===============================
exports.criarContaPagar = async (req, res) => {
  try {
    const { descricao, valor, vencimento } = req.body;

    if (!descricao || !valor || !vencimento) {
      return res.status(400).json({
        success: false,
        message: "Descrição, valor e vencimento são obrigatórios.",
      });
    }

    const conta = await ContaPagar.create({
      ...req.body,
      valor: Number(valor),
    });

    return res.status(201).json({
      success: true,
      conta,
    });
  } catch (error) {
    console.log("ERRO CRIAR CONTA PAGAR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.pagarConta = async (req, res) => {
  try {
    const conta = await ContaPagar.findById(req.params.id);

    if (!conta) {
      return res.status(404).json({
        success: false,
        message: "Conta a pagar não encontrada.",
      });
    }

    conta.status = "paga";
    conta.dataPagamento = new Date();
    conta.formaPagamento = req.body.formaPagamento || conta.formaPagamento || "PIX";

    await conta.save();

    await MovimentacaoFinanceira.create({
      tipo: "saida",
      origem: "conta_pagar",
      descricao: `Pagamento: ${conta.descricao}`,
      categoria: conta.categoria || "Despesas",
      valor: Number(conta.valor || 0),
      formaPagamento: conta.formaPagamento,
      contaPagar: conta._id,
    });

    return res.json({
      success: true,
      conta,
    });
  } catch (error) {
    console.log("ERRO PAGAR CONTA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deletarContaPagar = async (req, res) => {
  try {
    const conta = await ContaPagar.findByIdAndUpdate(
      req.params.id,
      { status: "cancelada" },
      { new: true }
    );

    if (!conta) {
      return res.status(404).json({
        success: false,
        message: "Conta a pagar não encontrada.",
      });
    }

    return res.json({
      success: true,
      conta,
    });
  } catch (error) {
    console.log("ERRO CANCELAR CONTA PAGAR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// CONTAS A RECEBER
// ===============================
exports.criarContaReceber = async (req, res) => {
  try {
    const { descricao, valor, vencimento } = req.body;

    if (!descricao || !valor || !vencimento) {
      return res.status(400).json({
        success: false,
        message: "Descrição, valor e vencimento são obrigatórios.",
      });
    }

    const conta = await ContaReceber.create({
      ...req.body,
      valor: Number(valor),
    });

    return res.status(201).json({
      success: true,
      conta,
    });
  } catch (error) {
    console.log("ERRO CRIAR CONTA RECEBER:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.receberConta = async (req, res) => {
  try {
    const conta = await ContaReceber.findById(req.params.id);

    if (!conta) {
      return res.status(404).json({
        success: false,
        message: "Conta a receber não encontrada.",
      });
    }

    conta.status = "recebida";
    conta.dataRecebimento = new Date();
    conta.formaRecebimento =
      req.body.formaRecebimento || conta.formaRecebimento || "PIX";

    await conta.save();

    await MovimentacaoFinanceira.create({
      tipo: "entrada",
      origem: "conta_receber",
      descricao: `Recebimento: ${conta.descricao}`,
      categoria: "Receitas",
      valor: Number(conta.valor || 0),
      formaPagamento: conta.formaRecebimento,
      contaReceber: conta._id,
    });

    return res.json({
      success: true,
      conta,
    });
  } catch (error) {
    console.log("ERRO RECEBER CONTA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deletarContaReceber = async (req, res) => {
  try {
    const conta = await ContaReceber.findByIdAndUpdate(
      req.params.id,
      { status: "cancelada" },
      { new: true }
    );

    if (!conta) {
      return res.status(404).json({
        success: false,
        message: "Conta a receber não encontrada.",
      });
    }

    return res.json({
      success: true,
      conta,
    });
  } catch (error) {
    console.log("ERRO CANCELAR CONTA RECEBER:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// MOVIMENTAÇÃO MANUAL
// ===============================
exports.criarMovimentacao = async (req, res) => {
  try {
    const { tipo, descricao, valor } = req.body;

    if (!tipo || !descricao || !valor) {
      return res.status(400).json({
        success: false,
        message: "Tipo, descrição e valor são obrigatórios.",
      });
    }

    const movimentacao = await MovimentacaoFinanceira.create({
      ...req.body,
      valor: Number(valor),
      origem: req.body.origem || "manual",
    });

    return res.status(201).json({
      success: true,
      movimentacao,
    });
  } catch (error) {
    console.log("ERRO CRIAR MOVIMENTAÇÃO:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};