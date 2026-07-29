const { somenteNumeros, escapeXml } = require("../documentoFiscalUtils");

function montarXmlResponsavelTecnico({
  cnpj,
  contato = "CONCEITO FITNESS",
  email = "conceitofittnesgourmet@gmail.com",
  telefone = "44999999999",
}) {
  return `
    <infRespTec>
      <CNPJ>${somenteNumeros(cnpj)}</CNPJ>
      <xContato>${escapeXml(contato)}</xContato>
      <email>${escapeXml(email)}</email>
      <fone>${somenteNumeros(telefone)}</fone>
    </infRespTec>`;
}

module.exports = {
  montarXmlResponsavelTecnico,
};
