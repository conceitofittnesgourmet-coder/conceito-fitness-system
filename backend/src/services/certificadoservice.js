const forge = require("node-forge");

function validarCertificadoA1() {
  const pfxBase64 = process.env.CERTIFICADO_PFX_BASE64;
  const senha = process.env.CERTIFICADO_SENHA;

  if (!pfxBase64 || !senha) {
    return {
      configurado: false,
      valido: false,
      message: "Certificado ou senha não configurados no ambiente.",
    };
  }

  try {
    const pfxDer = forge.util.decode64(pfxBase64);
    const p12Asn1 = forge.asn1.fromDer(pfxDer);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, senha);

    const certBags = p12.getBags({
      bagType: forge.pki.oids.certBag,
    })[forge.pki.oids.certBag];

    const cert = certBags?.[0]?.cert;

    if (!cert) {
      return {
        configurado: true,
        valido: false,
        message: "Certificado não encontrado dentro do PFX.",
      };
    }

    return {
      configurado: true,
      valido: true,
      titular: cert.subject.attributes
        .map((a) => `${a.shortName || a.name}: ${a.value}`)
        .join(" | "),
      emissor: cert.issuer.attributes
        .map((a) => `${a.shortName || a.name}: ${a.value}`)
        .join(" | "),
      validoDe: cert.validity.notBefore,
      validoAte: cert.validity.notAfter,
      message: "Certificado A1 lido com sucesso.",
    };
  } catch (error) {
    return {
      configurado: true,
      valido: false,
      message: error.message,
    };
  }
}

module.exports = {
  validarCertificadoA1,
};