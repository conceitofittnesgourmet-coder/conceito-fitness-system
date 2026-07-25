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
const VERSAO_EVENTO = "1.00";
const TIPO_EVENTO_CANCELAMENTO = "110111";
const SEQUENCIA_EVENTO_PADRAO = 1;

const NAMESPACE_NFE =
  "http://www.portalfiscal.inf.br/nfe";

const NAMESPACE_WSDL_EVENTO =
  "http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4";

/**
 * Retornos que efetivamente confirmam o cancelamento.
 *
 * 135: Evento registrado e vinculado à NF-e.
 * 155: Cancelamento homologado fora de prazo.
 */
const CSTAT_CANCELAMENTO_CONFIRMADO = [
  "135",
  "155",
];

/**
 * Retornos que indicam duplicidade de evento.
 *
 * O código 573 exige consulta/validação do evento
 * anteriormente registrado antes de alterar a nota local.
 */
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

/**
 * Retorna o endpoint oficial de registro de eventos
 * da NFC-e no Paraná.
 *
 * A chamada deve usar o endereço do serviço,
 * sem a terminação ?wsdl.
 */
function obterUrlRecepcaoEvento(ambiente) {
  if (normalizarAmbiente(ambiente) === "producao") {
    return (
      process.env.NFCE_URL_RECEPCAO_EVENTO_PRODUCAO ||
      "https://nfce.sefa.pr.gov.br/nfce/NFeRecepcaoEvento4"
    );
  }

  return (
    process.env.NFCE_URL_RECEPCAO_EVENTO_HOMOLOGACAO ||
    "https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeRecepcaoEvento4"
  );
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
      "A chave de acesso da NFC-e deve possuir exatamente 44 dígitos."
    );
  }

  const modelo = chave.slice(20, 22);

  if (modelo !== "65") {
    throw new Error(
      `A chave informada não pertence a uma NFC-e modelo 65. Modelo encontrado: ${modelo || "inválido"}.`
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
      "O protocolo de autorização da NFC-e não foi informado."
    );
  }

  if (valor.length < 15) {
    throw new Error(
      "O protocolo de autorização da NFC-e é inválido."
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

/**
 * Monta apenas o elemento <evento>.
 *
 * Esse elemento é assinado antes de ser colocado
 * dentro do lote <envEvento>.
 */
function montarXmlEventoCancelamento({
  chaveAcesso,
  protocolo,
  justificativa,
  ambiente,
  sequenciaEvento =
    SEQUENCIA_EVENTO_PADRAO,
  dataEvento = new Date(),
}) {
  const chave = validarChaveAcesso(chaveAcesso);
  const numeroProtocolo =
    validarProtocolo(protocolo);
  const textoJustificativa =
    validarJustificativa(justificativa);
  const sequencia =
    validarSequenciaEvento(sequenciaEvento);

  const idEvento = montarIdEvento({
    chaveAcesso: chave,
    tipoEvento:
      TIPO_EVENTO_CANCELAMENTO,
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

function obterCnpjDaChave(chaveAcesso) {
  const chave = validarChaveAcesso(chaveAcesso);

  /*
   * Estrutura da chave:
   * cUF(2) + AAMM(4) + CNPJ(14) + ...
   *
   * O CNPJ ocupa as posições 7 a 20,
   * correspondendo aos índices 6 a 19.
   */
  const cnpj = chave.slice(6, 20);

  if (cnpj.length !== 14) {
    throw new Error(
      "Não foi possível extrair o CNPJ da chave de acesso."
    );
  }

  return cnpj;
}

function montarLoteEventos({
  xmlEventoAssinado,
  idLote,
}) {
  const eventoLimpo = removerDeclaracaoXml(
    xmlEventoAssinado
  );

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

  const retEvento = obterRetEvento(xmlFiscal);

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

  const cancelamentoConfirmado =
    CSTAT_CANCELAMENTO_CONFIRMADO.includes(
      cStatFinal
    );

  const eventoDuplicado =
    CSTAT_EVENTO_DUPLICADO.includes(
      cStatFinal
    );

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

    cancelamentoConfirmado,
    eventoDuplicado,

    xmlRetorno: xmlFiscal,
    xmlSoap,
  };
}

/**
 * Envia um evento já montado e assinado.
 */
async function transmitirEvento({
  xmlEventoAssinado,
  ambiente,
  idLote = gerarIdLoteEvento(),
}) {
  if (!xmlEventoAssinado) {
    throw new Error(
      "XML assinado do evento não informado."
    );
  }

  const xmlLote = montarLoteEventos({
    xmlEventoAssinado,
    idLote,
  });

  const resposta = await enviarMensagemSefaz({
    url: obterUrlRecepcaoEvento(ambiente),

    namespaceWsdl:
      NAMESPACE_WSDL_EVENTO,

    xmlMensagem: xmlLote,

    nomeServico:
      "Recepção de evento da NFC-e",

    timeout: 60000,
  });

  return {
    ...interpretarRetornoEvento(resposta),
    idLote,
    xmlLote,
  };
}

/**
 * Fluxo completo do cancelamento:
 *
 * 1. valida os dados;
 * 2. monta o XML do evento;
 * 3. assina o infEvento;
 * 4. monta o lote;
 * 5. transmite para a SEFAZ;
 * 6. interpreta o retorno.
 */
async function cancelarNfceNaSefaz({
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

  let xmlEventoAssinado;

  try {
    xmlEventoAssinado =
      assinarXmlEvento(
        removerDeclaracaoXml(xmlEvento)
      );
  } catch (error) {
    throw new Error(
      `Não foi possível assinar o evento de cancelamento: ${
        error?.message || "erro desconhecido."
      }`
    );
  }

  if (!xmlEventoAssinado) {
    throw new Error(
      "O assinador não devolveu o XML do evento assinado."
    );
  }

  const retorno = await transmitirEvento({
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

module.exports = {
  TIPO_EVENTO_CANCELAMENTO,
  CSTAT_CANCELAMENTO_CONFIRMADO,

  normalizarAmbiente,
  obterTpAmb,
  obterUrlRecepcaoEvento,
  formatarDataHoraSaoPaulo,
  validarChaveAcesso,
  validarProtocolo,
  validarJustificativa,
  obterCnpjDaChave,
  montarIdEvento,
  gerarIdLoteEvento,
  montarXmlEventoCancelamento,
  montarLoteEventos,
  interpretarRetornoEvento,
  transmitirEvento,
  cancelarNfceNaSefaz,
};