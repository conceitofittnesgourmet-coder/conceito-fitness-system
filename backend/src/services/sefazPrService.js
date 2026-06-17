const axios = require("axios");
const https = require("https");

function criarHttpsAgent() {
  const pfxBase64 = process.env.CERTIFICADO_PFX_BASE64;
  const senha = process.env.CERTIFICADO_SENHA;

  if (!pfxBase64 || !senha) {
    throw new Error("Certificado A1 ou senha não configurados.");
  }

  return new https.Agent({
    pfx: Buffer.from(pfxBase64, "base64"),
    passphrase: senha,
    rejectUnauthorized: false,
  });
}

function urlsSefaz() {
  const ambiente = process.env.NFCE_AMBIENTE || "homologacao";

  if (ambiente === "producao") {
    return {
      autorizacao: "https://nfce.sefa.pr.gov.br/nfce/NFeAutorizacao4",
      retorno: "https://nfce.sefa.pr.gov.br/nfce/NFeRetAutorizacao4",
    };
  }

  return {
    autorizacao:
      "https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeAutorizacao4",
    retorno:
      "https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeRetAutorizacao4",
  };
}

function removerDeclaracaoXml(xml = "") {
  return String(xml).replace(/<\?xml[^>]*\?>/g, "").trim();
}

function montarEnvelopeAutorizacao(xmlAssinado, idLote) {
  const nfeLimpa = removerDeclaracaoXml(xmlAssinado);

  return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
      <enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
        <idLote>${idLote}</idLote>
        <indSinc>1</indSinc>
        ${nfeLimpa}
      </enviNFe>
    </nfeDadosMsg>
  </soap12:Body>
</soap12:Envelope>`;
}

function montarEnvelopeConsultaRecibo(recibo, ambiente = "homologacao") {
  const tpAmb = ambiente === "producao" ? "1" : "2";

  return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRetAutorizacao4">
      <consReciNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
        <tpAmb>${tpAmb}</tpAmb>
        <nRec>${recibo}</nRec>
      </consReciNFe>
    </nfeDadosMsg>
  </soap12:Body>
</soap12:Envelope>`;
}

function extrairTag(xml, tag) {
  const regex = new RegExp(`<${tag}>(.*?)</${tag}>`);
  const match = String(xml).match(regex);
  return match ? match[1] : "";
}

function extrairProtocolo(xml) {
  return {
    cStat: extrairTag(xml, "cStat"),
    xMotivo: extrairTag(xml, "xMotivo"),
    nProt: extrairTag(xml, "nProt"),
    nRec: extrairTag(xml, "nRec"),
    dhRecbto: extrairTag(xml, "dhRecbto"),
    xmlRetorno: xml,
  };
}

async function transmitirNfceParaSefaz(xmlAssinado, idLote) {
  const agent = criarHttpsAgent();
  const urls = urlsSefaz();

  const envelope = montarEnvelopeAutorizacao(xmlAssinado, idLote);

  const response = await axios.post(urls.autorizacao, envelope, {
    httpsAgent: agent,
    timeout: 60000,
    headers: {
      "Content-Type": "application/soap+xml; charset=utf-8",
    },
  });

  return extrairProtocolo(response.data);
}

async function consultarReciboSefaz(recibo) {
  const agent = criarHttpsAgent();
  const urls = urlsSefaz();
  const ambiente = process.env.NFCE_AMBIENTE || "homologacao";

  const envelope = montarEnvelopeConsultaRecibo(recibo, ambiente);

  const response = await axios.post(urls.retorno, envelope, {
    httpsAgent: agent,
    timeout: 60000,
    headers: {
      "Content-Type": "application/soap+xml; charset=utf-8",
    },
  });

  return extrairProtocolo(response.data);
}

module.exports = {
  transmitirNfceParaSefaz,
  consultarReciboSefaz,
};