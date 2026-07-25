const {
  enviarMensagemSefaz,
  removerDeclaracaoXml,
  validarXml,
  somenteNumeros,
  extrairTag,
  extrairBloco,
} = require("./soapService");

const UF_PR = "41";
const VERSAO_NFE = "4.00";
const MODELO_NFCE = "65";

const NAMESPACE_NFE =
  "http://www.portalfiscal.inf.br/nfe";

const NAMESPACES_WSDL = {
  autorizacao:
    "http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4",

  retornoAutorizacao:
    "http://www.portalfiscal.inf.br/nfe/wsdl/NFeRetAutorizacao4",

  consultaProtocolo:
    "http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4",

  statusServico:
    "http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4",
};

/**
 * Normaliza o ambiente fiscal utilizado pela NFC-e.
 *
 * Valores aceitos:
 * - homologacao
 * - homologação
 * - 2
 * - producao
 * - produção
 * - 1
 */
function normalizarAmbiente(
  ambiente = process.env.NFCE_AMBIENTE
) {
  const valor = String(
    ambiente || "homologacao"
  )
    .trim()
    .toLowerCase();

  if (
    ["producao", "produção", "1"].includes(valor)
  ) {
    return "producao";
  }

  if (
    [
      "homologacao",
      "homologação",
      "2",
      "",
    ].includes(valor)
  ) {
    return "homologacao";
  }

  throw new Error(
    `NFCE_AMBIENTE inválido: "${ambiente}". ` +
      'Use "homologacao" ou "producao".'
  );
}

/**
 * Retorna o código do ambiente utilizado pela SEFAZ.
 *
 * 1 = produção
 * 2 = homologação
 */
function obterTpAmb(ambiente) {
  return normalizarAmbiente(ambiente) ===
    "producao"
    ? "1"
    : "2";
}

/**
 * Retorna as URLs dos serviços da NFC-e no Paraná.
 *
 * As URLs podem ser sobrescritas por variáveis
 * de ambiente quando necessário.
 */
function obterUrlsSefaz(
  ambiente = process.env.NFCE_AMBIENTE
) {
  const ambienteNormalizado =
    normalizarAmbiente(ambiente);

  if (ambienteNormalizado === "producao") {
    return {
      autorizacao:
        process.env
          .NFCE_URL_AUTORIZACAO_PRODUCAO ||
        "https://nfce.sefa.pr.gov.br/nfce/NFeAutorizacao4",

      retornoAutorizacao:
        process.env
          .NFCE_URL_RETORNO_AUTORIZACAO_PRODUCAO ||
        "https://nfce.sefa.pr.gov.br/nfce/NFeRetAutorizacao4",

      consultaProtocolo:
        process.env
          .NFCE_URL_CONSULTA_PROTOCOLO_PRODUCAO ||
        "https://nfce.sefa.pr.gov.br/nfce/NFeConsultaProtocolo4",

      statusServico:
        process.env
          .NFCE_URL_STATUS_SERVICO_PRODUCAO ||
        "https://nfce.sefa.pr.gov.br/nfce/NFeStatusServico4",
    };
  }

  return {
    autorizacao:
      process.env
        .NFCE_URL_AUTORIZACAO_HOMOLOGACAO ||
      "https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeAutorizacao4",

    retornoAutorizacao:
      process.env
        .NFCE_URL_RETORNO_AUTORIZACAO_HOMOLOGACAO ||
      "https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeRetAutorizacao4",

    consultaProtocolo:
      process.env
        .NFCE_URL_CONSULTA_PROTOCOLO_HOMOLOGACAO ||
      "https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeConsultaProtocolo4",

    statusServico:
      process.env
        .NFCE_URL_STATUS_SERVICO_HOMOLOGACAO ||
      "https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeStatusServico4",
  };
}

/**
 * Retorna o XML fiscal presente na resposta SOAP.
 */
function obterXmlFiscal(resposta = {}) {
  return (
    String(
      resposta.xmlConteudo || ""
    ).trim() ||
    String(
      resposta.xmlSoap || ""
    ).trim()
  );
}

/**
 * Extrai os dados presentes dentro de protNFe/infProt.
 */
function extrairDadosProtocolo(xml = "") {
  const blocoProtNFe =
    extrairBloco(xml, "protNFe");

  const blocoInfProt =
    extrairBloco(
      blocoProtNFe || xml,
      "infProt"
    ) ||
    blocoProtNFe ||
    xml;

  return {
    tpAmb:
      extrairTag(blocoInfProt, "tpAmb"),

    verAplic:
      extrairTag(blocoInfProt, "verAplic"),

    chNFe:
      extrairTag(blocoInfProt, "chNFe"),

    dhRecbto:
      extrairTag(blocoInfProt, "dhRecbto"),

    nProt:
      extrairTag(blocoInfProt, "nProt"),

    digVal:
      extrairTag(blocoInfProt, "digVal"),

    cStat:
      extrairTag(blocoInfProt, "cStat"),

    xMotivo:
      extrairTag(blocoInfProt, "xMotivo"),
  };
}

/**
 * Interpreta o retorno da autorização
 * ou da consulta de recibo.
 */
function interpretarRetornoAutorizacao(
  resposta = {}
) {
  const xml = obterXmlFiscal(resposta);

  if (!xml) {
    throw new Error(
      "A SEFAZ retornou uma resposta vazia " +
        "na autorização da NFC-e."
    );
  }

  const protocolo =
    extrairDadosProtocolo(xml);

  const cStatLote =
    extrairTag(xml, "cStat");

  const xMotivoLote =
    extrairTag(xml, "xMotivo");

  const nRec =
    extrairTag(xml, "nRec");

  const tMed =
    extrairTag(xml, "tMed");

  return {
    cStat:
      protocolo.cStat ||
      cStatLote ||
      "",

    xMotivo:
      protocolo.xMotivo ||
      xMotivoLote ||
      "Retorno da SEFAZ recebido.",

    cStatLote:
      cStatLote || "",

    xMotivoLote:
      xMotivoLote || "",

    nRec:
      nRec || "",

    tMed:
      tMed || "",

    ...protocolo,

    xmlRetorno:
      xml,

    xmlSoap:
      resposta.xmlSoap || "",
  };
}

/**
 * Monta o lote de autorização enviNFe.
 */
function montarEnviNFe(
  xmlNfceAssinado,
  idLote
) {
  const xmlLimpo = validarXml(
    xmlNfceAssinado,
    "XML assinado da NFC-e"
  );

  if (!/<NFe\b/i.test(xmlLimpo)) {
    throw new Error(
      "O XML informado não contém " +
        "o elemento NFe."
    );
  }

  if (!/<Signature\b/i.test(xmlLimpo)) {
    throw new Error(
      "O XML da NFC-e não contém " +
        "assinatura digital."
    );
  }

  const lote = somenteNumeros(idLote);

  if (!lote || lote.length > 15) {
    throw new Error(
      "O identificador do lote deve conter " +
        "entre 1 e 15 dígitos."
    );
  }

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<enviNFe xmlns="${NAMESPACE_NFE}" ` +
    `versao="${VERSAO_NFE}">` +
    `<idLote>${lote.padStart(
      15,
      "0"
    )}</idLote>` +
    "<indSinc>1</indSinc>" +
    removerDeclaracaoXml(xmlLimpo) +
    "</enviNFe>"
  );
}

/**
 * Transmite uma NFC-e assinada para a SEFAZ/PR.
 */
async function transmitirNfceParaSefaz(
  xmlNfceAssinado,
  idLote,
  ambiente = process.env.NFCE_AMBIENTE
) {
  const ambienteNormalizado =
    normalizarAmbiente(ambiente);

  const urls =
    obterUrlsSefaz(
      ambienteNormalizado
    );

  const xmlMensagem =
    montarEnviNFe(
      xmlNfceAssinado,
      idLote
    );

  const resposta =
    await enviarMensagemSefaz({
      url:
        urls.autorizacao,

      namespaceWsdl:
        NAMESPACES_WSDL.autorizacao,

      xmlMensagem,

      nomeServico:
        "Autorização da NFC-e",

      timeout:
        60000,
    });

  return {
    ...interpretarRetornoAutorizacao(
      resposta
    ),

    ambiente:
      ambienteNormalizado,

    idLote:
      somenteNumeros(
        idLote
      ).padStart(15, "0"),

    xmlLote:
      xmlMensagem,
  };
}

/**
 * Valida o número do recibo retornado pela SEFAZ.
 */
function validarNumeroRecibo(
  numeroRecibo
) {
  const recibo =
    somenteNumeros(numeroRecibo);

  if (!recibo) {
    throw new Error(
      "Número do recibo da NFC-e " +
        "não informado."
    );
  }

  if (recibo.length > 15) {
    throw new Error(
      "Número do recibo da NFC-e inválido."
    );
  }

  return recibo;
}

/**
 * Monta o XML de consulta do recibo.
 */
function montarConsReciNFe(
  numeroRecibo,
  ambiente
) {
  const recibo =
    validarNumeroRecibo(
      numeroRecibo
    );

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<consReciNFe ` +
    `xmlns="${NAMESPACE_NFE}" ` +
    `versao="${VERSAO_NFE}">` +
    `<tpAmb>${obterTpAmb(
      ambiente
    )}</tpAmb>` +
    `<nRec>${recibo}</nRec>` +
    "</consReciNFe>"
  );
}

/**
 * Consulta o resultado de um recibo
 * de autorização da NFC-e.
 */
async function consultarReciboSefaz(
  numeroRecibo,
  ambiente = process.env.NFCE_AMBIENTE
) {
  const ambienteNormalizado =
    normalizarAmbiente(ambiente);

  const urls =
    obterUrlsSefaz(
      ambienteNormalizado
    );

  const xmlMensagem =
    montarConsReciNFe(
      numeroRecibo,
      ambienteNormalizado
    );

  const resposta =
    await enviarMensagemSefaz({
      url:
        urls.retornoAutorizacao,

      namespaceWsdl:
        NAMESPACES_WSDL
          .retornoAutorizacao,

      xmlMensagem,

      nomeServico:
        "Consulta do recibo da NFC-e",

      timeout:
        60000,
    });

  return {
    ...interpretarRetornoAutorizacao(
      resposta
    ),

    ambiente:
      ambienteNormalizado,

    nRec:
      extrairTag(
        obterXmlFiscal(resposta),
        "nRec"
      ) ||
      validarNumeroRecibo(
        numeroRecibo
      ),
  };
}

/**
 * Valida uma chave de acesso de NFC-e do Paraná.
 */
function validarChaveAcesso(
  chaveAcesso
) {
  const chave =
    somenteNumeros(chaveAcesso);

  if (chave.length !== 44) {
    throw new Error(
      "A chave de acesso deve possuir " +
        "exatamente 44 dígitos."
    );
  }

  if (chave.slice(0, 2) !== UF_PR) {
    throw new Error(
      "A chave de acesso informada " +
        "não pertence ao Paraná."
    );
  }

  if (
    chave.slice(20, 22) !==
    MODELO_NFCE
  ) {
    throw new Error(
      "A chave de acesso informada " +
        "não pertence a uma NFC-e " +
        "modelo 65."
    );
  }

  return chave;
}

/**
 * Monta o XML de consulta da NFC-e por chave.
 */
function montarConsSitNFe(
  chaveAcesso,
  ambiente
) {
  const chave =
    validarChaveAcesso(
      chaveAcesso
    );

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<consSitNFe ` +
    `xmlns="${NAMESPACE_NFE}" ` +
    `versao="${VERSAO_NFE}">` +
    `<tpAmb>${obterTpAmb(
      ambiente
    )}</tpAmb>` +
    "<xServ>CONSULTAR</xServ>" +
    `<chNFe>${chave}</chNFe>` +
    "</consSitNFe>"
  );
}

/**
 * Consulta uma NFC-e diretamente pela chave.
 */
async function consultarNfcePorChave(
  chaveAcesso,
  ambiente = process.env.NFCE_AMBIENTE
) {
  const ambienteNormalizado =
    normalizarAmbiente(ambiente);

  const urls =
    obterUrlsSefaz(
      ambienteNormalizado
    );

  const xmlMensagem =
    montarConsSitNFe(
      chaveAcesso,
      ambienteNormalizado
    );

  const resposta =
    await enviarMensagemSefaz({
      url:
        urls.consultaProtocolo,

      namespaceWsdl:
        NAMESPACES_WSDL
          .consultaProtocolo,

      xmlMensagem,

      nomeServico:
        "Consulta da NFC-e por chave",

      timeout:
        60000,
    });

  const xml =
    obterXmlFiscal(resposta);

  const protocolo =
    extrairDadosProtocolo(xml);

  const cStatConsulta =
    extrairTag(xml, "cStat");

  const xMotivoConsulta =
    extrairTag(xml, "xMotivo");

  return {
    cStat:
      protocolo.cStat ||
      cStatConsulta ||
      "",

    xMotivo:
      protocolo.xMotivo ||
      xMotivoConsulta ||
      "Consulta da NFC-e concluída.",

    cStatConsulta:
      cStatConsulta || "",

    xMotivoConsulta:
      xMotivoConsulta || "",

    ...protocolo,

    ambiente:
      ambienteNormalizado,

    chaveAcesso:
      validarChaveAcesso(
        chaveAcesso
      ),

    xmlRetorno:
      xml,

    xmlSoap:
      resposta.xmlSoap || "",
  };
}

/**
 * Monta o XML de consulta do status
 * dos serviços da NFC-e.
 */
function montarConsStatServ(
  ambiente
) {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<consStatServ ` +
    `xmlns="${NAMESPACE_NFE}" ` +
    `versao="${VERSAO_NFE}">` +
    `<tpAmb>${obterTpAmb(
      ambiente
    )}</tpAmb>` +
    `<cUF>${UF_PR}</cUF>` +
    "<xServ>STATUS</xServ>" +
    "</consStatServ>"
  );
}

/**
 * Consulta o status do serviço NFC-e da SEFAZ/PR.
 */
async function consultarStatusServico(
  ambiente = process.env.NFCE_AMBIENTE
) {
  const ambienteNormalizado =
    normalizarAmbiente(ambiente);

  const urls =
    obterUrlsSefaz(
      ambienteNormalizado
    );

  const resposta =
    await enviarMensagemSefaz({
      url:
        urls.statusServico,

      namespaceWsdl:
        NAMESPACES_WSDL
          .statusServico,

      xmlMensagem:
        montarConsStatServ(
          ambienteNormalizado
        ),

      nomeServico:
        "Status do serviço NFC-e",

      timeout:
        30000,
    });

  const xml =
    obterXmlFiscal(resposta);

  return {
    tpAmb:
      extrairTag(xml, "tpAmb"),

    verAplic:
      extrairTag(xml, "verAplic"),

    cStat:
      extrairTag(xml, "cStat"),

    xMotivo:
      extrairTag(
        xml,
        "xMotivo"
      ) ||
      "Consulta de status concluída.",

    cUF:
      extrairTag(xml, "cUF"),

    dhRecbto:
      extrairTag(xml, "dhRecbto"),

    tMed:
      extrairTag(xml, "tMed"),

    dhRetorno:
      extrairTag(xml, "dhRetorno"),

    xObs:
      extrairTag(xml, "xObs"),

    ambiente:
      ambienteNormalizado,

    xmlRetorno:
      xml,

    xmlSoap:
      resposta.xmlSoap || "",
  };
}

module.exports = {
  UF_PR,
  VERSAO_NFE,
  MODELO_NFCE,
  NAMESPACES_WSDL,

  normalizarAmbiente,
  obterTpAmb,
  obterUrlsSefaz,

  extrairDadosProtocolo,
  interpretarRetornoAutorizacao,

  montarEnviNFe,
  transmitirNfceParaSefaz,

  validarNumeroRecibo,
  montarConsReciNFe,
  consultarReciboSefaz,

  validarChaveAcesso,
  montarConsSitNFe,
  consultarNfcePorChave,

  montarConsStatServ,
  consultarStatusServico,
};