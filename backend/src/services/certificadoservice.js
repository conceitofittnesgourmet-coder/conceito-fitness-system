const forge = require("node-forge");

function carregarP12() {
  const pfxBase64 = process.env.CERTIFICADO_PFX_BASE64;
  const senha = process.env.CERTIFICADO_SENHA;

  if (!pfxBase64 || !senha) {
    throw new Error("Certificado ou senha não configurados no ambiente.");
  }

  const pfxDer = forge.util.decode64(pfxBase64);
  const p12Asn1 = forge.asn1.fromDer(pfxDer);

  return forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, senha);
}

function obterCertificadoEChave() {
  const p12 = carregarP12();

  const certBags = p12.getBags({
    bagType: forge.pki.oids.certBag,
  })[forge.pki.oids.certBag];

  const keyBags = p12.getBags({
    bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
  })[forge.pki.oids.pkcs8ShroudedKeyBag];

  const cert = certBags?.[0]?.cert;
  const key = keyBags?.[0]?.key;

  if (!cert) {
    throw new Error("Certificado não encontrado dentro do PFX.");
  }

  if (!key) {
    throw new Error("Chave privada não encontrada dentro do PFX.");
  }

  return {
    certificadoPem: forge.pki.certificateToPem(cert),
    chavePrivadaPem: forge.pki.privateKeyToPem(key),
    certificado: cert,
  };
}

function validarCertificadoA1() {
  try {
    const { certificado } = obterCertificadoEChave();

    return {
      configurado: true,
      valido: true,
      titular: certificado.subject.attributes
        .map((a) => `${a.shortName || a.name}: ${a.value}`)
        .join(" | "),
      emissor: certificado.issuer.attributes
        .map((a) => `${a.shortName || a.name}: ${a.value}`)
        .join(" | "),
      validoDe: certificado.validity.notBefore,
      validoAte: certificado.validity.notAfter,
      message: "Certificado A1 lido com sucesso.",
    };
  } catch (error) {
    return {
      configurado: Boolean(process.env.CERTIFICADO_PFX_BASE64),
      valido: false,
      message: error.message,
    };
  }
}

module.exports = {
  validarCertificadoA1,
  obterCertificadoEChave,
};