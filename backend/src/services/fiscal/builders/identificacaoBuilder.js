const {
  escapeXml,
  formatarDataHoraSaoPaulo,
} = require("../documentoFiscalUtils");

/**
 * Monta o grupo <ide> compartilhado da NF-e/NFC-e.
 * Os parâmetros específicos de cada modelo permanecem explícitos.
 */
function montarXmlIdentificacao({
  identificacaoFiscal,
  codigoMunicipioFatoGerador,
  naturezaOperacao = "VENDA",
  tipoImpressao = 4,
  destinoOperacao = 1,
  consumidorFinal = 1,
  indicadorPresenca = 1,
  versaoProcesso = "ConceitoFitERP1.0",
}) {
  if (!identificacaoFiscal?.chaveDados) {
    throw new Error("Identificação fiscal não informada para montagem do XML.");
  }

  const codigoMunicipio = String(codigoMunicipioFatoGerador || "").replace(/\D/g, "");

  if (codigoMunicipio.length !== 7) {
    throw new Error("Código do município do fato gerador inválido.");
  }

  const dataEmissao = formatarDataHoraSaoPaulo(
    identificacaoFiscal.dataEmissao || new Date()
  );

  return `<ide>
    <cUF>${escapeXml(identificacaoFiscal.chaveDados.cUF)}</cUF>
    <cNF>${escapeXml(identificacaoFiscal.chaveDados.cNF)}</cNF>
    <natOp>${escapeXml(naturezaOperacao)}</natOp>
    <mod>${escapeXml(identificacaoFiscal.modelo)}</mod>
    <serie>${identificacaoFiscal.serie}</serie>
    <nNF>${identificacaoFiscal.numero}</nNF>
    <dhEmi>${dataEmissao}</dhEmi>
    <tpNF>1</tpNF>
    <idDest>${destinoOperacao}</idDest>
    <cMunFG>${codigoMunicipio}</cMunFG>
    <tpImp>${tipoImpressao}</tpImp>
    <tpEmis>${identificacaoFiscal.tipoEmissao}</tpEmis>
    <cDV>${identificacaoFiscal.chaveDados.dv}</cDV>
    <tpAmb>${identificacaoFiscal.tpAmb}</tpAmb>
    <finNFe>1</finNFe>
    <indFinal>${consumidorFinal}</indFinal>
    <indPres>${indicadorPresenca}</indPres>
    <procEmi>0</procEmi>
    <verProc>${escapeXml(versaoProcesso)}</verProc>
  </ide>`;
}

module.exports = {
  montarXmlIdentificacao,
};
