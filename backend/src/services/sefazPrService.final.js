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
    autorizacao: "https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeAutorizacao4",
    retorno: "https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeRetAutorizacao4",
  };
}

function removerDeclaracaoXml(xml = "") {
  return String(xml)
    .replace(/^\uFEFF/, "")
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/>\s+</g, "><")
    .trim();
}

function extrairTag(xml, tag) {
  const match = String(xml).match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? match[1] : "";
}

function extrairBloco(xml, tag) {
  const match = String(xml).match(new RegExp(`<${tag}[\\s\\S]*?</${tag}>`));
  return match ? match[0] : "";
}

function montarEnvelopeAutorizacao(xmlAssinado, idLote) {
  const nfeLimpa = removerDeclaracaoXml(xmlAssinado);

  return `<?xml version="1.0" encoding="UTF-8"?><soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4"><enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><idLote>${idLote}</idLote><indSinc>1</indSinc>${nfeLimpa}</enviNFe></nfeDadosMsg></soap12:Body></soap12:Envelope>`;
}

function montarEnvelopeRetorno(recibo) {
  const tpAmb = process.env.NFCE_AMBIENTE === "producao" ? "1" : "2";

  return `<?xml version="1.0" encoding="UTF-8"?><soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRetAutorizacao4"><consReciNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><tpAmb>${tpAmb}</tpAmb><nRec>${recibo}</nRec></consReciNFe></nfeDadosMsg></soap12:Body></soap12:Envelope>`;
}

function extrairRetornoSefaz(xml) {
  const protNFe = extrairBloco(xml, "protNFe");
  const infProt = extrairBloco(xml, "infProt");

  const cStatProtocolo = infProt ? extrairTag(infProt, "cStat") : "";
  const motivoProtocolo = infProt ? extrairTag(infProt, "xMotivo") : "";
  const protocolo = infProt ? extrairTag(infProt, "nProt") : "";
  const dhRecbto = infProt ? extrairTag(infProt, "dhRecbto") : "";

  return {
    cStat: cStatProtocolo || extrairTag(xml, "cStat"),
    xMotivo: motivoProtocolo || extrairTag(xml, "xMotivo"),
    nProt: protocolo,
    nRec: extrairTag(xml, "nRec"),
    dhRecbto,
    protNFe,
    xmlRetorno: xml,
  };
}

async function postSefaz(url, envelope) {
  const agent = criarHttpsAgent();

  const response = await axios.post(url, envelope, {
    httpsAgent: agent,
    timeout: 60000,
    headers: {
      "Content-Type": "application/soap+xml; charset=utf-8",
    },
  });

  return response.data;
}

async function transmitirNfceParaSefaz(xmlAssinado, idLote) {
  const urls = urlsSefaz();
  const envelope = montarEnvelopeAutorizacao(xmlAssinado, idLote);
  const retornoXml = await postSefaz(urls.autorizacao, envelope);

  return extrairRetornoSefaz(retornoXml);
}

async function consultarReciboSefaz(recibo) {
  if (!recibo) {
    throw new Error("Recibo não informado para consulta SEFAZ.");
  }

  const urls = urlsSefaz();
  const envelope = montarEnvelopeRetorno(recibo);
  const retornoXml = await postSefaz(urls.retorno, envelope);

  return extrairRetornoSefaz(retornoXml);
}

module.exports = {
  transmitirNfceParaSefaz,
  consultarReciboSefaz,
};
