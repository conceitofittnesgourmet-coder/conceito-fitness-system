const {
  somenteNumeros,
  escapeXml,
  textoFiscal,
} = require("../documentoFiscalUtils");

function montarXmlEmitente({ empresa = {}, endereco = {} }) {
  const cnpj = somenteNumeros(empresa.cnpj || empresa.documento || "");
  const ie = somenteNumeros(
    empresa.inscricaoEstadual || empresa.ie || ""
  );
  const codigoMunicipio = somenteNumeros(
    endereco.codigoMunicipio || endereco.cMun || ""
  );
  const cep = somenteNumeros(endereco.cep || "");

  if (cnpj.length !== 14) {
    throw new Error("CNPJ do emitente inválido para montagem do XML.");
  }

  if (!ie) {
    throw new Error("Inscrição estadual do emitente não informada.");
  }

  if (codigoMunicipio.length !== 7) {
    throw new Error("Código do município do emitente inválido.");
  }

  return `<emit>
    <CNPJ>${cnpj}</CNPJ>
    <xNome>${escapeXml(textoFiscal(empresa.razaoSocial, "EMITENTE NÃO INFORMADO"))}</xNome>
    <xFant>${escapeXml(textoFiscal(empresa.nomeFantasia, empresa.razaoSocial || ""))}</xFant>
    <enderEmit>
      <xLgr>${escapeXml(textoFiscal(endereco.logradouro))}</xLgr>
      <nro>${escapeXml(textoFiscal(endereco.numero, "S/N"))}</nro>
      <xBairro>${escapeXml(textoFiscal(endereco.bairro))}</xBairro>
      <cMun>${codigoMunicipio}</cMun>
      <xMun>${escapeXml(textoFiscal(endereco.municipio))}</xMun>
      <UF>${escapeXml(textoFiscal(endereco.uf).toUpperCase())}</UF>
      ${cep.length === 8 ? `<CEP>${cep}</CEP>` : ""}
      <cPais>1058</cPais>
      <xPais>BRASIL</xPais>
    </enderEmit>
    <IE>${ie}</IE>
    <CRT>${Number(empresa.crt || 1)}</CRT>
  </emit>`;
}

module.exports = {
  montarXmlEmitente,
};
