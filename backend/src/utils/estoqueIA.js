const Produto = require("../models/produto");

async function baixarEstoque(pedido) {
  if (!pedido.produtos || pedido.produtos.length === 0) {
    return;
  }

  for (const item of pedido.produtos) {
    const produtoId = item.produtoId || item._id;

    if (!produtoId) continue;

    await Produto.findByIdAndUpdate(
      produtoId,
      {
        $inc: {
          estoque: -Number(item.quantidade || 1),
        },
      },
      { new: true }
    );
  }
}

module.exports = {
  baixarEstoque,
};