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
const MODELO_NFE = "55";
const MODELO_NFCE = "65";

const NAMESPACE_NFE = "http://www.portalfiscal.inf.br/nfe";

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

function normalizarModelo(modelo = MODELO_NFCE) {
  const valor = somenteNumeros(modelo);

  if (![MODELO_NFE, MODELO_NFCE].includes(valor)) {
    throw new Error(
      `Modelo fiscal inválido: "${modelo}". Use 55 para NF-e ou 65 para NFC-e.`
    );
  }

  return valor;
}

function nomeDocumento(modelo) {
  return normalizarModelo(modelo) === MODELO_NFE ? "NF-e" : "NFC-e";
}

function obterAmbientePadrao(modelo = MODELO_NFCE) {
  const modeloNormalizado = normalizarModelo(modelo);

  if (modeloNormalizado === MODELO_NFE) {
    return (
      process.env.NFE_AMBIENTE ||
      process.env.SEFAZ_AMBIENTE ||
      process.env.NFCE_AMBIENTE ||
      "homologacao"
    );
  }

  return (
    process.env.NFCE_AMBIENTE ||
    process.env.SEFAZ_AMBIENTE ||
    process.env.NFE_AMBIENTE ||
    "homologacao"
  );
}

function normalizarAmbiente(ambiente) {
  const valor = String(ambiente || "homologacao")
    .trim()
    .toLowerCase();

  if (["producao", "produção", "1"].includes(valor)) {
    return "producao";
  }

  if (["homologacao", "homologação", "2", ""].includes(valor)) {
    return "homologacao";
  }

  throw new Error(
    `Ambiente fiscal inválido: "${ambiente}". ` +
      'Use "homologacao" ou "producao".'
  );
}

function obterTpAmb(ambiente) {
  return normalizarAmbiente(ambiente) === "producao" ? "1" : "2";
}

function variavelUrl(modelo, servico, ambiente) {
  const prefixo = normalizarModelo(modelo) === MODELO_NFE ? "NFE" : "NFCE";
  return `${prefixo}_URL_${servico}_${ambiente.toUpperCase()}`;
}

function obterUrlsSefaz(modelo = MODELO_NFCE, ambiente) {
  // Compatibilidade com chamadas antigas: obterUrlsSefaz("homologacao")
  if (![MODELO_NFE, MODELO_NFCE].includes(somenteNumeros(modelo))) {
    ambiente = modelo;
    modelo = MODELO_NFCE;
  }

  const modeloNormalizado = normalizarModelo(modelo);
  const ambienteNormalizado = normalizarAmbiente(
    ambiente || obterAmbientePadrao(modeloNormalizado)
  );

  const host =
    modeloNormalizado === MODELO_NFE
      ? ambienteNormalizado === "producao"
        ? "https://nfe.sefa.pr.gov.br/nfe"
        : "https://homologacao.nfe.sefa.pr.gov.br/nfe"
      : ambienteNormalizado === "producao"
        ? "https://nfce.sefa.pr.gov.br/nfce"
        : "https://homologacao.nfce.sefa.pr.gov.br/nfce";

  return {
    autorizacao:
      process.env[
        variavelUrl(modeloNormalizado, "AUTORIZACAO", ambienteNormalizado)
      ] || `${host}/NFeAutorizacao4`,

    retornoAutorizacao:
      process.env[
        variavelUrl(
          modeloNormalizado,
          "RETORNO_AUTORIZACAO",
          ambienteNormalizado
        )
      ] || `${host}/NFeRetAutorizacao4`,

    consultaProtocolo:
      process.env[
        variavelUrl(
          modeloNormalizado,
          "CONSULTA_PROTOCOLO",
          ambienteNormalizado
        )
      ] || `${host}/NFeConsultaProtocolo4`,

    statusServico:
      process.env[
        variavelUrl(
          modeloNormalizado,
          "STATUS_SERVICO",
          ambienteNormalizado
        )
      ] || `${host}/NFeStatusServico4`,
  };
}

function obterXmlFiscal(resposta = {}) {
  return (
    String(resposta.xmlConteudo || "").trim() ||
    String(resposta.xmlSoap || "").trim()
  );
}

function extrairDadosProtocolo(xml = "") {
  const blocoProtNFe = extrairBloco(xml, "protNFe");
  const blocoInfProt =
    extrairBloco(blocoProtNFe || xml, "infProt") || blocoProtNFe || xml;

  return {
    tpAmb: extrairTag(blocoInfProt, "tpAmb"),
    verAplic: extrairTag(blocoInfProt, "verAplic"),
    chNFe: extrairTag(blocoInfProt, "chNFe"),
    dhRecbto: extrairTag(blocoInfProt, "dhRecbto"),
    nProt: extrairTag(blocoInfProt, "nProt"),
    digVal: extrairTag(blocoInfProt, "digVal"),
    cStat: extrairTag(blocoInfProt, "cStat"),
    xMotivo: extrairTag(blocoInfProt, "xMotivo"),
  };
}

function interpretarRetornoAutorizacao(resposta = {}, modelo = MODELO_NFCE) {
  const xml = obterXmlFiscal(resposta);
  const documento = nomeDocumento(modelo);

  if (!xml) {
    throw new Error(
      `A SEFAZ retornou uma resposta vazia na autorização da ${documento}.`
    );
  }

  const protocolo = extrairDadosProtocolo(xml);
  const cStatLote = extrairTag(xml, "cStat");
  const xMotivoLote = extrairTag(xml, "xMotivo");

  return {
    cStat: protocolo.cStat || cStatLote || "",
    xMotivo:
      protocolo.xMotivo || xMotivoLote || "Retorno da SEFAZ recebido.",
    cStatLote: cStatLote || "",
    xMotivoLote: xMotivoLote || "",
    nRec: extrairTag(xml, "nRec") || "",
    tMed: extrairTag(xml, "tMed") || "",
    ...protocolo,
    xmlRetorno: xml,
    xmlSoap: resposta.xmlSoap || "",
  };
}

function montarEnviNFe(xmlAssinado, idLote, modelo = MODELO_NFCE) {
  const modeloNormalizado = normalizarModelo(modelo);
  const documento = nomeDocumento(modeloNormalizado);
  const xmlLimpo = validarXml(xmlAssinado, `XML assinado da ${documento}`);

  if (!/<NFe\b/i.test(xmlLimpo)) {
    throw new Error("O XML informado não contém o elemento NFe.");
  }

  if (!/<Signature\b/i.test(xmlLimpo)) {
    throw new Error(`O XML da ${documento} não contém assinatura digital.`);
  }

  const modeloXml = extrairTag(xmlLimpo, "mod");
  if (modeloXml && modeloXml !== modeloNormalizado) {
    throw new Error(
      `O XML informado é do modelo ${modeloXml}, mas a transmissão foi solicitada para o modelo ${modeloNormalizado}.`
    );
  }

  const lote = somenteNumeros(idLote);
  if (!lote || lote.length > 15) {
    throw new Error(
      "O identificador do lote deve conter entre 1 e 15 dígitos."
    );
  }

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<enviNFe xmlns="${NAMESPACE_NFE}" versao="${VERSAO_NFE}">` +
    `<idLote>${lote.padStart(15, "0")}</idLote>` +
    "<indSinc>1</indSinc>" +
    removerDeclaracaoXml(xmlLimpo) +
    "</enviNFe>"
  );
}

async function transmitirDocumentoFiscal({
  xmlAssinado,
  idLote,
  modelo = MODELO_NFCE,
  ambiente,
}) {
  const modeloNormalizado = normalizarModelo(modelo);
  const documento = nomeDocumento(modeloNormalizado);
  const ambienteNormalizado = normalizarAmbiente(
    ambiente || obterAmbientePadrao(modeloNormalizado)
  );
  const urls = obterUrlsSefaz(modeloNormalizado, ambienteNormalizado);
  const xmlMensagem = montarEnviNFe(
    xmlAssinado,
    idLote,
    modeloNormalizado
  );

  const resposta = await enviarMensagemSefaz({
    url: urls.autorizacao,
    namespaceWsdl: NAMESPACES_WSDL.autorizacao,
    xmlMensagem,
    nomeServico: `Autorização da ${documento}`,
    timeout: 60000,
  });

  return {
    ...interpretarRetornoAutorizacao(resposta, modeloNormalizado),
    modelo: modeloNormalizado,
    ambiente: ambienteNormalizado,
    idLote: somenteNumeros(idLote).padStart(15, "0"),
    xmlLote: xmlMensagem,
  };
}

function transmitirNfceParaSefaz(xmlAssinado, idLote, ambiente) {
  return transmitirDocumentoFiscal({
    xmlAssinado,
    idLote,
    modelo: MODELO_NFCE,
    ambiente,
  });
}

function transmitirNfeParaSefaz(xmlAssinado, idLote, ambiente) {
  return transmitirDocumentoFiscal({
    xmlAssinado,
    idLote,
    modelo: MODELO_NFE,
    ambiente,
  });
}

function validarNumeroRecibo(numeroRecibo, modelo = MODELO_NFCE) {
  const recibo = somenteNumeros(numeroRecibo);

  if (!recibo) {
    throw new Error(`Número do recibo da ${nomeDocumento(modelo)} não informado.`);
  }

  if (recibo.length > 15) {
    throw new Error(`Número do recibo da ${nomeDocumento(modelo)} inválido.`);
  }

  return recibo;
}

function montarConsReciNFe(numeroRecibo, ambiente, modelo = MODELO_NFCE) {
  const recibo = validarNumeroRecibo(numeroRecibo, modelo);

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<consReciNFe xmlns="${NAMESPACE_NFE}" versao="${VERSAO_NFE}">` +
    `<tpAmb>${obterTpAmb(ambiente)}</tpAmb>` +
    `<nRec>${recibo}</nRec>` +
    "</consReciNFe>"
  );
}

async function consultarReciboDocumentoFiscal({
  numeroRecibo,
  modelo = MODELO_NFCE,
  ambiente,
}) {
  const modeloNormalizado = normalizarModelo(modelo);
  const documento = nomeDocumento(modeloNormalizado);
  const ambienteNormalizado = normalizarAmbiente(
    ambiente || obterAmbientePadrao(modeloNormalizado)
  );
  const urls = obterUrlsSefaz(modeloNormalizado, ambienteNormalizado);
  const xmlMensagem = montarConsReciNFe(
    numeroRecibo,
    ambienteNormalizado,
    modeloNormalizado
  );

  const resposta = await enviarMensagemSefaz({
    url: urls.retornoAutorizacao,
    namespaceWsdl: NAMESPACES_WSDL.retornoAutorizacao,
    xmlMensagem,
    nomeServico: `Consulta do recibo da ${documento}`,
    timeout: 60000,
  });

  return {
    ...interpretarRetornoAutorizacao(resposta, modeloNormalizado),
    modelo: modeloNormalizado,
    ambiente: ambienteNormalizado,
    nRec:
      extrairTag(obterXmlFiscal(resposta), "nRec") ||
      validarNumeroRecibo(numeroRecibo, modeloNormalizado),
  };
}

function consultarReciboSefaz(numeroRecibo, ambiente) {
  return consultarReciboDocumentoFiscal({
    numeroRecibo,
    modelo: MODELO_NFCE,
    ambiente,
  });
}

function consultarReciboNfe(numeroRecibo, ambiente) {
  return consultarReciboDocumentoFiscal({
    numeroRecibo,
    modelo: MODELO_NFE,
    ambiente,
  });
}

function validarChaveAcesso(chaveAcesso, modelo = MODELO_NFCE) {
  const chave = somenteNumeros(chaveAcesso);
  const modeloNormalizado = normalizarModelo(modelo);

  if (chave.length !== 44) {
    throw new Error("A chave de acesso deve possuir exatamente 44 dígitos.");
  }

  if (chave.slice(0, 2) !== UF_PR) {
    throw new Error("A chave de acesso informada não pertence ao Paraná.");
  }

  if (chave.slice(20, 22) !== modeloNormalizado) {
    throw new Error(
      `A chave de acesso informada não pertence a uma ${nomeDocumento(modeloNormalizado)} modelo ${modeloNormalizado}.`
    );
  }

  return chave;
}

function montarConsSitNFe(chaveAcesso, ambiente, modelo = MODELO_NFCE) {
  const chave = validarChaveAcesso(chaveAcesso, modelo);

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<consSitNFe xmlns="${NAMESPACE_NFE}" versao="${VERSAO_NFE}">` +
    `<tpAmb>${obterTpAmb(ambiente)}</tpAmb>` +
    "<xServ>CONSULTAR</xServ>" +
    `<chNFe>${chave}</chNFe>` +
    "</consSitNFe>"
  );
}

async function consultarDocumentoPorChave({
  chaveAcesso,
  modelo = MODELO_NFCE,
  ambiente,
}) {
  const modeloNormalizado = normalizarModelo(modelo);
  const documento = nomeDocumento(modeloNormalizado);
  const ambienteNormalizado = normalizarAmbiente(
    ambiente || obterAmbientePadrao(modeloNormalizado)
  );
  const urls = obterUrlsSefaz(modeloNormalizado, ambienteNormalizado);
  const xmlMensagem = montarConsSitNFe(
    chaveAcesso,
    ambienteNormalizado,
    modeloNormalizado
  );

  const resposta = await enviarMensagemSefaz({
    url: urls.consultaProtocolo,
    namespaceWsdl: NAMESPACES_WSDL.consultaProtocolo,
    xmlMensagem,
    nomeServico: `Consulta da ${documento} por chave`,
    timeout: 60000,
  });

  const xml = obterXmlFiscal(resposta);
  const protocolo = extrairDadosProtocolo(xml);
  const cStatConsulta = extrairTag(xml, "cStat");
  const xMotivoConsulta = extrairTag(xml, "xMotivo");

  return {
    cStat: protocolo.cStat || cStatConsulta || "",
    xMotivo:
      protocolo.xMotivo ||
      xMotivoConsulta ||
      `Consulta da ${documento} concluída.`,
    cStatConsulta: cStatConsulta || "",
    xMotivoConsulta: xMotivoConsulta || "",
    ...protocolo,
    modelo: modeloNormalizado,
    ambiente: ambienteNormalizado,
    chaveAcesso: validarChaveAcesso(chaveAcesso, modeloNormalizado),
    xmlRetorno: xml,
    xmlSoap: resposta.xmlSoap || "",
  };
}

function consultarNfcePorChave(chaveAcesso, ambiente) {
  return consultarDocumentoPorChave({
    chaveAcesso,
    modelo: MODELO_NFCE,
    ambiente,
  });
}

function consultarNfePorChave(chaveAcesso, ambiente) {
  return consultarDocumentoPorChave({
    chaveAcesso,
    modelo: MODELO_NFE,
    ambiente,
  });
}

function montarConsStatServ(ambiente) {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<consStatServ xmlns="${NAMESPACE_NFE}" versao="${VERSAO_NFE}">` +
    `<tpAmb>${obterTpAmb(ambiente)}</tpAmb>` +
    `<cUF>${UF_PR}</cUF>` +
    "<xServ>STATUS</xServ>" +
    "</consStatServ>"
  );
}

async function consultarStatusDocumentoFiscal({
  modelo = MODELO_NFCE,
  ambiente,
} = {}) {
  const modeloNormalizado = normalizarModelo(modelo);
  const documento = nomeDocumento(modeloNormalizado);
  const ambienteNormalizado = normalizarAmbiente(
    ambiente || obterAmbientePadrao(modeloNormalizado)
  );
  const urls = obterUrlsSefaz(modeloNormalizado, ambienteNormalizado);

  const resposta = await enviarMensagemSefaz({
    url: urls.statusServico,
    namespaceWsdl: NAMESPACES_WSDL.statusServico,
    xmlMensagem: montarConsStatServ(ambienteNormalizado),
    nomeServico: `Status do serviço ${documento}`,
    timeout: 30000,
  });

  const xml = obterXmlFiscal(resposta);

  return {
    tpAmb: extrairTag(xml, "tpAmb"),
    verAplic: extrairTag(xml, "verAplic"),
    cStat: extrairTag(xml, "cStat"),
    xMotivo:
      extrairTag(xml, "xMotivo") || "Consulta de status concluída.",
    cUF: extrairTag(xml, "cUF"),
    dhRecbto: extrairTag(xml, "dhRecbto"),
    tMed: extrairTag(xml, "tMed"),
    dhRetorno: extrairTag(xml, "dhRetorno"),
    xObs: extrairTag(xml, "xObs"),
    modelo: modeloNormalizado,
    ambiente: ambienteNormalizado,
    xmlRetorno: xml,
    xmlSoap: resposta.xmlSoap || "",
  };
}

function consultarStatusServico(ambiente) {
  return consultarStatusDocumentoFiscal({
    modelo: MODELO_NFCE,
    ambiente,
  });
}

function consultarStatusServicoNfe(ambiente) {
  return consultarStatusDocumentoFiscal({
    modelo: MODELO_NFE,
    ambiente,
  });
}

module.exports = {
  UF_PR,
  VERSAO_NFE,
  MODELO_NFE,
  MODELO_NFCE,
  NAMESPACES_WSDL,

  normalizarModelo,
  normalizarAmbiente,
  obterTpAmb,
  obterUrlsSefaz,

  extrairDadosProtocolo,
  interpretarRetornoAutorizacao,

  montarEnviNFe,
  transmitirDocumentoFiscal,
  transmitirNfceParaSefaz,
  transmitirNfeParaSefaz,

  validarNumeroRecibo,
  montarConsReciNFe,
  consultarReciboDocumentoFiscal,
  consultarReciboSefaz,
  consultarReciboNfe,

  validarChaveAcesso,
  montarConsSitNFe,
  consultarDocumentoPorChave,
  consultarNfcePorChave,
  consultarNfePorChave,

  montarConsStatServ,
  consultarStatusDocumentoFiscal,
  consultarStatusServico,
  consultarStatusServicoNfe,
};
