const axios = require("axios");
const https = require("https");

/*
 * Cliente de comunicação com os Web Services da SEFAZ/PR.
 *
 * Serviços preparados:
 * - autorização de NFC-e;
 * - consulta de recibo;
 * - consulta por chave;
 * - recepção de eventos;
 * - cancelamento;
 * - inutilização;
 * - consulta de status.
 *
 * ATENÇÃO:
 * Este serviço trabalha com NFC-e modelo 65.
 */

const VERSAO_NFE = "4.00";
const CODIGO_UF_PARANA = "41";

/**
 * Retorna o ambiente fiscal utilizado pelo sistema.
 *
 * Valores aceitos:
 * - homologacao
 * - producao
 */
function obterAmbienteFiscal() {
  const ambiente = String(
    process.env.NFCE_AMBIENTE || "homologacao"
  )
    .trim()
    .toLowerCase();

  if (!["homologacao", "producao"].includes(ambiente)) {
    throw new Error(
      `NFCE_AMBIENTE inválido: "${ambiente}". Use "homologacao" ou "producao".`
    );
  }

  return ambiente;
}

/**
 * Retorna o código do ambiente esperado pela SEFAZ.
 *
 * 1 = produção
 * 2 = homologação
 */
function obterTpAmb() {
  return obterAmbienteFiscal() === "producao"
    ? "1"
    : "2";
}

/**
 * Retorna todas as URLs oficiais da NFC-e no Paraná.
 */
function urlsSefaz() {
  const ambiente = obterAmbienteFiscal();

  if (ambiente === "producao") {
    return {
      autorizacao:
        "https://nfce.sefa.pr.gov.br/nfce/NFeAutorizacao4",

      retorno:
        "https://nfce.sefa.pr.gov.br/nfce/NFeRetAutorizacao4",

      consultaProtocolo:
        "https://nfce.sefa.pr.gov.br/nfce/NFeConsultaProtocolo4",

      inutilizacao:
        "https://nfce.sefa.pr.gov.br/nfce/NFeInutilizacao4",

      statusServico:
        "https://nfce.sefa.pr.gov.br/nfce/NFeStatusServico4",

      recepcaoEvento:
        "https://nfce.sefa.pr.gov.br/nfce/NFeRecepcaoEvento4",
    };
  }

  return {
    autorizacao:
      "https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeAutorizacao4",

    retorno:
      "https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeRetAutorizacao4",

    consultaProtocolo:
      "https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeConsultaProtocolo4",

    inutilizacao:
      "https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeInutilizacao4",

    statusServico:
      "https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeStatusServico4",

    recepcaoEvento:
      "https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeRecepcaoEvento4",
  };
}

/**
 * Cria o agente HTTPS utilizando o certificado A1.
 *
 * As variáveis esperadas são:
 *
 * CERTIFICADO_PFX_BASE64
 * CERTIFICADO_SENHA
 */
function criarHttpsAgent() {
  const pfxBase64 =
    process.env.CERTIFICADO_PFX_BASE64;

  const senha =
    process.env.CERTIFICADO_SENHA;

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

  return new https.Agent({
    pfx: Buffer.from(pfxBase64, "base64"),
    passphrase: senha,

    /*
     * Mantido como false para preservar o funcionamento
     * atual da comunicação já validada no projeto.
     *
     * Posteriormente poderemos instalar corretamente
     * a cadeia de certificados da SEFAZ e alterar para true.
     */
    rejectUnauthorized: false,
  });
}

/**
 * Remove a declaração XML e espaços entre tags.
 *
 * Isso é necessário antes de inserir um XML dentro
 * de outro envelope SOAP.
 */
function removerDeclaracaoXml(xml = "") {
  return String(xml || "")
    .replace(/^\uFEFF/, "")
    .replace(/<\?xml[^>]*\?>/gi, "")
    .replace(/>\s+</g, "><")
    .trim();
}

/**
 * Escapa caracteres especiais para uso em XML.
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
 * Remove espaços e caracteres de formatação de números.
 */
function somenteNumeros(valor = "") {
  return String(valor ?? "")
    .replace(/\D/g, "");
}

/**
 * Confere se uma string XML foi informada.
 */
function validarXml(xml, descricao = "XML") {
  if (!xml || !String(xml).trim()) {
    throw new Error(
      `${descricao} não informado.`
    );
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
 * Extrai o conteúdo de uma tag XML.
 *
 * Também reconhece tags com prefixos SOAP, por exemplo:
 *
 * <soap:cStat>100</soap:cStat>
 */
function extrairTag(xml, tag) {
  if (!xml || !tag) {
    return "";
  }

  const nomeTag = String(tag)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const regex = new RegExp(
    `<(?:[\\w-]+:)?${nomeTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${nomeTag}>`,
    "i"
  );

  const match = String(xml).match(regex);

  return match
    ? String(match[1]).trim()
    : "";
}

/**
 * Extrai uma tag XML inteira, incluindo abertura
 * e fechamento.
 */
function extrairBloco(xml, tag) {
  if (!xml || !tag) {
    return "";
  }

  const nomeTag = String(tag)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const regex = new RegExp(
    `<(?:[\\w-]+:)?${nomeTag}(?:\\s[^>]*)?>[\\s\\S]*?<\\/(?:[\\w-]+:)?${nomeTag}>`,
    "i"
  );

  const match = String(xml).match(regex);

  return match
    ? String(match[0]).trim()
    : "";
}

/**
 * Extrai todos os blocos de determinada tag.
 *
 * Será importante para os eventos, pois a SEFAZ pode
 * devolver mais de um retEvento no mesmo lote.
 */
function extrairTodosBlocos(xml, tag) {
  if (!xml || !tag) {
    return [];
  }

  const nomeTag = String(tag)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const regex = new RegExp(
    `<(?:[\\w-]+:)?${nomeTag}(?:\\s[^>]*)?>[\\s\\S]*?<\\/(?:[\\w-]+:)?${nomeTag}>`,
    "gi"
  );

  return String(xml).match(regex) || [];
}

/**
 * Decodifica entidades XML mais comuns.
 */
function decodificarXml(valor = "") {
  return String(valor || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Extrai o XML efetivo retornado dentro do SOAP.
 *
 * Alguns serviços devolvem o documento diretamente.
 * Outros podem devolvê-lo codificado como texto.
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

  /*
   * Caso não exista um invólucro de resultado reconhecido,
   * devolvemos a resposta completa.
   */
  return resposta;
}

/**
 * Monta um envelope SOAP 1.2 genérico.
 *
 * @param {string} namespaceWsdl Namespace do Web Service.
 * @param {string} xmlMensagem XML fiscal enviado dentro de nfeDadosMsg.
 */
function montarEnvelopeSoap(
  namespaceWsdl,
  xmlMensagem
) {
  if (!namespaceWsdl) {
    throw new Error(
      "Namespace do Web Service não informado."
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
    `<nfeDadosMsg xmlns="${namespaceWsdl}">` +
    mensagemLimpa +
    "</nfeDadosMsg>" +
    "</soap12:Body>" +
    "</soap12:Envelope>"
  );
}

/**
 * Converte diferentes tipos de retorno do Axios
 * para texto XML.
 */
function normalizarRespostaAxios(data) {
  if (typeof data === "string") {
    return data;
  }

  if (Buffer.isBuffer(data)) {
    return data.toString("utf8");
  }

  if (
    data !== null &&
    typeof data === "object"
  ) {
    return JSON.stringify(data);
  }

  return String(data || "");
}

/**
 * Realiza o POST HTTPS para a SEFAZ.
 */
async function postSefaz(
  url,
  envelope,
  nomeServico = "SEFAZ"
) {
  if (!url) {
    throw new Error(
      `URL não configurada para o serviço ${nomeServico}.`
    );
  }

  const xmlEnvelope = validarXml(
    envelope,
    `Envelope SOAP de ${nomeServico}`
  );

  const agent = criarHttpsAgent();

  try {
    const response = await axios.post(
      url,
      xmlEnvelope,
      {
        httpsAgent: agent,
        timeout: 60000,

        /*
         * Impede que o Axios tente converter XML em JSON.
         */
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

    const xmlResposta = normalizarRespostaAxios(
      response.data
    );

    if (response.status < 200 || response.status >= 300) {
      const motivoSoap =
        extrairTag(xmlResposta, "Text") ||
        extrairTag(xmlResposta, "faultstring") ||
        extrairTag(xmlResposta, "xMotivo");

      throw new Error(
        `${nomeServico} retornou HTTP ${response.status}` +
        `${motivoSoap ? `: ${motivoSoap}` : "."}`
      );
    }

    if (!xmlResposta.trim()) {
      throw new Error(
        `${nomeServico} retornou uma resposta vazia.`
      );
    }

    const falhaSoap =
      extrairTag(xmlResposta, "faultstring") ||
      extrairTag(xmlResposta, "Text");

    if (
      falhaSoap &&
      /fault|erro|error|falha|invalid/i.test(
        xmlResposta
      )
    ) {
      throw new Error(
        `${nomeServico} recusou a requisição: ${falhaSoap}`
      );
    }

    return xmlResposta;
  } catch (error) {
    if (
      error &&
      error.message &&
      error.message.includes(nomeServico)
    ) {
      throw error;
    }

    if (error?.code === "ECONNABORTED") {
      throw new Error(
        `${nomeServico}: tempo limite de 60 segundos excedido.`
      );
    }

    if (error?.response) {
      const status = error.response.status;

      const respostaErro =
        normalizarRespostaAxios(
          error.response.data
        );

      const motivo =
        extrairTag(respostaErro, "Text") ||
        extrairTag(respostaErro, "faultstring") ||
        extrairTag(respostaErro, "xMotivo");

      throw new Error(
        `${nomeServico}: erro HTTP ${status}` +
        `${motivo ? ` — ${motivo}` : "."}`
      );
    }

    throw new Error(
      `${nomeServico}: ${error?.message || "falha desconhecida na comunicação."}`
    );
  }
}

// CONTINUA NA PARTE 2