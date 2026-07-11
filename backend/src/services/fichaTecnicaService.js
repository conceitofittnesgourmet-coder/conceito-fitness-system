const FichaTecnica = require("../models/fichatecnica");
const MateriaPrima = require("../models/materiaprima");

function normalizarId(valor) {
  if (!valor) return "";

  if (typeof valor === "object") {
    return String(valor._id || valor.id || "");
  }

  return String(valor);
}

async function baixarItens(
  itens = [],
  multiplicador = 1
) {
  let custo = 0;
  const consumos = [];

  for (const item of itens) {
    const materiaId = normalizarId(
      item.materiaPrima
    );

    if (!materiaId) continue;

    const quantidadeConsumida =
      Number(item.quantidade || 0) *
      Number(multiplicador || 1);

    if (quantidadeConsumida <= 0) continue;

    const materia =
      await MateriaPrima.findById(materiaId);

    if (!materia) continue;

    await MateriaPrima.findByIdAndUpdate(
      materiaId,
      {
        $inc: {
          estoqueAtual: -quantidadeConsumida,
        },
      }
    );

    const custoItem =
      quantidadeConsumida *
      Number(materia.custoUnitario || 0);

    custo += custoItem;

    consumos.push({
      materiaPrima: materia._id,
      nome: materia.nome,
      quantidade: quantidadeConsumida,
      unidade: item.unidade || materia.unidade,
      custo: custoItem,
    });
  }

  return {
    custo,
    consumos,
  };
}

async function consumirFichaDoItemPedido(
  itemPedido
) {
  if (!itemPedido?.produtoId) {
    return {
      custoTotal: 0,
      consumos: [],
    };
  }

  const ficha = await FichaTecnica.findOne({
    produto: itemPedido.produtoId,
    ativa: true,
  })
    .populate("itens.materiaPrima")
    .populate("variacoes.itens.materiaPrima");

  if (!ficha) {
    return {
      custoTotal: 0,
      consumos: [],
    };
  }

  const quantidadePedido = Number(
    itemPedido.quantidade || 1
  );

  const resultadoBase = await baixarItens(
    ficha.itens,
    quantidadePedido
  );

  let custoTotal = resultadoBase.custo;
  const consumos = [...resultadoBase.consumos];

  const configuracoesPedido = Array.isArray(
    itemPedido.configuracoes
  )
    ? itemPedido.configuracoes
    : [];

  for (const configuracao of configuracoesPedido) {
    const opcaoEscolhida = normalizarId(
      configuracao.opcaoId
    );

    if (!opcaoEscolhida) continue;

    const variacao = ficha.variacoes.find(
      (item) =>
        item.ativa !== false &&
        normalizarId(item.opcaoComponente) ===
          opcaoEscolhida
    );

    if (!variacao) continue;

    const resultadoVariacao = await baixarItens(
      variacao.itens,
      quantidadePedido
    );

    custoTotal += resultadoVariacao.custo;

    consumos.push(
      ...resultadoVariacao.consumos
    );
  }

  return {
    custoTotal,
    consumos,
  };
}

module.exports = {
  consumirFichaDoItemPedido,
};