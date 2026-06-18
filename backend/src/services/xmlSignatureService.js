const { SignedXml } = require("xml-crypto");
const { obterCertificadoEChave } = require("./certificadoservice");

function assinarXmlNfce(xml) {
  const { certificadoPem, chavePrivadaPem } = obterCertificadoEChave();

  const assinatura = new SignedXml({
    privateKey: chavePrivadaPem,
    publicCert: certificadoPem,
    signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
    canonicalizationAlgorithm:
      "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
  });

  assinatura.addReference({
    xpath: "//*[local-name(.)='infNFe']",
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    ],
    digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1",
  });

  assinatura.computeSignature(xml, {
    location: {
  reference: "//*[local-name(.)='infNFeSupl']",
  action: "after",
},
  });

  return assinatura.getSignedXml();
}

module.exports = {
  assinarXmlNfce,
};