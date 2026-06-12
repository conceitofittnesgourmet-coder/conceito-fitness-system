const Fornecedor = require("../models/fornecedor");
const Compra = require("../models/compra");
const MateriaPrima = require("../models/materiaprima");
const ContaPagar = require("../models/contapagar");
const MovimentacaoFinanceira = require("../models/movimentacaofinanceira");

// ===============================
// FORNECEDORES
// ===============================

exports.listarFornecedores = async (req, res) => {
  try {
    const fornecedores = await Fornecedor.find({ ativo: true }).sort({
      nome: 1,
    });

    return res.json({
      success: true,
      fornecedores,
    });
  } catch (error) {
    console.log("ERRO LISTAR FORNECEDORES:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.criarFornecedor = async (req, res) => {
  try {
    const { nome } = req.body || {};

    if (!nome) {
      return res.status(400).json({
        success: false,
        message: "Nome do fornecedor é obrigatório.",
      });
    }

    const fornecedor = await Fornecedor.create({
      nome,
      documento: req.body.documento || "",
      telefone: req.body.telefone || "",
      email: req.body.email || "",
      endereco: req.body.endereco || "",
      categoria: req.body.categoria || "Geral",
      observacao: req.body.observacao || "",
    });

    return res.status(201).json({
      success: true,
      fornecedor,
    });
  } catch (error) {
    console.log("ERRO CRIAR FORNECEDOR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.atualizarFornecedor = async (req, res) => {
  try {
    const fornecedor = await Fornecedor.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!fornecedor) {
      return res.status(404).json({
        success: false,
        message: "Fornecedor não encontrado.",
      });
    }

    return res.json({
      success: true,
      fornecedor,
    });
  } catch (error) {
    console.log("ERRO ATUALIZAR FORNECEDOR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deletarFornecedor = async (req, res) => {
  try {
    const fornecedor = await Fornecedor.findByIdAndUpdate(
      req.params.id,
      { ativo: false },
      { new: true }
    );

    if (!fornecedor) {
      return res.status(404).json({
        success: false,
        message: "Fornecedor não encontrado.",
      });
    }

    return res.json({
      success: true,
      fornecedor,
    });
  } catch (error) {
    console.log("ERRO DELETAR FORNECEDOR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// COMPRAS
// ===============================

exports.listarCompras = async (req, res) => {
  try {
    const compras = await Compra.find()
      .populate("fornecedor")
      .populate("itens.materiaPrima")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      compras,
    });
  } catch (error) {
    console.log("ERRO LISTAR COMPRAS:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.criarCompra = async (req, res) => {
  try {
    const { fornecedor, itens, formaPagamento, observacao } = req.body || {};

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({
        success: false,
        message: "A compra precisa ter pelo menos um item.",
      });
    }

    let fornecedorEncontrado = null;

    if (fornecedor) {
      fornecedorEncontrado = await Fornecedor.findById(fornecedor);
    }

    const itensCalculados = [];
    let valorTotal = 0;

    for (const item of itens) {
      const materia = await MateriaPrima.findById(item.materiaPrima);

      if (!materia) continue;

      const quantidade = Number(item.quantidade || 0);
      const custoUnitario = Number(item.custoUnitario || materia.custoUnitario || 0);
      const total = quantidade * custoUnitario;

      valorTotal += total;

      itensCalculados.push({
        materiaPrima: materia._id,
        nome: materia.nome,
        quantidade,
        unidade: item.unidade || materia.unidade,
        custoUnitario,
        total,
      });

      materia.estoqueAtual = Number(materia.estoqueAtual || 0) + quantidade;
      materia.custoUnitario = custoUnitario;

      await materia.save();
    }

    const compra = await Compra.create({
      fornecedor: fornecedorEncontrado?._id || null,
      fornecedorNome: fornecedorEncontrado?.nome || req.body.fornecedorNome || "",
      itens: itensCalculados,
      valorTotal,
      formaPagamento: formaPagamento || "PIX",
      status: "recebida",
      observacao: observacao || "",
    });

    await ContaPagar.create({
      descricao: `Compra de insumos #${compra._id.toString().slice(-6)}`,
      categoria: "Compras",
      fornecedor: fornecedorEncontrado?.nome || req.body.fornecedorNome || "",
      valor: valorTotal,
      vencimento: new Date(),
      dataPagamento: new Date(),
      status: "paga",
      formaPagamento: formaPagamento || "PIX",
      observacao: "Gerado automaticamente pela compra de insumos.",
    });

    await MovimentacaoFinanceira.create({
      tipo: "saida",
      origem: "compra",
      descricao: `Compra de insumos #${compra._id.toString().slice(-6)}`,
      categoria: "Compras",
      valor: valorTotal,
      formaPagamento: formaPagamento || "PIX",
      observacao: "Saída automática gerada pela compra de insumos.",
    });

    return res.status(201).json({
      success: true,
      compra,
    });
  } catch (error) {
    console.log("ERRO CRIAR COMPRA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};