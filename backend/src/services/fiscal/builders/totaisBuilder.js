function calcularTotaisPedido(pedido = {}) {
  const valorTotal = Number(pedido.total || 0);

  if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
    throw new Error("Valor total inválido para emissão da NFC-e.");
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

  const valorFrete = Number(pedido.taxaEntrega || 0);
  const valorDesconto = Number(pedido.desconto || 0);

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
