function calcularTotaisPedido(pedido = {}) {
  const valorTotal = Number(pedido.total || 0);

if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
    throw new Error(
        "Valor total inválido para emissão da NFC-e."
    );
}

  const valorProdutos = (pedido.produtos || []).reduce(
    (totalProdutos, item) => {
      const subtotalItem =
        item.subtotal !== undefined
          ? Number(item.subtotal || 0)
          : Number(item.precoUnitario || item.preco || 0) *
            Number(item.quantidade || 1);

      return totalProdutos + subtotalItem;
    },
    0
  );

 if (!Number.isFinite(valorProdutos)) {
    throw new Error(
        "Valor total dos produtos inválido."
    );
}

  const valorFrete = Math.max(
    0,
    Number(pedido.taxaEntrega || 0)
);
const valorDesconto = Math.max(
    0,
    Number(pedido.desconto || 0)
);

const valorSeguro = 0;
const valorOutros = 0;

  const totalEsperado =
    valorProdutos +
    valorFrete +
    valorSeguro +
    valorOutros -
    valorDesconto;

if (Math.abs(totalEsperado - Number(valorTotal)) > 0.01) {

    const diferenca =
        Number(valorTotal) -
        Number(totalEsperado);

throw new Error(
[
    "Divergência nos totais da NFC-e.",
    `Produtos : ${valorProdutos.toFixed(2)}`,
    `Frete    : ${valorFrete.toFixed(2)}`,
    `Desconto : ${valorDesconto.toFixed(2)}`,
    `Total    : ${valorTotal.toFixed(2)}`,
    `Esperado : ${totalEsperado.toFixed(2)}`,
    `Diferença: ${diferenca.toFixed(2)}`
].join("\n")
);
}
  
console.info(
    "[FISCAL] Totais NFC-e OK",
    {
        produtos: valorProdutos,
        frete: valorFrete,
        desconto: valorDesconto,
        esperado: totalEsperado,
        total: valorTotal
    }
);

  return {
    valorTotal,
    valorProdutos,
    valorFrete,
    valorDesconto,
  };
}

function montarXmlTotais({
  valorTotal,
  valorProdutos,
  valorFrete,
  valorDesconto,
}) {
  return `
    <total>
      <ICMSTot>
        <vBC>0.00</vBC>
        <vICMS>0.00</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${Number(valorProdutos).toFixed(2)}</vProd>
        <vFrete>${Number(valorFrete).toFixed(2)}</vFrete>
        <vSeg>0.00</vSeg>
        <vDesc>${Number(valorDesconto).toFixed(2)}</vDesc>
        <vII>0.00</vII>
        <vIPI>0.00</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>0.00</vPIS>
        <vCOFINS>0.00</vCOFINS>
        <vOutro>0.00</vOutro>
        <vNF>${Number(valorTotal).toFixed(2)}</vNF>
      </ICMSTot>
    </total>`;
}

module.exports = {
  calcularTotaisPedido,
  montarXmlTotais,
};
