const { escapeXml } = require("../documentoFiscalUtils");

function montarXmlInformacoesAdicionais({ ambiente }) {
  const informacaoComplementar =
    ambiente !== "producao"
      ? "TESTE"
      : "Documento emitido pelo sistema Conceito Fitness.";

  return `
    <infAdic>
      <infCpl>${escapeXml(informacaoComplementar)}</infCpl>
    </infAdic>`;
}

module.exports = {
  montarXmlInformacoesAdicionais,
};
