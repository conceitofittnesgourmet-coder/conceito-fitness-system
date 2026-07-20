const { SignedXml } = require("xml-crypto");
const {
  obterCertificadoEChave,
} = require("./certificadoservice");

/*
 * Elementos XML fiscais que este serviço está autorizado a assinar.
 *
 * infNFe:
 *   XML normal da NF-e/NFC-e.
 *
 * infEvento:
 *   Eventos fiscais, como cancelamento.
 *
 * infInut:
 *   Pedido de inutilização de numeração.
 */
const ELEMENTOS_FISCAIS_PERMITIDOS = [
  "infNFe",
  "infEvento",
  "infInut",
];

/**
 * Remove caracteres e formatações que podem interferir
 * na assinatura do XML.
 *
 * Não remove o conteúdo interno do documento.
 */
function limparXmlParaAssinatura(xml = "") {
  return String(xml || "")
    .replace(/^\uFEFF/, "")
    .replace(/<\?xml[^>]*\?>/gi, "")
    .replace(/>\s+</g, "><")
    .trim();
}

/**
 * Confere se o elemento que será assinado é permitido.
 */
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

/**
 * Confere se o XML contém o elemento fiscal esperado
 * e se esse elemento possui o atributo Id.
 *
 * Exemplos:
 *
 * <infNFe Id="NFe...">
 * <infEvento Id="ID110111...">
 * <infInut Id="ID...">
 */
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

  const aberturaElemento = elementoEncontrado[0];

  if (!/\bId\s*=\s*["'][^"']+["']/i.test(aberturaElemento)) {
    throw new Error(
      `O elemento "${nomeElemento}" não possui o atributo Id obrigatório para assinatura.`
    );
  }
}

/**
 * Cria a configuração padrão de assinatura XML
 * utilizada pelos documentos fiscais eletrônicos.
 */
function criarAssinadorFiscal() {
  const {
    certificadoPem,
    chavePrivadaPem,
  } = obterCertificadoEChave();

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

/**
 * Assina um elemento específico do XML.
 *
 * A assinatura é posicionada imediatamente depois
 * do elemento assinado.
 *
 * @param {string} xml XML que será assinado.
 * @param {string} nomeElemento Nome do elemento.
 * @returns {string} XML assinado.
 */
function assinarElementoXml(xml, nomeElemento) {
  if (!xml || !String(xml).trim()) {
    throw new Error(
      "XML não informado para assinatura."
    );
  }

  const elemento = validarNomeElemento(nomeElemento);
  const xmlLimpo = limparXmlParaAssinatura(xml);

  validarElementoNoXml(xmlLimpo, elemento);

  const xpathElemento =
    `//*[local-name(.)='${elemento}']`;

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

/**
 * Mantém compatibilidade com o código atual da NFC-e.
 *
 * O nfceService já utiliza esta função.
 */
function assinarXmlNfce(xml) {
  return assinarElementoXml(xml, "infNFe");
}

/**
 * Assina eventos fiscais.
 *
 * Será utilizada para:
 * - cancelamento;
 * - cancelamento por substituição;
 * - outros eventos futuros.
 */
function assinarXmlEvento(xml) {
  return assinarElementoXml(xml, "infEvento");
}

/**
 * Assina pedido de inutilização.
 *
 * Já deixamos preparado para a próxima etapa fiscal.
 */
function assinarXmlInutilizacao(xml) {
  return assinarElementoXml(xml, "infInut");
}

module.exports = {
  assinarElementoXml,
  assinarXmlNfce,
  assinarXmlEvento,
  assinarXmlInutilizacao,
};