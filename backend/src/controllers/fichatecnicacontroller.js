const FichaTecnica = require("../models/fichatecnica");
const MateriaPrima = require("../models/materiaprima");

exports.listar = async (req, res) => {
  try {
    const fichas = await FichaTecnica.find()
      .populate("produto")
      .populate("itens.materiaPrima")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      fichas,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.buscarPorProduto = async (req, res) => {
  try {
    const ficha = await FichaTecnica.findOne({
      produto: req.params.produtoId,
      ativa: true,
    })
      .populate("produto")
      .populate("itens.materiaPrima");

    return res.json({
      success: true,
      ficha,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.criarOuAtualizar = async (req, res) => {
  try {
    const { produto, itens = [], observacao = "", ativa = true } = req.body;

    if (!produto) {
      return res.status(400).json({
        success: false,
        message: "Produto é obrigatório.",
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

    await FichaTecnica.updateMany(
      { produto },
      { ativa: false }
    );

    const ficha = await FichaTecnica.create({
      produto,
      itens: itensCalculados,
      custoTotal,
      observacao,
      ativa,
    });

    return res.status(201).json({
      success: true,
      ficha,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.excluir = async (req, res) => {
  try {
    await FichaTecnica.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Ficha técnica excluída.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};