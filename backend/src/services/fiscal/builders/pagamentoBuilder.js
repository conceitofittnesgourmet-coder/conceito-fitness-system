function normalizarFormaPagamento(tipo) {
  return String(tipo || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function obterCodigoPagamento(tipo) {
  const pagamento = normalizarFormaPagamento(tipo);

  if (pagamento.includes("DINHEIRO")) return "01";
  if (pagamento.includes("CREDITO")) return "03";
  if (pagamento.includes("DEBITO")) return "04";
  if (pagamento.includes("CARTAO DE CREDITO")) return "03";
  if (pagamento.includes("CARTAO DE DEBITO")) return "04";
  if (pagamento.includes("CARTAO")) return "03";
  if (pagamento.includes("PIX")) return "17";

  return "17";
}

function montarXmlPagamento(pedido = {}, valorTotal) {
  const pagamentos =
    Array.isArray(pedido.pagamentos) && pedido.pagamentos.length > 0
      ? pedido.pagamentos
      : [
          {
            forma: pedido.pagamento || pedido.formaPagamento || "PIX",
            valor: valorTotal,
          },
        ];

  const detPagXml = pagamentos
    .map((pagamentoItem) => {
      const forma = normalizarFormaPagamento(pagamentoItem.forma);
      const tPag = obterCodigoPagamento(forma);
      const valor = Number(pagamentoItem.valor || 0);
      const precisaCard = ["03", "04", "17"].includes(tPag);

      const cardXml = precisaCard
        ? `
        <card>
          <tpIntegra>2</tpIntegra>
          <tBand>99</tBand>
          <cAut>000000</cAut>
        </card>`
        : "";

      return `
      <detPag>
        <tPag>${tPag}</tPag>
        <vPag>${valor.toFixed(2)}</vPag>
        ${cardXml}
      </detPag>`;
    })
    .join("");

  return `
    <pag>
      ${detPagXml}
    </pag>`;
}

module.exports = {
  obterCodigoPagamento,
  montarXmlPagamento,
};
