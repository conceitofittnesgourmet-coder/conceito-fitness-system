const crypto = require("crypto");

const {
  assinarXmlEvento,
} = require("./xmlSignatureService");

const {
  enviarMensagemSefaz,
  removerDeclaracaoXml,
  extrairTag,
  extrairBloco,
  extrairTodosBlocos,
} = require("./soapService");

const UF_PR = "41";
const MODELO_NFE = "55";
const VERSAO_EVENTO = "1.00";
const TIPO_EVENTO_CANCELAMENTO = "110111";
const TIPO_EVENTO_CARTA_CORRECAO = "110110";

const TIPO_EVENTO_CONFIRMACAO_OPERACAO = "210200";
const TIPO_EVENTO_CIENCIA_OPERACAO = "210210";
const TIPO_EVENTO_DESCONHECIMENTO_OPERACAO = "210220";
const TIPO_EVENTO_OPERACAO_NAO_REALIZADA = "210240";

const SEQUENCIA_EVENTO_PADRAO = 1;

const NAMESPACE_NFE =
  "http://www.portalfiscal.inf.br/nfe";

const NAMESPACE_WSDL_EVENTO =
  "http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4";

const CSTAT_CANCELAMENTO_CONFIRMADO = [
  "135",
  "155",
];

const CSTAT_EVENTO_DUPLICADO = [
  "573",
];

function somenteNumeros(valor = "") {
  return String(valor ?? "").replace(/\D/g, "");
}

function escaparXml(valor = "") {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizarAmbiente(ambiente = "") {
  const valor = String(ambiente || "")
    .trim()
    .toLowerCase();

  if (
    valor === "producao" ||
    valor === "produção" ||
    valor === "1"
  ) {
    return "producao";
  }

  return "homologacao";
}

function obterTpAmb(ambiente) {
  return normalizarAmbiente(ambiente) === "producao"
    ? "1"
    : "2";
}

function obterUrlRecepcaoEvento(ambiente) {
  if (normalizarAmbiente(ambiente) === "producao") {
    return (
      process.env.NFE_URL_RECEPCAO_EVENTO_PRODUCAO ||
      "https://nfe.sefa.pr.gov.br/nfe/NFeRecepcaoEvento4"
    );
  }

  return (
    process.env.NFE_URL_RECEPCAO_EVENTO_HOMOLOGACAO ||
    "https://homologacao.nfe.sefa.pr.gov.br/nfe/NFeRecepcaoEvento4"
  );  
}

const URL_EVENTO_AMBIENTE_NACIONAL_PRODUCAO =
  process.env.NFE_URL_EVENTO_AN_PRODUCAO ||
  "https://www.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx";

const URL_EVENTO_AMBIENTE_NACIONAL_HOMOLOGACAO =
  process.env.NFE_URL_EVENTO_AN_HOMOLOGACAO ||
  "https://hom1.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx";

function obterUrlRecepcaoEventoAmbienteNacional(
  ambiente
) {
  if (
    normalizarAmbiente(ambiente) ===
    "producao"
  ) {
    return URL_EVENTO_AMBIENTE_NACIONAL_PRODUCAO;
  }

  return URL_EVENTO_AMBIENTE_NACIONAL_HOMOLOGACAO;
}

function formatarDataHoraSaoPaulo(data = new Date()) {
  const partes = new Intl.DateTimeFormat(
    "sv-SE",
    {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }
  ).formatToParts(data);

  const valores = {};

  for (const parte of partes) {
    valores[parte.type] = parte.value;
  }

  return (
    `${valores.year}-${valores.month}-${valores.day}` +
    `T${valores.hour}:${valores.minute}:${valores.second}` +
    "-03:00"
  );
}

function validarChaveAcesso(chaveAcesso) {
  const chave = somenteNumeros(chaveAcesso);

  if (chave.length !== 44) {
    throw new Error(
      "A chave de acesso da NF-e deve possuir exatamente 44 dígitos."
    );
  }

  const modelo = chave.slice(20, 22);

  if (modelo !== MODELO_NFE) {
    throw new Error(
      `A chave informada não pertence a uma NF-e modelo 55. Modelo encontrado: ${modelo || "inválido"}.`
    );
  }

  const codigoUf = chave.slice(0, 2);

  if (codigoUf !== UF_PR) {
    throw new Error(
      `A chave informada não pertence ao Paraná. Código de UF encontrado: ${codigoUf}.`
    );
  }

  return chave;
}

function validarProtocolo(protocolo) {
  const valor = somenteNumeros(protocolo);

  if (!valor) {
    throw new Error(
      "O protocolo de autorização da NF-e não foi informado."
    );
  }

  if (valor.length < 15) {
    throw new Error(
      "O protocolo de autorização da NF-e é inválido."
    );
  }

  return valor;
}

function validarJustificativa(justificativa) {
  const texto = String(justificativa || "")
    .replace(/\s+/g, " ")
    .trim();

  if (texto.length < 15) {
    throw new Error(
      "A justificativa do cancelamento deve possuir no mínimo 15 caracteres."
    );
  }

  if (texto.length > 255) {
    throw new Error(
      "A justificativa do cancelamento deve possuir no máximo 255 caracteres."
    );
  }

  return texto;
}

function validarCorrecao(correcao) {
  const texto = String(correcao || "")
    .replace(/\s+/g, " ")
    .trim();

  if (texto.length < 15) {
    throw new Error(
      "A correção da CC-e deve possuir no mínimo 15 caracteres."
    );
  }

  if (texto.length > 1000) {
    throw new Error(
      "A correção da CC-e deve possuir no máximo 1000 caracteres."
    );
  }

  return texto;
}

function validarSequenciaEvento(sequencia) {
  const numero = Number(sequencia);

  if (
    !Number.isInteger(numero) ||
    numero < 1 ||
    numero > 20
  ) {
    throw new Error(
      "A sequência do evento deve ser um número inteiro entre 1 e 20."
    );
  }

  return numero;
}

function obterCnpjDaChave(chaveAcesso) {
  const chave = validarChaveAcesso(chaveAcesso);
  return chave.slice(6, 20);
}

function montarIdEvento({
  chaveAcesso,
  tipoEvento,
  sequenciaEvento,
}) {
  return (
    `ID${tipoEvento}` +
    chaveAcesso +
    String(sequenciaEvento).padStart(2, "0")
  );
}

function gerarIdLoteEvento() {
  const timestamp = Date.now().toString();

  const aleatorio = crypto
    .randomInt(0, 1000)
    .toString()
    .padStart(3, "0");

  return `${timestamp}${aleatorio}`
    .slice(-15)
    .padStart(15, "0");
}

function montarXmlEventoCancelamento({
  chaveAcesso,
  protocolo,
  justificativa,
  ambiente,
  sequenciaEvento = SEQUENCIA_EVENTO_PADRAO,
  dataEvento = new Date(),
}) {
  const chave = validarChaveAcesso(chaveAcesso);
  const numeroProtocolo = validarProtocolo(protocolo);
  const textoJustificativa =
    validarJustificativa(justificativa);

  const sequencia =
    validarSequenciaEvento(sequenciaEvento);

  const idEvento = montarIdEvento({
    chaveAcesso: chave,
    tipoEvento: TIPO_EVENTO_CANCELAMENTO,
    sequenciaEvento: sequencia,
  });

  const dhEvento =
    formatarDataHoraSaoPaulo(dataEvento);

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<evento xmlns="${NAMESPACE_NFE}" versao="${VERSAO_EVENTO}">` +
    `<infEvento Id="${idEvento}">` +
    `<cOrgao>${UF_PR}</cOrgao>` +
    `<tpAmb>${obterTpAmb(ambiente)}</tpAmb>` +
    `<CNPJ>${obterCnpjDaChave(chave)}</CNPJ>` +
    `<chNFe>${chave}</chNFe>` +
    `<dhEvento>${dhEvento}</dhEvento>` +
    `<tpEvento>${TIPO_EVENTO_CANCELAMENTO}</tpEvento>` +
    `<nSeqEvento>${sequencia}</nSeqEvento>` +
    `<verEvento>${VERSAO_EVENTO}</verEvento>` +
    `<detEvento versao="${VERSAO_EVENTO}">` +
    "<descEvento>Cancelamento</descEvento>" +
    `<nProt>${numeroProtocolo}</nProt>` +
    `<xJust>${escaparXml(textoJustificativa)}</xJust>` +
    "</detEvento>" +
    "</infEvento>" +
    "</evento>"
  );
}

function montarXmlEventoCartaCorrecao({
  chaveAcesso,
  correcao,
  ambiente,
  sequenciaEvento = SEQUENCIA_EVENTO_PADRAO,
  dataEvento = new Date(),
}) {
  const chave = validarChaveAcesso(chaveAcesso);

  const textoCorrecao =
    validarCorrecao(correcao);

  const sequencia =
    validarSequenciaEvento(sequenciaEvento);

  const idEvento = montarIdEvento({
    chaveAcesso: chave,
    tipoEvento: TIPO_EVENTO_CARTA_CORRECAO,
    sequenciaEvento: sequencia,
  });

  const dhEvento =
    formatarDataHoraSaoPaulo(dataEvento);

  const condicaoUso =
    "A Carta de Correcao e disciplinada pelo paragrafo 1o-A do art. 7o do Convenio S/N, de 15 de dezembro de 1970 e pode ser utilizada para regularizacao de erro ocorrido na emissao de documento fiscal, desde que o erro nao esteja relacionado com: I - as variaveis que determinam o valor do imposto tais como: base de calculo, aliquota, diferenca de preco, quantidade, valor da operacao ou da prestacao; II - a correcao de dados cadastrais que implique mudanca do remetente ou do destinatario; III - a data de emissao ou de saida.";

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<evento xmlns="${NAMESPACE_NFE}" versao="${VERSAO_EVENTO}">` +
    `<infEvento Id="${idEvento}">` +
    `<cOrgao>${UF_PR}</cOrgao>` +
    `<tpAmb>${obterTpAmb(ambiente)}</tpAmb>` +
    `<CNPJ>${obterCnpjDaChave(chave)}</CNPJ>` +
    `<chNFe>${chave}</chNFe>` +
    `<dhEvento>${dhEvento}</dhEvento>` +
    `<tpEvento>${TIPO_EVENTO_CARTA_CORRECAO}</tpEvento>` +
    `<nSeqEvento>${sequencia}</nSeqEvento>` +
    `<verEvento>${VERSAO_EVENTO}</verEvento>` +
    `<detEvento versao="${VERSAO_EVENTO}">` +
    "<descEvento>Carta de Correcao</descEvento>" +
    `<xCorrecao>${escaparXml(textoCorrecao)}</xCorrecao>` +
    `<xCondUso>${escaparXml(condicaoUso)}</xCondUso>` +
    "</detEvento>" +
    "</infEvento>" +
    "</evento>"
  );
}

function validarCnpjDestinatario(cnpj) {
  const valor = somenteNumeros(cnpj);

  if (valor.length !== 14) {
    throw new Error(
      "O CNPJ do destinatário deve possuir exatamente 14 dígitos."
    );
  }

  return valor;
}

function obterDadosManifestacao(tipoEvento) {
  const tipos = {
    [TIPO_EVENTO_CONFIRMACAO_OPERACAO]: {
      descricao: "Confirmacao da Operacao",
      exigeJustificativa: false,
    },

    [TIPO_EVENTO_CIENCIA_OPERACAO]: {
      descricao: "Ciencia da Operacao",
      exigeJustificativa: false,
    },

    [TIPO_EVENTO_DESCONHECIMENTO_OPERACAO]: {
      descricao: "Desconhecimento da Operacao",
      exigeJustificativa: false,
    },

    [TIPO_EVENTO_OPERACAO_NAO_REALIZADA]: {
      descricao: "Operacao nao Realizada",
      exigeJustificativa: true,
    },
  };

  const dados = tipos[String(tipoEvento || "")];

  if (!dados) {
    throw new Error(
      "Tipo de Manifestação do Destinatário inválido."
    );
  }

  return dados;
}

function montarXmlManifestacaoDestinatario({
  chaveAcesso,
  cnpjDestinatario,
  tipoEvento,
  ambiente,
  justificativa = "",
  sequenciaEvento = 1,
  dataEvento = new Date(),
}) {
  const chave =
    validarChaveAcesso(chaveAcesso);

  const cnpj =
    validarCnpjDestinatario(
      cnpjDestinatario
    );

  const sequencia =
    validarSequenciaEvento(
      sequenciaEvento
    );

  if (sequencia !== 1) {
    throw new Error(
      "Na Manifestação do Destinatário, nSeqEvento deve ser 1."
    );
  }

  const dadosEvento =
    obterDadosManifestacao(
      tipoEvento
    );

  let textoJustificativa = "";

  if (dadosEvento.exigeJustificativa) {
    textoJustificativa =
      String(justificativa || "")
        .replace(/\s+/g, " ")
        .trim();

    if (
      textoJustificativa.length < 15 ||
      textoJustificativa.length > 255
    ) {
      throw new Error(
        "A justificativa da Operação não Realizada deve possuir entre 15 e 255 caracteres."
      );
    }
  }

  const idEvento =
    montarIdEvento({
      chaveAcesso: chave,
      tipoEvento,
      sequenciaEvento: sequencia,
    });

  const dhEvento =
    formatarDataHoraSaoPaulo(
      dataEvento
    );

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<evento xmlns="${NAMESPACE_NFE}" versao="${VERSAO_EVENTO}">` +
    `<infEvento Id="${idEvento}">` +
    `<cOrgao>91</cOrgao>` +
    `<tpAmb>${obterTpAmb(ambiente)}</tpAmb>` +
    `<CNPJ>${cnpj}</CNPJ>` +
    `<chNFe>${chave}</chNFe>` +
    `<dhEvento>${dhEvento}</dhEvento>` +
    `<tpEvento>${tipoEvento}</tpEvento>` +
    `<nSeqEvento>${sequencia}</nSeqEvento>` +
    `<verEvento>${VERSAO_EVENTO}</verEvento>` +
    `<detEvento versao="${VERSAO_EVENTO}">` +
    `<descEvento>${dadosEvento.descricao}</descEvento>` +
    (
      dadosEvento.exigeJustificativa
        ? `<xJust>${escaparXml(textoJustificativa)}</xJust>`
        : ""
    ) +
    "</detEvento>" +
    "</infEvento>" +
    "</evento>"
  );
}

function montarLoteEventos({
  xmlEventoAssinado,
  idLote,
}) {
  const eventoLimpo =
    removerDeclaracaoXml(xmlEventoAssinado);

  if (!eventoLimpo.includes("<evento")) {
    throw new Error(
      "O XML assinado não contém o elemento evento."
    );
  }

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<envEvento xmlns="${NAMESPACE_NFE}" versao="${VERSAO_EVENTO}">` +
    `<idLote>${idLote}</idLote>` +
    eventoLimpo +
    "</envEvento>"
  );
}

function obterRetEvento(xmlRetorno) {
  const blocos = extrairTodosBlocos(
    xmlRetorno,
    "retEvento"
  );

  if (blocos.length > 0) {
    return blocos[0];
  }

  return (
    extrairBloco(xmlRetorno, "retEvento") ||
    ""
  );
}

function interpretarRetornoEvento({
  xmlSoap,
  xmlConteudo,
}) {
  const xmlFiscal =
    String(xmlConteudo || "").trim() ||
    String(xmlSoap || "").trim();

  if (!xmlFiscal) {
    throw new Error(
      "A SEFAZ retornou uma resposta vazia para o evento."
    );
  }

  const cStatLote =
    extrairTag(xmlFiscal, "cStat");

  const xMotivoLote =
    extrairTag(xmlFiscal, "xMotivo");

  const retEvento =
    obterRetEvento(xmlFiscal);

  const blocoAnalise =
    retEvento || xmlFiscal;

  const cStatEvento =
    extrairTag(blocoAnalise, "cStat");

  const xMotivoEvento =
    extrairTag(blocoAnalise, "xMotivo");

  const protocoloEvento =
    extrairTag(blocoAnalise, "nProt");

  const dataRegistro =
    extrairTag(blocoAnalise, "dhRegEvento");

  const chaveAcesso =
    extrairTag(blocoAnalise, "chNFe");

  const tipoEvento =
    extrairTag(blocoAnalise, "tpEvento");

  const sequenciaEvento =
    extrairTag(blocoAnalise, "nSeqEvento");

  const cStatFinal =
    cStatEvento || cStatLote || "";

  const motivoFinal =
    xMotivoEvento ||
    xMotivoLote ||
    "Retorno do evento recebido.";

  return {
    cStat: cStatFinal,
    xMotivo: motivoFinal,

    cStatLote: cStatLote || "",
    xMotivoLote: xMotivoLote || "",

    cStatEvento: cStatEvento || "",
    xMotivoEvento: xMotivoEvento || "",

    protocoloEvento:
      protocoloEvento || "",

    dataRegistro:
      dataRegistro || "",

    chaveAcesso:
      chaveAcesso || "",

    tipoEvento:
      tipoEvento || "",

    sequenciaEvento:
      sequenciaEvento || "",

    cancelamentoConfirmado:
      CSTAT_CANCELAMENTO_CONFIRMADO.includes(
        cStatFinal
      ),

    eventoDuplicado:
      CSTAT_EVENTO_DUPLICADO.includes(
        cStatFinal
      ),

    xmlRetorno: xmlFiscal,
    xmlSoap,
  };
}

async function transmitirEvento({
  xmlEventoAssinado,
  ambiente,
  idLote = gerarIdLoteEvento(),
  urlRecepcao = null,
}) {
  const xmlLote = montarLoteEventos({
    xmlEventoAssinado,
    idLote,
  });

  const resposta =
    await enviarMensagemSefaz({
      url:
  urlRecepcao ||
  obterUrlRecepcaoEvento(ambiente),

      namespaceWsdl:
        NAMESPACE_WSDL_EVENTO,

      xmlMensagem: xmlLote,

      nomeServico:
        "Recepção de evento da NF-e",

      timeout: 60000,
    });

  return {
    ...interpretarRetornoEvento(resposta),
    idLote,
    xmlLote,
  };
}

async function cancelarNfeNaSefaz({
  chaveAcesso,
  protocolo,
  justificativa,
  ambiente,
  sequenciaEvento =
    SEQUENCIA_EVENTO_PADRAO,
  dataEvento = new Date(),
}) {
  const xmlEvento =
    montarXmlEventoCancelamento({
      chaveAcesso,
      protocolo,
      justificativa,
      ambiente,
      sequenciaEvento,
      dataEvento,
    });

  const xmlEventoAssinado =
    assinarXmlEvento(
      removerDeclaracaoXml(xmlEvento)
    );

  if (!xmlEventoAssinado) {
    throw new Error(
      "O assinador não devolveu o XML do evento assinado."
    );
  }

  const retorno =
    await transmitirEvento({
      xmlEventoAssinado,
      ambiente,
    });

  return {
    ...retorno,

    xmlEvento:
      removerDeclaracaoXml(xmlEvento),

    xmlEventoAssinado:
      removerDeclaracaoXml(
        xmlEventoAssinado
      ),
  };
}

async function enviarCartaCorrecaoNfe({
  chaveAcesso,
  correcao,
  ambiente,
  sequenciaEvento =
    SEQUENCIA_EVENTO_PADRAO,
  dataEvento = new Date(),
}) {
  const xmlEvento =
    montarXmlEventoCartaCorrecao({
      chaveAcesso,
      correcao,
      ambiente,
      sequenciaEvento,
      dataEvento,
    });

  const xmlEventoAssinado =
    assinarXmlEvento(
      removerDeclaracaoXml(xmlEvento)
    );

  if (!xmlEventoAssinado) {
    throw new Error(
      "O assinador não devolveu o XML da Carta de Correção assinado."
    );
  }

  const retorno =
    await transmitirEvento({
      xmlEventoAssinado,
      ambiente,
    });

  const cStat =
    String(
      retorno.cStatEvento ||
      retorno.cStat ||
      ""
    );

  return {
    ...retorno,

    cartaCorrecaoConfirmada:
      cStat === "135",

    xmlEvento:
      removerDeclaracaoXml(xmlEvento),

    xmlEventoAssinado:
      removerDeclaracaoXml(
        xmlEventoAssinado
      ),
  };
}

async function enviarManifestacaoDestinatario({
  chaveAcesso,
  cnpjDestinatario,
  tipoEvento,
  ambiente,
  justificativa = "",
  sequenciaEvento = 1,
  dataEvento = new Date(),
}) {
  const xmlEvento =
    montarXmlManifestacaoDestinatario({
      chaveAcesso,
      cnpjDestinatario,
      tipoEvento,
      ambiente,
      justificativa,
      sequenciaEvento,
      dataEvento,
    });

  const xmlEventoAssinado =
    assinarXmlEvento(
      removerDeclaracaoXml(xmlEvento)
    );

  if (!xmlEventoAssinado) {
    throw new Error(
      "O assinador não devolveu o XML da Manifestação do Destinatário assinado."
    );
  }

 const retorno =
  await transmitirEvento({
    xmlEventoAssinado,
    ambiente,
    urlRecepcao:
      obterUrlRecepcaoEventoAmbienteNacional(
        ambiente
      ),
  });

  return {
    ...retorno,

    xmlEvento:
      removerDeclaracaoXml(xmlEvento),

    xmlEventoAssinado:
      removerDeclaracaoXml(
        xmlEventoAssinado
      ),
  };
}

module.exports = {
  TIPO_EVENTO_CANCELAMENTO,
  TIPO_EVENTO_CARTA_CORRECAO,

  TIPO_EVENTO_CONFIRMACAO_OPERACAO,
  TIPO_EVENTO_CIENCIA_OPERACAO,
  TIPO_EVENTO_DESCONHECIMENTO_OPERACAO,
  TIPO_EVENTO_OPERACAO_NAO_REALIZADA,

  CSTAT_CANCELAMENTO_CONFIRMADO,

  validarJustificativa,
  validarCorrecao,
  validarChaveAcesso,
  validarProtocolo,

  montarXmlEventoCancelamento,
  montarXmlEventoCartaCorrecao,
  montarXmlManifestacaoDestinatario,

  obterUrlRecepcaoEventoAmbienteNacional,

  cancelarNfeNaSefaz,
  enviarCartaCorrecaoNfe,
  enviarManifestacaoDestinatario,
};