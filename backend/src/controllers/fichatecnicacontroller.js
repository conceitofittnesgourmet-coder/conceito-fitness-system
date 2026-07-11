const FichaTecnica = require("../models/fichatecnica");
const MateriaPrima = require("../models/materiaprima");

async function calcularItens(itens = []) {
  const itensCalculados = [];
  let custoTotal = 0;

  for (const item of itens) {
    if (!item?.materiaPrima) continue;

    const materia = await MateriaPrima.findById(item.materiaPrima);

    if (!materia) continue;

    const quantidade = Number(item.quantidade || 0);

    if (quantidade <= 0) continue;

    const custo =
      quantidade * Number(materia.custoUnitario || 0);

    custoTotal += custo;

    itensCalculados.push({
      materiaPrima: materia._id,
      quantidade,
      unidade: item.unidade || materia.unidade,
      custo,
    });
  }

  return {
    itens: itensCalculados,
    custoTotal,
  };
}

async function calcularVariacoes(variacoes = []) {
  const variacoesCalculadas = [];
  let custoVariacoes = 0;

  for (const variacao of variacoes) {
    if (
      !variacao?.grupoComponente ||
      !variacao?.opcaoComponente
    ) {
      continue;
    }

    const calculo = await calcularItens(
      variacao.itens || []
    );

    custoVariacoes += calculo.custoTotal;

    variacoesCalculadas.push({
      grupoComponente: variacao.grupoComponente,
      opcaoComponente: variacao.opcaoComponente,
      nomeGrupo: variacao.nomeGrupo || "",
      nomeOpcao: variacao.nomeOpcao || "",
      itens: calculo.itens,
      custoTotal: calculo.custoTotal,
      ativa: variacao.ativa !== false,
    });
  }

  return {
    variacoes: variacoesCalculadas,
    custoVariacoes,
  };
}

exports.listar = async (req, res) => {
  try {
    const fichas = await FichaTecnica.find()
      .populate("produto")
      .populate("itens.materiaPrima")
      .populate("variacoes.grupoComponente")
      .populate("variacoes.opcaoComponente")
      .populate("variacoes.itens.materiaPrima")
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

exports.buscarPorProduto = async (req, res) => {
  try {
    const ficha = await FichaTecnica.findOne({
      produto: req.params.produtoId,
      ativa: true,
    })
      .populate("produto")
      .populate("itens.materiaPrima")
      .populate("variacoes.grupoComponente")
      .populate("variacoes.opcaoComponente")
      .populate("variacoes.itens.materiaPrima");

    return res.json({
      success: true,
      ficha,
    });
  } catch (error) {
    console.log("ERRO BUSCAR FICHA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.criarOuAtualizar = async (req, res) => {
  try {
    const {
      produto,
      itens = [],
      variacoes = [],
      observacao = "",
      ativa = true,
    } = req.body || {};

    if (!produto) {
      return res.status(400).json({
        success: false,
        message: "Produto é obrigatório.",
      });
    }

    const calculoBase = await calcularItens(itens);
    const calculoVariacoes =
      await calcularVariacoes(variacoes);

    await FichaTecnica.updateMany(
      {
        produto,
        ativa: true,
      },
      {
        ativa: false,
      }
    );

    const ficha = await FichaTecnica.create({
      produto,

      itens: calculoBase.itens,

      variacoes: calculoVariacoes.variacoes,

      custoBase: calculoBase.custoTotal,

      custoVariacoes:
        calculoVariacoes.custoVariacoes,

      // Representa o custo máximo cadastrado da ficha.
      // O custo real do pedido será calculado pelas opções escolhidas.
      custoTotal:
        calculoBase.custoTotal +
        calculoVariacoes.custoVariacoes,

      observacao,
      ativa,
    });

    const fichaCompleta = await FichaTecnica.findById(
      ficha._id
    )
      .populate("produto")
      .populate("itens.materiaPrima")
      .populate("variacoes.grupoComponente")
      .populate("variacoes.opcaoComponente")
      .populate("variacoes.itens.materiaPrima");

    return res.status(201).json({
      success: true,
      ficha: fichaCompleta,
    });
  } catch (error) {
    console.log("ERRO SALVAR FICHA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.excluir = async (req, res) => {
  try {
    const ficha = await FichaTecnica.findByIdAndDelete(
      req.params.id
    );

    if (!ficha) {
      return res.status(404).json({
        success: false,
        message: "Ficha técnica não encontrada.",
      });
    }

    return res.json({
      success: true,
      message: "Ficha técnica excluída.",
    });
  } catch (error) {
    console.log("ERRO EXCLUIR FICHA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};