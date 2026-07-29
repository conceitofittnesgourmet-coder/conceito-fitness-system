const {
  somenteNumeros,
  escapeXml,
  textoFiscal,
} = require("../documentoFiscalUtils");

/**
 * Monta o destinatário simplificado da NFC-e.
 * Quando não houver CPF válido, o grupo <dest> é omitido.
 */
function montarXmlDestinatarioNfce({ cpf, nome, ambiente }) {
  const cpfNormalizado = somenteNumeros(cpf || "");

  if (cpfNormalizado.length !== 11) {
    return "";
  }

  const nomeDestinatario =
    ambiente !== "producao"
      ? "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL"
      : textoFiscal(nome, "");

  const nomeXml = nomeDestinatario
    ? `<xNome>${escapeXml(nomeDestinatario)}</xNome>`
    : "";

  return `<dest>
    <CPF>${cpfNormalizado}</CPF>
    ${nomeXml}
    <indIEDest>9</indIEDest>
  </dest>`;
}

module.exports = {
  montarXmlDestinatarioNfce,
};
