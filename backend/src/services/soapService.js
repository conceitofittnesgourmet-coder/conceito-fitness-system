const axios = require("axios");
const https = require("https");

/**
 * Serviço genérico de comunicação SOAP com a SEFAZ.
 *
 * Responsabilidades:
 * - carregar o certificado digital A1;
 * - criar o agente HTTPS;
 * - limpar e validar XML;
 * - montar envelopes SOAP 1.2;
 * - enviar requisições;
 * - tratar erros HTTP e SOAP;
 * - extrair informações básicas dos retornos.
 *
 * Este arquivo não contém regras específicas de NFC-e.
 * Ele poderá ser reutilizado por:
 * - autorização;
 * - consulta;
 * - eventos;
 * - cancelamento;
 * - inutilização;
 * - status do serviço.
 */

/**
 * Cria um agente HTTPS utilizando o certificado A1
 * armazenado nas variáveis de ambiente.
 */
function criarHttpsAgent() {
  const pfxBase64 = String(
    process.env.CERTIFICADO_PFX_BASE64 || ""
  ).trim();

  const senha = String(
    process.env.CERTIFICADO_SENHA || ""
  );

  if (!pfxBase64) {
    throw new Error(
      "CERTIFICADO_PFX_BASE64 não configurado."
    );
  }

  if (!senha) {
    throw new Error(
      "CERTIFICADO_SENHA não configurada."
    );
  }

  let pfx;

  try {
    pfx = Buffer.from(pfxBase64, "base64");
  } catch (error) {
    throw new Error(
      "Não foi possível converter o certificado PFX informado em Base64."
    );
  }

  if (!pfx.length) {
    throw new Error(
      "O certificado PFX convertido está vazio."
    );
  }

  return new https.Agent({
    pfx,
    passphrase: senha,

    /*
     * Mantido como false para preservar o comportamento
     * atual já utilizado pelo projeto.
     *
     * Em uma etapa posterior, poderemos configurar toda
     * a cadeia certificadora e alterar para true.
     */
    rejectUnauthorized: false,
  });
}

/**
 * Remove declaração XML, BOM e espaços entre tags.
 */
function removerDeclaracaoXml(xml = "") {
  return String(xml || "")
    .replace(/^\uFEFF/, "")
    .replace(/<\?xml[^>]*\?>/gi, "")
    .replace(/>\s+</g, "><")
    .trim();
}

/**
 * Valida uma mensagem XML.
 */
function validarXml(xml, descricao = "XML") {
  if (!xml || !String(xml).trim()) {
    throw new Error(`${descricao} não informado.`);
  }

  const xmlLimpo = removerDeclaracaoXml(xml);

  if (
    !xmlLimpo.startsWith("<") ||
    !xmlLimpo.endsWith(">")
  ) {
    throw new Error(
      `${descricao} inválido ou incompleto.`
    );
  }

  return xmlLimpo;
}

/**
 * Escapa caracteres especiais para uso dentro do XML.
 */
function escaparXml(valor = "") {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Remove todos os caracteres que não sejam números.
 */
function somenteNumeros(valor = "") {
  return String(valor ?? "").replace(/\D/g, "");
}

/**
 * Escapa caracteres especiais usados em expressões regulares.
 */
function escaparRegex(valor = "") {
  return String(valor).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/**
 * Extrai apenas o conteúdo de uma tag.
 *
 * Aceita tags normais:
 * <cStat>100</cStat>
 *
 * E tags com namespace:
 * <soap:cStat>100</soap:cStat>
 */
function extrairTag(xml, tag) {
  if (!xml || !tag) {
    return "";
  }

  const nomeTag = escaparRegex(tag);

  const regex = new RegExp(
    `<(?:[\\w-]+:)?${nomeTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${nomeTag}>`,
    "i"
  );

  const resultado = String(xml).match(regex);

  return resultado
    ? String(resultado[1]).trim()
    : "";
}

/**
 * Extrai um bloco XML completo.
 */
function extrairBloco(xml, tag) {
  if (!xml || !tag) {
    return "";
  }

  const nomeTag = escaparRegex(tag);

  const regex = new RegExp(
    `<(?:[\\w-]+:)?${nomeTag}(?:\\s[^>]*)?>[\\s\\S]*?<\\/(?:[\\w-]+:)?${nomeTag}>`,
    "i"
  );

  const resultado = String(xml).match(regex);

  return resultado
    ? String(resultado[0]).trim()
    : "";
}

/**
 * Extrai todos os blocos XML de determinada tag.
 */
function extrairTodosBlocos(xml, tag) {
  if (!xml || !tag) {
    return [];
  }

  const nomeTag = escaparRegex(tag);

  const regex = new RegExp(
    `<(?:[\\w-]+:)?${nomeTag}(?:\\s[^>]*)?>[\\s\\S]*?<\\/(?:[\\w-]+:)?${nomeTag}>`,
    "gi"
  );

  return String(xml).match(regex) || [];
}

/**
 * Decodifica entidades XML básicas.
 */
function decodificarXml(valor = "") {
  return String(valor || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Monta o envelope SOAP 1.2 utilizado pelos
 * Web Services da NF-e/NFC-e.
 */
function montarEnvelopeSoap(
  namespaceWsdl,
  xmlMensagem
) {
  const namespace = String(
    namespaceWsdl || ""
  ).trim();

  if (!namespace) {
    throw new Error(
      "Namespace WSDL não informado para o envelope SOAP."
    );
  }

  const mensagemLimpa = validarXml(
    xmlMensagem,
    "Mensagem XML da SEFAZ"
  );

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<soap12:Envelope ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
    'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ' +
    'xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
    "<soap12:Body>" +
    `<nfeDadosMsg xmlns="${namespace}">` +
    mensagemLimpa +
    "</nfeDadosMsg>" +
    "</soap12:Body>" +
    "</soap12:Envelope>"
  );
}

/**
 * Normaliza os diferentes formatos que o Axios
 * pode retornar.
 */
function normalizarRespostaAxios(data) {
  if (typeof data === "string") {
    return data;
  }

  if (Buffer.isBuffer(data)) {
    return data.toString("utf8");
  }

  if (
    data !== undefined &&
    data !== null &&
    typeof data === "object"
  ) {
    return JSON.stringify(data);
  }

  return String(data || "");
}

/**
 * Tenta encontrar uma mensagem de erro SOAP.
 */
function extrairFalhaSoap(xml = "") {
  return (
    extrairTag(xml, "faultstring") ||
    extrairTag(xml, "Text") ||
    extrairTag(xml, "Reason") ||
    ""
  );
}

/**
 * Confere se o retorno contém uma falha SOAP.
 */
function possuiFalhaSoap(xml = "") {
  const conteudo = String(xml || "");

  return (
    /<(?:[\w-]+:)?Fault(?:\s|>)/i.test(conteudo) ||
    /<(?:[\w-]+:)?faultstring(?:\s|>)/i.test(
      conteudo
    )
  );
}

/**
 * Extrai o conteúdo fiscal retornado dentro
 * do envelope SOAP.
 *
 * Quando não encontra um invólucro conhecido,
 * devolve a resposta integral.
 */
function extrairConteudoSoap(xmlSoap = "") {
  const resposta = String(xmlSoap || "").trim();

  if (!resposta) {
    return "";
  }

  const tagsPossiveis = [
    "nfeResultMsg",
    "nfeDadosMsgResult",
    "NFeAutorizacao4Result",
    "NFeRetAutorizacao4Result",
    "NFeConsultaProtocolo4Result",
    "NFeRecepcaoEvento4Result",
    "NFeInutilizacao4Result",
    "NFeStatusServico4Result",
  ];

  for (const tag of tagsPossiveis) {
    const conteudo = extrairTag(resposta, tag);

    if (conteudo) {
      return decodificarXml(conteudo).trim();
    }
  }

  return resposta;
}

/**
 * Realiza a comunicação HTTPS com a SEFAZ.
 *
 * @param {object} parametros
 * @param {string} parametros.url URL do serviço.
 * @param {string} parametros.envelope Envelope SOAP.
 * @param {string} parametros.nomeServico Nome para logs e erros.
 * @param {number} parametros.timeout Tempo limite em milissegundos.
 *
 * @returns {Promise<object>}
 */
async function postSoapSefaz({
  url,
  envelope,
  nomeServico = "Serviço SEFAZ",
  timeout = 60000,
}) {
  const urlServico = String(url || "").trim();

  if (!urlServico) {
    throw new Error(
      `URL não configurada para ${nomeServico}.`
    );
  }

  if (
    !/^https:\/\//i.test(urlServico)
  ) {
    throw new Error(
      `A URL de ${nomeServico} deve utilizar HTTPS.`
    );
  }

  const envelopeValidado = validarXml(
    envelope,
    `Envelope SOAP de ${nomeServico}`
  );

  const httpsAgent = criarHttpsAgent();

  try {
    const response = await axios.post(
      urlServico,
      envelopeValidado,
      {
        httpsAgent,
        timeout,

        responseType: "text",

        transformResponse: [
          (data) => data,
        ],

        maxContentLength: Infinity,
        maxBodyLength: Infinity,

        headers: {
          "Content-Type":
            "application/soap+xml; charset=utf-8",

          Accept:
            "application/soap+xml, application/xml, text/xml, */*",

          "User-Agent":
            "Conceito-Fitness-Gourmet-NFCe/1.0",
        },

        validateStatus(status) {
          return status >= 200 && status < 500;
        },
      }
    );

    const xmlSoap = normalizarRespostaAxios(
      response.data
    );

    if (
      response.status < 200 ||
      response.status >= 300
    ) {
      const falha =
        extrairFalhaSoap(xmlSoap) ||
        extrairTag(xmlSoap, "xMotivo");

      throw new Error(
        `${nomeServico} retornou HTTP ${response.status}` +
          `${falha ? `: ${falha}` : "."}`
      );
    }

    if (!xmlSoap.trim()) {
      throw new Error(
        `${nomeServico} retornou uma resposta vazia.`
      );
    }

    if (possuiFalhaSoap(xmlSoap)) {
      const falha =
        extrairFalhaSoap(xmlSoap) ||
        "Falha SOAP sem descrição.";

      throw new Error(
        `${nomeServico} recusou a requisição: ${falha}`
      );
    }

    const xmlConteudo =
      extrairConteudoSoap(xmlSoap);

    return {
      statusHttp: response.status,
      xmlSoap,
      xmlConteudo,
    };
  } catch (error) {
    if (
      error?.message &&
      error.message.includes(nomeServico)
    ) {
      throw error;
    }

    if (error?.code === "ECONNABORTED") {
      throw new Error(
        `${nomeServico}: tempo limite de ${timeout} ms excedido.`
      );
    }

    if (error?.response) {
      const status =
        error.response.status || "desconhecido";

      const xmlErro = normalizarRespostaAxios(
        error.response.data
      );

      const motivo =
        extrairFalhaSoap(xmlErro) ||
        extrairTag(xmlErro, "xMotivo");

      throw new Error(
        `${nomeServico}: erro HTTP ${status}` +
          `${motivo ? ` — ${motivo}` : "."}`
      );
    }

    throw new Error(
      `${nomeServico}: ${
        error?.message ||
        "falha desconhecida na comunicação."
      }`
    );
  }
}

/**
 * Atalho que monta o envelope e envia a requisição.
 */
async function enviarMensagemSefaz({
  url,
  namespaceWsdl,
  xmlMensagem,
  nomeServico = "Serviço SEFAZ",
  timeout = 60000,
}) {
  const envelope = montarEnvelopeSoap(
    namespaceWsdl,
    xmlMensagem
  );

  return postSoapSefaz({
    url,
    envelope,
    nomeServico,
    timeout,
  });
}

module.exports = {
  criarHttpsAgent,
  removerDeclaracaoXml,
  validarXml,
  escaparXml,
  somenteNumeros,
  extrairTag,
  extrairBloco,
  extrairTodosBlocos,
  decodificarXml,
  montarEnvelopeSoap,
  normalizarRespostaAxios,
  extrairFalhaSoap,
  possuiFalhaSoap,
  extrairConteudoSoap,
  postSoapSefaz,
  enviarMensagemSefaz,
};