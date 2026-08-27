const crypto = require("crypto");
const Pedido = require("../models/pedido");
const Nfce = require("../models/nfce");
const ConfiguracaoFiscal = require("../models/configuracaofiscal");

const { assinarXmlNfce } = require("./xmlSignatureService");
const {
  transmitirNfceParaSefaz,
  consultarReciboSefaz,
} = require("./sefazPrService");

const {
  cancelarNfceNaSefaz,
  validarJustificativa,
} = require("./sefazEventoService");

const {
  somenteNumeros,
  numeroComZeros,
  escapeXml,
  limparXmlParaSefaz,
  extrairTagXml,
  formatarDataHoraSaoPaulo,
  getTpAmb,
  converterDataSefaz,
} = require("./fiscal/documentoFiscalUtils");

const {
  criarIdentificacaoNfce,
} = require("./fiscal/documentoFiscalService");

const { montarXmlIdentificacao } = require("./fiscal/builders/identificacaoBuilder");
const { montarXmlEmitente } = require("./fiscal/builders/emitenteBuilder");
const { montarXmlDestinatarioNfce } = require("./fiscal/builders/destinatarioBuilder");
const { montarItensXml } = require("./fiscal/builders/itensBuilder");
const {
  calcularTotaisPedido,
  montarXmlTotais,
} = require("./fiscal/builders/totaisBuilder");
const { montarXmlTransporteNfce } = require("./fiscal/builders/transporteBuilder");
const { montarXmlPagamento } = require("./fiscal/builders/pagamentoBuilder");
const {
  montarXmlInformacoesAdicionais,
} = require("./fiscal/builders/informacoesAdicionaisBuilder");
const {
  montarXmlResponsavelTecnico,
} = require("./fiscal/builders/responsavelTecnicoBuilder");

const UF_PR = "41";
const MODELO_NFCE = "65";
const SERIE_PADRAO = 1;
const AMBIENTE_HOMOLOGACAO = "homologacao";
const CNPJ_PADRAO = "67199298000181";
const IE_PADRAO = "9123591400";
const MUNICIPIO_UMUARAMA = "4128104";
const URL_QRCODE_PR =
  "http://www.fazenda.pr.gov.br/nfce/qrcode";

const URL_CONSULTA_PR =
  "http://www.fazenda.pr.gov.br/nfce/consulta";


function getAmbiente(config) {
  return process.env.NFCE_AMBIENTE || config?.ambiente || AMBIENTE_HOMOLOGACAO;
}


function getEmpresaCnpj() {
  return somenteNumeros(process.env.EMPRESA_CNPJ || CNPJ_PADRAO);
}

function getEmpresaIe() {
  return somenteNumeros(process.env.EMPRESA_IE || IE_PADRAO);
}

function montarXmlNfce({ pedido, identificacaoFiscal }) {
  const ambiente = identificacaoFiscal.ambiente;
  const cnpj = identificacaoFiscal.emitente.cnpj;
  const totais = calcularTotaisPedido(pedido);
  const tipoPedido = String(
  pedido.tipo || ""
)
  .trim()
  .toLowerCase();

const ehEntregaDomicilio =
  ["delivery", "entrega"].includes(
    tipoPedido
  );

  const ideXml = montarXmlIdentificacao({
  identificacaoFiscal,
  codigoMunicipioFatoGerador:
    MUNICIPIO_UMUARAMA,

  /*
   * 1 = operação presencial
   * 4 = NFC-e em operação com entrega em domicílio
   */
  indicadorPresenca:
    ehEntregaDomicilio ? 4 : 1,
});

  const emitenteXml = montarXmlEmitente({
    empresa: identificacaoFiscal.emitente,
    endereco: {
      logradouro: "AV PARANA",
      numero: "8455",
      bairro: "ZONA III",
      codigoMunicipio: MUNICIPIO_UMUARAMA,
      municipio: "UMUARAMA",
      uf: "PR",
      cep: "87502000",
    },
  });

  const nomeCliente =
  typeof pedido.cliente === "string"
    ? pedido.cliente
    : pedido.cliente?.nome ||
      pedido.nomeCliente ||
      "Consumidor";

const destinatarioXml =
  montarXmlDestinatarioNfce({
    cpf: pedido.cpfNota,
    nome: nomeCliente,
    ambiente,

    endereco: ehEntregaDomicilio
      ? {
          logradouro:
            pedido.enderecoEntrega || "",

          numero:
            pedido.numeroEntrega || "SN",

          complemento:
            pedido.complementoEntrega || "",

          bairro:
            pedido.bairroEntrega || "",

          cep:
            pedido.cep || "",

          codigoMunicipio:
            MUNICIPIO_UMUARAMA,

          municipio: "UMUARAMA",

          uf: "PR",
        }
      : null,
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="${identificacaoFiscal.idDocumento}" versao="4.00">
    ${ideXml}
    ${emitenteXml}
    ${destinatarioXml}
    ${montarItensXml(pedido.produtos, ambiente)}
    ${montarXmlTotais(totais)}
    ${montarXmlTransporteNfce(
  pedido,
  {
    cnpj: getEmpresaCnpj(),
    ie: getEmpresaIe(),
    nome: "CONCEITO FITNESS",
    endereco: "AV PARANA 8455",
  }
)}
    ${montarXmlPagamento(pedido, totais.valorTotal)}
    ${montarXmlInformacoesAdicionais({ ambiente })}
    ${montarXmlResponsavelTecnico({ cnpj })}
  </infNFe>
</NFe>`;
}

function getCscIdParaQrCode() {
  const id = String(process.env.NFCE_CSC_ID || "000001")
    .replace(/\D/g, "")
    .replace(/^0+/, "");

  return id || "1";
}

function getCscToken() {
  return String(process.env.NFCE_CSC || "").trim();
}

function digestBase64ParaHex(digestValue) {
  if (!digestValue) {
    throw new Error("DigestValue não encontrado no XML assinado.");
  }

  return Buffer.from(digestValue, "base64").toString("hex").toUpperCase();
}

function textoParaHex(valor) {
  return Buffer.from(String(valor || ""), "utf8").toString("hex").toUpperCase();
}

function gerarQrCodeUrlNfce({ chaveAcesso, ambiente }) {
  const csc = getCscToken();

  if (!csc) {
    throw new Error("NFCE_CSC não configurado no Render.");
  }

  const dados = [
    chaveAcesso,
    "2",
    getTpAmb(ambiente),
    getCscIdParaQrCode(),
  ].join("|");

  const hash = crypto
    .createHash("sha1")
    .update(dados + csc, "utf8")
    .digest("hex")
    .toUpperCase();

  return `${URL_QRCODE_PR}?p=${dados}|${hash}`;
}

function inserirInfNFeSupl(xmlAssinado, qrCodeUrl) {
  const bloco = `<infNFeSupl><qrCode>${escapeXml(qrCodeUrl)}</qrCode><urlChave>${URL_CONSULTA_PR}</urlChave></infNFeSupl>`;
  return String(xmlAssinado).replace("</infNFe>", `</infNFe>${bloco}`);
}

async function gerarNfceDoPedido(pedidoId) {
  const pedido = await Pedido.findById(pedidoId);

  if (!pedido) throw new Error("Pedido não encontrado.");
  if (pedido.status === "cancelado") {
    throw new Error("Não é permitido emitir NFC-e para pedido cancelado.");
  }

 // Reserva o próximo número de NFC-e
let config = await ConfiguracaoFiscal.findOne();

if (!config) {
  await ConfiguracaoFiscal.create({
    ambiente: "homologacao",
    serieNfce: 1,
    proximoNumeroNfce: 2,
  });

  config = {
    ambiente: "homologacao",
    serieNfce: 1,
    proximoNumeroNfce: 1,
  };
} else {
  const numeroReservado = Number(
    config.proximoNumeroNfce || 1
  );

  await ConfiguracaoFiscal.updateOne(
    { _id: config._id },
    {
      $inc: {
        proximoNumeroNfce: 1,
      },
    }
  );

  config.proximoNumeroNfce = numeroReservado;
}

const numero = Number(config.proximoNumeroNfce || 1);
const serie = Number(config.serieNfce || SERIE_PADRAO);
const ambiente = getAmbiente(config);

  const identificacaoFiscal = criarIdentificacaoNfce({
    empresa: {
      cnpj: getEmpresaCnpj(),
      codigoUf: UF_PR,
      inscricaoEstadual: getEmpresaIe(),
      razaoSocial: "CONCEITO FITNESS",
      nomeFantasia: "CONCEITO FITNESS",
    },
    numero,
    serie,
    ambiente,
  });

  const chaveDados = identificacaoFiscal.chaveDados;

  const xml = montarXmlNfce({ pedido, identificacaoFiscal });

  const nfce = await Nfce.create({
    pedido: pedido._id,
    numero,
    serie,
    modelo: MODELO_NFCE,
    ambiente,
    chaveAcesso: chaveDados.chave,
    cpfNota: pedido.cpfNota || "",
    valorTotal: Number(pedido.total || 0),
    xml,
    xmlAssinado: "",
    status: "gerada",
    protocolo: "",
    recibo: "",
    cStat: "",
    mensagemSefaz: "NFC-e gerada. Próxima etapa: assinatura e transmissão SEFAZ.",
    qrCodeUrl: "",
  });

  
  return nfce;
}

async function assinarNfce(nfceId) {
  const nfce = await Nfce.findById(nfceId);

  if (!nfce) throw new Error("NFC-e não encontrada.");
  if (!nfce.xml) throw new Error("XML da NFC-e não encontrado.");

  const xmlLimpo = limparXmlParaSefaz(nfce.xml);
  const xmlAssinadoBase = assinarXmlNfce(xmlLimpo);
  const digestValue = extrairTagXml(xmlAssinadoBase, "DigestValue");
  const dhEmi = extrairTagXml(xmlLimpo, "dhEmi");

 const qrCodeUrl = gerarQrCodeUrlNfce({
  chaveAcesso: nfce.chaveAcesso,
  ambiente: nfce.ambiente,
});

const xmlAssinadoFinal = inserirInfNFeSupl(xmlAssinadoBase, qrCodeUrl);

nfce.xml = xmlLimpo;
nfce.xmlAssinado = limparXmlParaSefaz(xmlAssinadoFinal);
nfce.qrCodeUrl = qrCodeUrl;
nfce.status = "assinada";
nfce.mensagemSefaz =
  "XML assinado com QR Code NFC-e. Próxima etapa: transmissão SEFAZ.";

  await nfce.save();
  return nfce;
}

async function transmitirNfce(nfceId) {
  let nfce = await Nfce.findById(nfceId);

  if (!nfce) {
    throw new Error("NFC-e não encontrada.");
  }

  // Impede retransmissão de documento já autorizado
  if (nfce.status === "autorizada" || nfce.cStat === "100") {
    throw new Error(
      "Esta NFC-e já foi autorizada pela SEFAZ e não pode ser retransmitida."
    );
  }

  // Impede transmissão de documento cancelado
  if (nfce.status === "cancelada" || nfce.cStat === "101") {
    throw new Error(
      "Esta NFC-e está cancelada e não pode ser retransmitida."
    );
  }

  // Impede repetição de uma nota que já retornou duplicidade
  if (nfce.cStat === "204") {
    throw new Error(
      "Esta NFC-e já existe na base da SEFAZ. Consulte a situação da nota em vez de retransmiti-la."
    );
  }

  // Duplicidade com diferença na chave de acesso
  if (nfce.cStat === "539") {
    throw new Error(
      "A numeração desta NFC-e já foi utilizada com outra chave de acesso. Não retransmita este documento."
    );
  }

 /*
 * Assina somente quando ainda não houver XML assinado.
 * Uma NFC-e já assinada mantém exatamente o mesmo XML,
 * chave, DigestValue e QR Code.
 */
if (!nfce.xmlAssinado) {
  nfce = await assinarNfce(nfceId);
}

if (!nfce.xmlAssinado) {
  throw new Error(
    "Não foi possível obter o XML assinado da NFC-e."
  );
}

const idLote = String(nfce.numero).padStart(15, "0");

console.log("\n========================================");
console.log("📄 XML ASSINADO ENVIADO PARA A SEFAZ");
console.log("NFC-e:", nfce.numero);
console.log("Lote :", idLote);
console.log("========================================");
console.log(nfce.xmlAssinado);
console.log("========================================\n");

const retorno = await transmitirNfceParaSefaz(
  nfce.xmlAssinado,
  idLote
);

console.log("\n========================================");
console.log("📨 RETORNO DA SEFAZ");
console.dir(retorno, { depth: null });
console.log("========================================\n");

nfce.cStat = String(retorno.cStat || "");
nfce.recibo = retorno.nRec || nfce.recibo || "";
nfce.protocolo = retorno.nProt || nfce.protocolo || "";
nfce.mensagemSefaz =
  retorno.xMotivo || "Retorno SEFAZ recebido.";
  if (nfce.cStat === "100") {
    nfce.status = "autorizada";
    nfce.dataAutorizacao = retorno.dhRecbto
      ? new Date(retorno.dhRecbto)
      : new Date();
  } else if (
    ["103", "104", "105"].includes(nfce.cStat) ||
    retorno.nRec
  ) {
    /*
     * 103: lote recebido
     * 104: lote processado, mas o serviço ainda precisa analisar
     *      o protocolo interno retornado
     * 105: lote em processamento
     */
    nfce.status = "assinada";
  } else if (["108", "109"].includes(nfce.cStat)) {
    nfce.status = "assinada";
    nfce.mensagemSefaz =
      retorno.xMotivo ||
      "SEFAZ temporariamente indisponível. Tente novamente mais tarde.";
  } else {
    nfce.status = "rejeitada";
  }

  await nfce.save();

  return nfce;
}

async function consultarRetornoNfce(nfceId) {
  const nfce = await Nfce.findById(nfceId);

  if (!nfce) throw new Error("NFC-e não encontrada.");
  if (!nfce.recibo) throw new Error("Recibo não encontrado para consulta.");

  const retorno = await consultarReciboSefaz(nfce.recibo);

  nfce.cStat = retorno.cStat || "";
  nfce.protocolo = retorno.nProt || "";
  nfce.mensagemSefaz = retorno.xMotivo || "Consulta SEFAZ realizada.";

  if (retorno.cStat === "100") {
    nfce.status = "autorizada";
    nfce.protocolo = retorno.nProt || "";
    nfce.dataAutorizacao = retorno.dhRecbto ? new Date(retorno.dhRecbto) : new Date();
  } else if (["103", "104", "105"].includes(retorno.cStat) || retorno.nRec) {
    nfce.status = "assinada";
  } else if (["108", "109"].includes(retorno.cStat)) {
    nfce.status = "assinada";
    nfce.mensagemSefaz = retorno.xMotivo || "SEFAZ temporariamente indisponível. Tente novamente.";
  } else {
    nfce.status = "rejeitada";
  }

  await nfce.save();
  return nfce;
}


/**
 * Cancela uma NFC-e autorizada na SEFAZ.
 *
 * O fluxo executado é:
 *
 * 1. localiza a NFC-e;
 * 2. valida o estado atual;
 * 3. valida chave, protocolo e justificativa;
 * 4. transmite o evento de cancelamento;
 * 5. salva todos os XMLs e protocolos;
 * 6. altera o status para cancelada quando confirmado.
 */
async function cancelarNfce(nfceId, justificativa) {
  if (!nfceId) {
    throw new Error(
      "O identificador da NFC-e não foi informado."
    );
  }

  const nfce = await Nfce.findById(nfceId);

  if (!nfce) {
    throw new Error("NFC-e não encontrada.");
  }

  /*
   * Se já estiver cancelada, não enviamos outro evento
   * desnecessariamente para a SEFAZ.
   */
  if (nfce.status === "cancelada") {
    throw new Error(
      "Esta NFC-e já está cancelada."
    );
  }

  if (nfce.status !== "autorizada") {
    throw new Error(
      `Somente uma NFC-e autorizada pode ser cancelada. ` +
        `Status atual: ${nfce.status || "não informado"}.`
    );
  }

  if (!nfce.chaveAcesso) {
    throw new Error(
      "A chave de acesso da NFC-e não foi encontrada."
    );
  }

  if (!nfce.protocolo) {
    throw new Error(
      "O protocolo de autorização da NFC-e não foi encontrado."
    );
  }

  const justificativaValidada =
    validarJustificativa(justificativa);

  const dataEvento = new Date();

  const retorno =
    await cancelarNfceNaSefaz({
      chaveAcesso: nfce.chaveAcesso,
      protocolo: nfce.protocolo,
      justificativa:
        justificativaValidada,
      ambiente:
        nfce.ambiente ||
        process.env.NFCE_AMBIENTE ||
        "homologacao",
      sequenciaEvento: 1,
      dataEvento,
    });

  /*
   * Persistimos o retorno mesmo quando a SEFAZ rejeitar
   * o evento. Isso mantém um histórico técnico completo
   * para auditoria e diagnóstico.
   */
  nfce.cancelamento = {
    justificativa:
      justificativaValidada,

    protocolo:
      retorno.protocoloEvento || "",

    cStat:
      retorno.cStatEvento ||
      retorno.cStat ||
      "",

    xMotivo:
      retorno.xMotivoEvento ||
      retorno.xMotivo ||
      "",

    dataEvento,

    dataRegistro:
      converterDataSefaz(
        retorno.dataRegistro
      ),

    sequenciaEvento:
      Number(
        retorno.sequenciaEvento || 1
      ),

    tipoEvento:
      retorno.tipoEvento ||
      "110111",

    eventoDuplicado:
      Boolean(
        retorno.eventoDuplicado
      ),

    xmlEvento:
      retorno.xmlEvento || "",

    xmlEventoAssinado:
      retorno.xmlEventoAssinado || "",

    xmlLote:
      retorno.xmlLote || "",

    xmlRetorno:
      retorno.xmlRetorno || "",

    xmlSoap:
      retorno.xmlSoap || "",
  };

  /*
   * O evento é considerado concluído quando:
   *
   * - a SEFAZ confirmar o cancelamento; ou
   * - informar que o mesmo evento já havia sido registrado.
   *
   * Um evento duplicado significa que o cancelamento
   * anterior já foi recebido pela SEFAZ.
   */
  const cancelamentoConcluido =
    Boolean(
      retorno.cancelamentoConfirmado
    ) ||
    Boolean(
      retorno.eventoDuplicado
    );

  if (cancelamentoConcluido) {
    nfce.status = "cancelada";

    nfce.mensagemSefaz =
      retorno.xMotivoEvento ||
      retorno.xMotivo ||
      "Cancelamento da NFC-e confirmado pela SEFAZ.";
  } else {
    nfce.mensagemSefaz =
      retorno.xMotivoEvento ||
      retorno.xMotivo ||
      "A SEFAZ não confirmou o cancelamento da NFC-e.";
  }

  await nfce.save();

  /*
   * Não alteramos automaticamente pedido.status para
   * "cancelado" nesta etapa.
   *
   * Cancelar fiscalmente uma nota e cancelar comercialmente
   * um pedido são operações diferentes. Essa atualização
   * será controlada posteriormente pelo controller/fluxo
   * do pedido para evitar cancelamento indevido.
   */
  return nfce;
}

module.exports = {
  gerarNfceDoPedido,
  assinarNfce,
  transmitirNfce,
  consultarRetornoNfce,
  cancelarNfce,
};

