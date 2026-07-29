const { SignedXml } = require("xml-crypto");
const {
  obterCertificadoEChave,
} = require("./certificadoservice");

const ELEMENTOS_FISCAIS_PERMITIDOS = [
  "infNFe",
  "infEvento",
  "infInut",
];

function limparXmlParaAssinatura(xml = "") {
  return String(xml || "")
    .replace(/^\uFEFF/, "")
    .replace(/<\?xml[^>]*\?>/gi, "")
    .replace(/>\s+</g, "><")
    .trim();
}

function validarNomeElemento(nomeElemento) {
  const elemento = String(nomeElemento || "").trim();

  if (!elemento) {
    throw new Error(
      "Nome do elemento XML não informado para assinatura."
    );
  }

  if (!ELEMENTOS_FISCAIS_PERMITIDOS.includes(elemento)) {
    throw new Error(
      `O elemento XML "${elemento}" não está autorizado para assinatura fiscal.`
    );
  }

  return elemento;
}

function validarElementoNoXml(xml, nomeElemento) {
  const regexElemento = new RegExp(
    `<${nomeElemento}\\b[^>]*>`,
    "i"
  );
  const elementoEncontrado = String(xml).match(regexElemento);

  if (!elementoEncontrado) {
    throw new Error(
      `O elemento "${nomeElemento}" não foi encontrado no XML.`
    );
  }

  if (!/\bId\s*=\s*["'][^"']+["']/i.test(elementoEncontrado[0])) {
    throw new Error(
      `O elemento "${nomeElemento}" não possui o atributo Id obrigatório para assinatura.`
    );
  }
}

function criarAssinadorFiscal() {
  const { certificadoPem, chavePrivadaPem } =
    obterCertificadoEChave();

  if (!certificadoPem || !chavePrivadaPem) {
    throw new Error(
      "Certificado ou chave privada não encontrados."
    );
  }

  return new SignedXml({
    privateKey: chavePrivadaPem,
    publicCert: certificadoPem,
    signatureAlgorithm:
      "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
    canonicalizationAlgorithm:
      "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
  });
}

function assinarElementoXml(xml, nomeElemento) {
  if (!xml || !String(xml).trim()) {
    throw new Error("XML não informado para assinatura.");
  }

  const elemento = validarNomeElemento(nomeElemento);
  const xmlLimpo = limparXmlParaAssinatura(xml);
  validarElementoNoXml(xmlLimpo, elemento);

  const xpathElemento = `//*[local-name(.)='${elemento}']`;
  const assinatura = criarAssinadorFiscal();

  assinatura.addReference({
    xpath: xpathElemento,
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    ],
    digestAlgorithm:
      "http://www.w3.org/2000/09/xmldsig#sha1",
  });

  assinatura.computeSignature(xmlLimpo, {
    location: {
      reference: xpathElemento,
      action: "after",
    },
  });

  const xmlAssinado = assinatura.getSignedXml();

  if (!xmlAssinado || !xmlAssinado.includes("<Signature")) {
    throw new Error(
      `A assinatura do elemento "${elemento}" não foi gerada corretamente.`
    );
  }

  return xmlAssinado;
}

function assinarXmlNfe(xml) {
  return assinarElementoXml(xml, "infNFe");
}

function assinarXmlNfce(xml) {
  return assinarXmlNfe(xml);
}

function assinarXmlEvento(xml) {
  return assinarElementoXml(xml, "infEvento");
}

function assinarXmlInutilizacao(xml) {
  return assinarElementoXml(xml, "infInut");
}

module.exports = {
  assinarElementoXml,
  assinarXmlNfe,
  assinarXmlNfce,
  assinarXmlEvento,
  assinarXmlInutilizacao,
};
