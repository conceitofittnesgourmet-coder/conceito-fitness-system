const {
  somenteNumeros,
  escapeXml,
} = require("../documentoFiscalUtils");

function montarXmlTransporteNfce(
  pedido = {},
  empresa = {}
) {
  const tipo = String(
    pedido.tipo || ""
  )
    .trim()
    .toLowerCase();

  const valorFrete = Math.max(
    0,
    Number(pedido.taxaEntrega || 0)
  );

  const ehDelivery =
    ["delivery", "entrega"].includes(tipo);

  if (!ehDelivery || valorFrete <= 0) {
    return `
      <transp>
        <modFrete>9</modFrete>
      </transp>`;
  }

  const cnpj =
    somenteNumeros(
      empresa.cnpj || ""
    );

  const ie =
    somenteNumeros(
      empresa.ie || ""
    );

  return `
    <transp>
      <modFrete>3</modFrete>

      <transporta>
        <CNPJ>${cnpj}</CNPJ>
        <xNome>${escapeXml(
          empresa.nome ||
          "CONCEITO FITNESS"
        )}</xNome>
        <IE>${ie}</IE>
        <xEnder>${escapeXml(
          empresa.endereco ||
          "AV PARANA 8455"
        )}</xEnder>
        <xMun>UMUARAMA</xMun>
        <UF>PR</UF>
      </transporta>
    </transp>`;
}

module.exports = {
  montarXmlTransporteNfce,
};
