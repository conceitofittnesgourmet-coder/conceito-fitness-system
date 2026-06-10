const MateriaPrima = require("../models/materiaPrima");
const FichaTecnica = require("../models/fichaTecnica");
const Produto = require("../models/produto");

// ===============================
// MATÉRIA-PRIMA
// ===============================

exports.listarMateriasPrimas = async (req, res) => {
  try {
    const materias = await MateriaPrima.find({ ativo: true }).sort({
      nome: 1,
    });

    const alertas = materias.filter(
      (item) => Number(item.estoqueAtual || 0) <= Number(item.estoqueMinimo || 0)
    );

    return res.json({
      success: true,
      materias,
      alertas,
    });
  } catch (error) {
    console.log("ERRO LISTAR MATÉRIAS:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.criarMateriaPrima = async (req, res) => {
  try {
    const {
      nome,
      categoria,
      unidade,
      estoqueAtual,
      estoqueMinimo,
      custoUnitario,
      fornecedor,
    } = req.body || {};

    if (!nome) {
      return res.status(400).json({
        success: false,
        message: "Nome da matéria-prima é obrigatório.",
      });
    }

    const materia = await MateriaPrima.create({
      nome,
      categoria: categoria || "Insumos",
      unidade: unidade || "unidade",
      estoqueAtual: Number(estoqueAtual || 0),
      estoqueMinimo: Number(estoqueMinimo || 0),
      custoUnitario: Number(custoUnitario || 0),
      fornecedor: fornecedor || "",
    });

    return res.status(201).json({
      success: true,
      materia,
    });
  } catch (error) {
    console.log("ERRO CRIAR MATÉRIA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.atualizarMateriaPrima = async (req, res) => {
  try {
    const materia = await MateriaPrima.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!materia) {
      return res.status(404).json({
        success: false,
        message: "Matéria-prima não encontrada.",
      });
    }

    return res.json({
      success: true,
      materia,
    });
  } catch (error) {
    console.log("ERRO ATUALIZAR MATÉRIA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deletarMateriaPrima = async (req, res) => {
  try {
    const materia = await MateriaPrima.findByIdAndUpdate(
      req.params.id,
      { ativo: false },
      { new: true }
    );

    return res.json({
      success: true,
      materia,
    });
  } catch (error) {
    console.log("ERRO DELETAR MATÉRIA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// FICHA TÉCNICA
// ===============================

exports.listarFichasTecnicas = async (req, res) => {
  try {
    const fichas = await FichaTecnica.find({ ativa: true })
      .populate("produto")
      .populate("itens.materiaPrima")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      fichas,
    });
  } catch (error) {
    console.log("ERRO LISTAR FICHAS:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.criarFichaTecnica = async (req, res) => {
  try {
    const { produto, itens, observacao } = req.body || {};

    if (!produto) {
      return res.status(400).json({
        success: false,
        message: "Produto é obrigatório.",
      });
    }

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({
        success: false,
        message: "A ficha precisa ter pelo menos um item.",
      });
    }

    let custoTotal = 0;
    const itensCalculados = [];

    for (const item of itens) {
      const materia = await MateriaPrima.findById(item.materiaPrima);

      if (!materia) continue;

      const quantidade = Number(item.quantidade || 0);
      const custo = quantidade * Number(materia.custoUnitario || 0);

      custoTotal += custo;

      itensCalculados.push({
        materiaPrima: materia._id,
        quantidade,
        unidade: item.unidade || materia.unidade,
        custo,
      });
    }

    const ficha = await FichaTecnica.create({
      produto,
      itens: itensCalculados,
      custoTotal,
      observacao: observacao || "",
    });

    const produtoAtualizado = await Produto.findById(produto);

    if (produtoAtualizado) {
      produtoAtualizado.custo = custoTotal;
      produtoAtualizado.lucro = Number(produtoAtualizado.preco || 0) - custoTotal;
      produtoAtualizado.margem =
        Number(produtoAtualizado.preco || 0) > 0
          ? Number(
              (
                (produtoAtualizado.lucro / Number(produtoAtualizado.preco || 0)) *
                100
              ).toFixed(2)
            )
          : 0;

      await produtoAtualizado.save();
    }

    return res.status(201).json({
      success: true,
      ficha,
    });
  } catch (error) {
    console.log("ERRO CRIAR FICHA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// PRODUÇÃO
// ===============================

exports.produzirProduto = async (req, res) => {
  try {
    const { produtoId, quantidadeProduzida } = req.body || {};

    if (!produtoId || !quantidadeProduzida) {
      return res.status(400).json({
        success: false,
        message: "Produto e quantidade produzida são obrigatórios.",
      });
    }

    const ficha = await FichaTecnica.findOne({
      produto: produtoId,
      ativa: true,
    }).populate("itens.materiaPrima");

    if (!ficha) {
      return res.status(404).json({
        success: false,
        message: "Ficha técnica não encontrada para este produto.",
      });
    }

    const quantidade = Number(quantidadeProduzida || 1);

    for (const item of ficha.itens) {
      const materia = await MateriaPrima.findById(item.materiaPrima._id);

      if (!materia) continue;

      const baixa = Number(item.quantidade || 0) * quantidade;

      materia.estoqueAtual = Number(materia.estoqueAtual || 0) - baixa;

      await materia.save();
    }

    const produto = await Produto.findById(produtoId);

    if (produto) {
      produto.estoque = Number(produto.estoque || 0) + quantidade;

      produto.movimentacoes.push({
        tipo: "producao",
        quantidade,
        motivo: "Produção via ficha técnica",
      });

      await produto.save();
    }

    return res.json({
      success: true,
      message: "Produção registrada com sucesso.",
      produto,
    });
  } catch (error) {
    console.log("ERRO PRODUZIR PRODUTO:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};