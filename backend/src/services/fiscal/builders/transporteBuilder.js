function montarXmlTransporteNfce(pedido = {}) {
  const tipo = String(pedido.tipo || "")
    .trim()
    .toLowerCase();

  const valorFrete = Math.max(
    0,
    Number(pedido.taxaEntrega || 0)
  );

  const ehDelivery =
    ["delivery", "entrega"].includes(tipo);

  /*
   * 3 = Transporte próprio por conta do remetente.
   * 9 = Sem ocorrência de transporte.
   *
   * Para delivery com taxa de entrega, consideramos
   * transporte próprio da loja.
   */
  const modalidadeFrete =
    ehDelivery && valorFrete > 0
      ? 3
      : 9;

  return `
    <transp>
      <modFrete>${modalidadeFrete}</modFrete>
    </transp>`;
}

module.exports = {
  montarXmlTransporteNfce,
};