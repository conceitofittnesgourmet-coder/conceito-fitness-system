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
  textoFiscal,
  numeroFiscal,
  validarGtin,
  converterDataSefaz,
} = require("./fiscal/documentoFiscalUtils");

const {
  criarIdentificacaoNfce,
} = require("./fiscal/documentoFiscalService");

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

function obterCodigoPagamento(tipo) {
  const pagamento = String(tipo || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

  if (pagamento.includes("DINHEIRO")) return "01";
  if (pagamento.includes("CREDITO")) return "03";
  if (pagamento.includes("DEBITO")) return "04";
  if (pagamento.includes("CARTAO DE CREDITO")) return "03";
  if (pagamento.includes("CARTAO DE DEBITO")) return "04";
  if (pagamento.includes("CARTAO")) return "03";
  if (pagamento.includes("PIX")) return "17";

  return "17";
}

function getProdutoNomeFiscal(nome, index, ambiente) {
  if (ambiente !== "producao" && index === 0) {
    return "NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL";
  }

  return String(nome || "Produto").trim() || "Produto";
}


function obterDadosFiscaisItem(item = {}) {
  const fiscal = item.dadosFiscais || {};

  return {
    ncm: somenteNumeros(
      fiscal.ncm ||
      item.ncm ||
      ""
    ),

    cest: somenteNumeros(
      fiscal.cest ||
      item.cest ||
      ""
    ),

    origem: textoFiscal(
      fiscal.origemMercadoria ||
      fiscal.origem ||
      item.origem ||
      "0",
      "0"
    ),

    cfop: somenteNumeros(
      fiscal.cfopInterno ||
      fiscal.cfop ||
      item.cfop ||
      ""
    ),

    csosn: somenteNumeros(
      fiscal.csosn ||
      item.csosn ||
      ""
    ),

    cstIcms: somenteNumeros(
      fiscal.cstIcms ||
      fiscal.cst ||
      item.cstIcms ||
      ""
    ),

    codigoBeneficioFiscal: textoFiscal(
      fiscal.codigoBeneficioFiscal ||
      fiscal.cBenef ||
      ""
    ),

    gtin: somenteNumeros(
      fiscal.gtin ||
      item.codigoBarras ||
      item.gtin ||
      ""
    ),

    gtinTributavel: somenteNumeros(
      fiscal.gtinTributavel ||
      fiscal.gtinTrib ||
      fiscal.gtin ||
      item.codigoBarras ||
      ""
    ),

    unidadeComercial: textoFiscal(
      fiscal.unidadeComercial ||
      item.unidadeMedida ||
      item.unidade ||
      "UN",
      "UN"
    ).toUpperCase(),

    unidadeTributavel: textoFiscal(
      fiscal.unidadeTributavel ||
      fiscal.unidadeComercial ||
      item.unidadeMedida ||
      item.unidade ||
      "UN",
      "UN"
    ).toUpperCase(),

    cstPis: somenteNumeros(
      fiscal.cstPis ||
      fiscal.pis?.cst ||
      item.cstPis ||
      "99"
    ),

    aliquotaPis: numeroFiscal(
      fiscal.aliquotaPis ??
      fiscal.pis?.aliquota,
      0
    ),

    cstCofins: somenteNumeros(
      fiscal.cstCofins ||
      fiscal.cofins?.cst ||
      item.cstCofins ||
      "99"
    ),

    aliquotaCofins: numeroFiscal(
      fiscal.aliquotaCofins ??
      fiscal.cofins?.aliquota,
      0
    ),

    produtoTributavel:
      fiscal.produtoTributavel !== false,

    emitirNfce:
      fiscal.emitirNfce !== false,
  };
}


function validarDadosFiscaisItem(fiscal, item, index) {
  const nomeProduto = item.nome || `Item ${index + 1}`;

  if (!fiscal.emitirNfce) {
    throw new Error(
      `O produto "${nomeProduto}" está marcado para não emitir NFC-e.`
    );
  }

  if (!fiscal.produtoTributavel) {
    throw new Error(
      `O produto "${nomeProduto}" não está configurado como tributável.`
    );
  }

  if (fiscal.ncm.length !== 8) {
    throw new Error(
      `NCM inválido ou não informado no produto "${nomeProduto}".`
    );
  }

  if (fiscal.cfop.length !== 4) {
    throw new Error(
      `CFOP inválido ou não informado no produto "${nomeProduto}".`
    );
  }

  if (!fiscal.csosn) {
    throw new Error(
      `CSOSN não informado no produto "${nomeProduto}".`
    );
  }

  const csosnSuportados = ["102"];

  if (!csosnSuportados.includes(fiscal.csosn)) {
    throw new Error(
      `O CSOSN ${fiscal.csosn} do produto "${nomeProduto}" ainda não possui grupo XML implementado.`
    );
  }
}

function montarXmlIcms(fiscal) {
  return `
    <ICMS>
      <ICMSSN102>
        <orig>${escapeXml(fiscal.origem)}</orig>
        <CSOSN>${escapeXml(fiscal.csosn)}</CSOSN>
      </ICMSSN102>
    </ICMS>`;
}

function montarXmlPis(fiscal, valorProduto) {
  const cst = fiscal.cstPis || "99";
  const aliquota = Number(fiscal.aliquotaPis || 0);
  const valorPis = valorProduto * (aliquota / 100);

  if (["04", "05", "06", "07", "08", "09"].includes(cst)) {
    return `
      <PIS>
        <PISNT>
          <CST>${cst}</CST>
        </PISNT>
      </PIS>`;
  }

  if (["01", "02"].includes(cst)) {
    return `
      <PIS>
        <PISAliq>
          <CST>${cst}</CST>
          <vBC>${valorProduto.toFixed(2)}</vBC>
          <pPIS>${aliquota.toFixed(4)}</pPIS>
          <vPIS>${valorPis.toFixed(2)}</vPIS>
        </PISAliq>
      </PIS>`;
  }

  return `
    <PIS>
      <PISOutr>
        <CST>${cst}</CST>
        <vBC>${valorProduto.toFixed(2)}</vBC>
        <pPIS>${aliquota.toFixed(4)}</pPIS>
        <vPIS>${valorPis.toFixed(2)}</vPIS>
      </PISOutr>
    </PIS>`;
}

function montarXmlCofins(fiscal, valorProduto) {
  const cst = fiscal.cstCofins || "99";
  const aliquota = Number(fiscal.aliquotaCofins || 0);
  const valorCofins = valorProduto * (aliquota / 100);

  if (["04", "05", "06", "07", "08", "09"].includes(cst)) {
    return `
      <COFINS>
        <COFINSNT>
          <CST>${cst}</CST>
        </COFINSNT>
      </COFINS>`;
  }

  if (["01", "02"].includes(cst)) {
    return `
      <COFINS>
        <COFINSAliq>
          <CST>${cst}</CST>
          <vBC>${valorProduto.toFixed(2)}</vBC>
          <pCOFINS>${aliquota.toFixed(4)}</pCOFINS>
          <vCOFINS>${valorCofins.toFixed(2)}</vCOFINS>
        </COFINSAliq>
      </COFINS>`;
  }

  return `
    <COFINS>
      <COFINSOutr>
        <CST>${cst}</CST>
        <vBC>${valorProduto.toFixed(2)}</vBC>
        <pCOFINS>${aliquota.toFixed(4)}</pCOFINS>
        <vCOFINS>${valorCofins.toFixed(2)}</vCOFINS>
      </COFINSOutr>
    </COFINS>`;
}

function montarItensXml(produtos = [], ambiente) {
  if (!Array.isArray(produtos) || produtos.length === 0) {
    throw new Error(
      "Pedido sem produtos para emissão da NFC-e."
    );
  }

  return produtos
    .map((item, index) => {
      const fiscal = obterDadosFiscaisItem(item);

      validarDadosFiscaisItem(
        fiscal,
        item,
        index
      );

      const quantidade = Number(
        item.quantidade || 1
      );

      const precoUnitario = Number(
        item.precoUnitario ||
        item.preco ||
        item.valorUnitario ||
        0
      );

      const valorProduto =
        item.subtotal !== undefined
          ? Number(item.subtotal || 0)
          : quantidade * precoUnitario;

      if (
        !Number.isFinite(quantidade) ||
        quantidade <= 0
      ) {
        throw new Error(
          `Quantidade inválida no item ${index + 1}.`
        );
      }

      if (
        !Number.isFinite(precoUnitario) ||
        precoUnitario <= 0
      ) {
        throw new Error(
          `Preço inválido no item ${index + 1}.`
        );
      }

      if (
        !Number.isFinite(valorProduto) ||
        valorProduto <= 0
      ) {
        throw new Error(
          `Subtotal inválido no item ${index + 1}.`
        );
      }

      const codigoProduto =
        item.sku ||
        item.codigoBarras ||
        item.produtoId ||
        item._id ||
        index + 1;

      const cEAN = validarGtin(
        fiscal.gtin
      );

      const cEANTrib = validarGtin(
        fiscal.gtinTributavel
      );

      const cestXml = fiscal.cest
        ? `<CEST>${escapeXml(fiscal.cest)}</CEST>`
        : "";

      const beneficioXml =
        fiscal.codigoBeneficioFiscal
          ? `<cBenef>${escapeXml(
              fiscal.codigoBeneficioFiscal
            )}</cBenef>`
          : "";

      return `
      <det nItem="${index + 1}">
        <prod>
          <cProd>${escapeXml(codigoProduto)}</cProd>
          <cEAN>${cEAN}</cEAN>
          <xProd>${escapeXml(
            getProdutoNomeFiscal(
              item.nome,
              index,
              ambiente
            )
          )}</xProd>
          <NCM>${escapeXml(fiscal.ncm)}</NCM>
          ${cestXml}
          ${beneficioXml}
          <CFOP>${escapeXml(fiscal.cfop)}</CFOP>
          <uCom>${escapeXml(
            fiscal.unidadeComercial
          )}</uCom>
          <qCom>${quantidade.toFixed(4)}</qCom>
          <vUnCom>${precoUnitario.toFixed(10)}</vUnCom>
          <vProd>${valorProduto.toFixed(2)}</vProd>
          <cEANTrib>${cEANTrib}</cEANTrib>
          <uTrib>${escapeXml(
            fiscal.unidadeTributavel
          )}</uTrib>
          <qTrib>${quantidade.toFixed(4)}</qTrib>
          <vUnTrib>${precoUnitario.toFixed(10)}</vUnTrib>
          <indTot>1</indTot>
        </prod>

        <imposto>
          ${montarXmlIcms(fiscal)}
          ${montarXmlPis(
            fiscal,
            valorProduto
          )}
          ${montarXmlCofins(
            fiscal,
            valorProduto
          )}
        </imposto>
      </det>`;
    })
    .join("");
}

function montarXmlPagamento(pedido, valorTotal) {
  const pagamentos = Array.isArray(pedido.pagamentos) && pedido.pagamentos.length > 0
    ? pedido.pagamentos
    : [
        {
          forma: pedido.pagamento || pedido.formaPagamento || "PIX",
          valor: valorTotal,
        },
      ];

  const detPagXml = pagamentos
    .map((pagamentoItem) => {
      const forma = String(pagamentoItem.forma || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase();

      const tPag = obterCodigoPagamento(forma);
      const valor = Number(pagamentoItem.valor || 0);

      const precisaCard = ["03", "04", "17"].includes(tPag);

      const cardXml = precisaCard
        ? `
        <card>
          <tpIntegra>2</tpIntegra>
          <tBand>99</tBand>
          <cAut>000000</cAut>
        </card>`
        : "";

      return `
      <detPag>
        <tPag>${tPag}</tPag>
        <vPag>${valor.toFixed(2)}</vPag>
        ${cardXml}
      </detPag>`;
    })
    .join("");

  return `
    <pag>
      ${detPagXml}
    </pag>`;
}

function montarXmlDestinatario(cpfNota, ambiente) {
  const cpf = somenteNumeros(cpfNota || "");

  if (cpf.length !== 11) {
    return "";
  }

  return `
    <dest>
      <CPF>${cpf}</CPF>
      ${ambiente !== "producao" ? "<xNome>NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL</xNome>" : ""}
      <indIEDest>9</indIEDest>
    </dest>`;
}

function montarXmlNfce({ pedido, numero, serie, chaveDados, ambiente }) {
  const cnpj = getEmpresaCnpj();
  const cpfNota = somenteNumeros(pedido.cpfNota || "");
  const valorTotal = Number(pedido.total || 0);

    if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
    throw new Error("Valor total inválido para emissão da NFC-e.");
  }

const valorProdutos = (pedido.produtos || []).reduce(
  (totalProdutos, item) => {
    const subtotalItem =
      item.subtotal !== undefined
        ? Number(item.subtotal || 0)
        : Number(
            item.precoUnitario ||
            item.preco ||
            0
          ) *
          Number(item.quantidade || 1);

    return totalProdutos + subtotalItem;
  },
  0
);

const valorFrete = Number(
  pedido.taxaEntrega || 0
);

const valorDesconto = Number(
  pedido.desconto || 0
);

  const dhEmi = formatarDataHoraSaoPaulo();
  const id = `NFe${chaveDados.chave}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="${id}" versao="4.00">
    <ide>
      <cUF>${UF_PR}</cUF><cNF>${chaveDados.cNF}</cNF><natOp>VENDA</natOp><mod>${MODELO_NFCE}</mod><serie>${serie}</serie><nNF>${numero}</nNF><dhEmi>${dhEmi}</dhEmi><tpNF>1</tpNF><idDest>1</idDest><cMunFG>${MUNICIPIO_UMUARAMA}</cMunFG><tpImp>4</tpImp><tpEmis>1</tpEmis><cDV>${chaveDados.dv}</cDV><tpAmb>${getTpAmb(ambiente)}</tpAmb><finNFe>1</finNFe><indFinal>1</indFinal><indPres>1</indPres><procEmi>0</procEmi><verProc>ConceitoFitERP-1.0</verProc>
    </ide>
    <emit>
      <CNPJ>${cnpj}</CNPJ><xNome>CONCEITO FITNESS</xNome><xFant>CONCEITO FITNESS</xFant>
      <enderEmit><xLgr>AV PARANA</xLgr><nro>8455</nro><xBairro>ZONA III</xBairro><cMun>${MUNICIPIO_UMUARAMA}</cMun><xMun>UMUARAMA</xMun><UF>PR</UF><CEP>87502000</CEP><cPais>1058</cPais><xPais>BRASIL</xPais></enderEmit>
      <IE>${getEmpresaIe()}</IE><CRT>1</CRT>
    </emit>
    ${montarXmlDestinatario(cpfNota, ambiente)}
    ${montarItensXml(pedido.produtos, ambiente)}
    <total>
  <ICMSTot>
    <vBC>0.00</vBC>
    <vICMS>0.00</vICMS>
    <vICMSDeson>0.00</vICMSDeson>
    <vFCP>0.00</vFCP>
    <vBCST>0.00</vBCST>
    <vST>0.00</vST>
    <vFCPST>0.00</vFCPST>
    <vFCPSTRet>0.00</vFCPSTRet>
    <vProd>${valorProdutos.toFixed(2)}</vProd>
    <vFrete>${valorFrete.toFixed(2)}</vFrete>
    <vSeg>0.00</vSeg>
    <vDesc>${valorDesconto.toFixed(2)}</vDesc>
    <vII>0.00</vII>
    <vIPI>0.00</vIPI>
    <vIPIDevol>0.00</vIPIDevol>
    <vPIS>0.00</vPIS>
    <vCOFINS>0.00</vCOFINS>
    <vOutro>0.00</vOutro>
    <vNF>${valorTotal.toFixed(2)}</vNF>
  </ICMSTot>
</total>
    <transp><modFrete>9</modFrete></transp>
    ${montarXmlPagamento(pedido, valorTotal)}
    <infAdic><infCpl>${ambiente !== "producao" ? "TESTE" : "Documento emitido pelo sistema Conceito Fitness."}</infCpl></infAdic>
    <infRespTec><CNPJ>${cnpj}</CNPJ><xContato>CONCEITO FITNESS</xContato><email>conceitofittnesgourmet@gmail.com</email><fone>44999999999</fone></infRespTec>
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

  const xml = montarXmlNfce({ pedido, numero, serie, chaveDados, ambiente });

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

  const retorno = await transmitirNfceParaSefaz(
    nfce.xmlAssinado,
    idLote
  );

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

