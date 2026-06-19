const crypto = require("crypto");
const Pedido = require("../models/pedido");
const Nfce = require("../models/nfce");
const ConfiguracaoFiscal = require("../models/configuracaofiscal");

const { assinarXmlNfce } = require("./xmlSignatureService");
const {
  transmitirNfceParaSefaz,
  consultarReciboSefaz,
} = require("./sefazPrService");

const UF_PR = "41";
const MODELO_NFCE = "65";
const SERIE_PADRAO = 1;
const AMBIENTE_HOMOLOGACAO = "homologacao";
const CNPJ_PADRAO = "67199298000181";
const IE_PADRAO = "9123591400";
const MUNICIPIO_UMUARAMA = "4128104";
const URL_QRCODE_PR = "http://www.fazenda.pr.gov.br/nfce/qrcode";
const URL_CONSULTA_PR = "http://www.fazenda.pr.gov.br/nfce/consulta";

function somenteNumeros(valor = "") {
  return String(valor || "").replace(/\D/g, "");
}

function numeroComZeros(numero, tamanho) {
  return String(numero).padStart(tamanho, "0");
}

function escapeXml(valor = "") {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function limparXmlParaSefaz(xml = "") {
  return String(xml)
    .replace(/^\uFEFF/, "")
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/>\s+</g, "><")
    .trim();
}

function extrairTagXml(xml, tag) {
  const match = String(xml).match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? match[1] : "";
}

function formatarDataHoraSaoPaulo() {
  return (
    new Date()
      .toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" })
      .replace(" ", "T") + "-03:00"
  );
}

function calcularDV(chave43) {
  const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;
  let pesoIndex = 0;

  for (let i = chave43.length - 1; i >= 0; i -= 1) {
    soma += Number(chave43[i]) * pesos[pesoIndex];
    pesoIndex = pesoIndex + 1 >= pesos.length ? 0 : pesoIndex + 1;
  }

  const resto = soma % 11;
  const dv = 11 - resto;
  return dv === 10 || dv === 11 ? 0 : dv;
}

function gerarCodigoNumerico() {
  return String(Math.floor(10000000 + Math.random() * 89999999));
}

function gerarChaveAcesso({ cnpj, numero, serie }) {
  const agora = new Date();
  const ano = String(agora.getFullYear()).slice(2);
  const mes = numeroComZeros(agora.getMonth() + 1, 2);
  const aamm = `${ano}${mes}`;

  const cNF = gerarCodigoNumerico();
  const chave43 =
    UF_PR +
    aamm +
    numeroComZeros(somenteNumeros(cnpj), 14) +
    MODELO_NFCE +
    numeroComZeros(serie, 3) +
    numeroComZeros(numero, 9) +
    "1" +
    cNF;

  const dv = calcularDV(chave43);

  return {
    chave: `${chave43}${dv}`,
    cUF: UF_PR,
    cNF,
    dv,
  };
}

function getAmbiente(config) {
  return process.env.NFCE_AMBIENTE || config?.ambiente || AMBIENTE_HOMOLOGACAO;
}

function getTpAmb(ambiente) {
  return ambiente === "producao" ? "1" : "2";
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

function montarItensXml(produtos = [], ambiente) {
  if (!Array.isArray(produtos) || produtos.length === 0) {
    throw new Error("Pedido sem produtos para emissão da NFC-e.");
  }

  return produtos
    .map((item, index) => {
      const quantidade = Number(item.quantidade || 1);
      const preco = Number(item.preco || item.valorUnitario || 0);
      const total = quantidade * preco;

      if (!Number.isFinite(quantidade) || quantidade <= 0) {
        throw new Error(`Quantidade inválida no item ${index + 1}.`);
      }

      if (!Number.isFinite(preco) || preco <= 0) {
        throw new Error(`Preço inválido no item ${index + 1}.`);
      }

      return `
      <det nItem="${index + 1}">
        <prod>
          <cProd>${escapeXml(item.produtoId || item._id || index + 1)}</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>${escapeXml(getProdutoNomeFiscal(item.nome, index, ambiente))}</xProd>
          <NCM>${escapeXml(item.ncm || "21069090")}</NCM>
          <CFOP>${escapeXml(item.cfop || "5102")}</CFOP>
          <uCom>${escapeXml(item.unidade || "UN")}</uCom>
          <qCom>${quantidade.toFixed(4)}</qCom>
          <vUnCom>${preco.toFixed(2)}</vUnCom>
          <vProd>${total.toFixed(2)}</vProd>
          <cEANTrib>SEM GTIN</cEANTrib>
          <uTrib>${escapeXml(item.unidade || "UN")}</uTrib>
          <qTrib>${quantidade.toFixed(4)}</qTrib>
          <vUnTrib>${preco.toFixed(2)}</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS><ICMSSN102><orig>0</orig><CSOSN>102</CSOSN></ICMSSN102></ICMS>
          <PIS><PISOutr><CST>99</CST><vBC>0.00</vBC><pPIS>0.00</pPIS><vPIS>0.00</vPIS></PISOutr></PIS>
          <COFINS><COFINSOutr><CST>99</CST><vBC>0.00</vBC><pCOFINS>0.00</pCOFINS><vCOFINS>0.00</vCOFINS></COFINSOutr></COFINS>
        </imposto>
      </det>`;
    })
    .join("");
}

function montarXmlPagamento(pedido, valorTotal) {
  const tPag = obterCodigoPagamento(pedido.pagamento || pedido.formaPagamento);

  return `
    <pag>
      <detPag>
        <tPag>${tPag}</tPag>
        <vPag>${valorTotal.toFixed(2)}</vPag>
      </detPag>
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
    <total><ICMSTot><vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson><vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST><vFCPST>0.00</vFCPST><vFCPSTRet>0.00</vFCPSTRet><vProd>${valorTotal.toFixed(2)}</vProd><vFrete>0.00</vFrete><vSeg>0.00</vSeg><vDesc>0.00</vDesc><vII>0.00</vII><vIPI>0.00</vIPI><vIPIDevol>0.00</vIPIDevol><vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS><vOutro>0.00</vOutro><vNF>${valorTotal.toFixed(2)}</vNF></ICMSTot></total>
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

function gerarQrCodeUrlNfce({ chaveAcesso, ambiente, cpfNota, dhEmi, valorTotal, digestValue }) {
  const csc = getCscToken();

  if (!csc) {
    throw new Error("NFCE_CSC não configurado no Render.");
  }

  const dados = [
    chaveAcesso,
    "2",
    getTpAmb(ambiente),
    somenteNumeros(cpfNota || ""),
    textoParaHex(dhEmi),
    Number(valorTotal || 0).toFixed(2),
    "0.00",
    digestBase64ParaHex(digestValue),
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

  const config =
    (await ConfiguracaoFiscal.findOne()) ||
    (await ConfiguracaoFiscal.create({}));

  const numero = Number(config.proximoNumeroNfce || 1);
  const serie = Number(config.serieNfce || SERIE_PADRAO);
  const ambiente = getAmbiente(config);

  const chaveDados = gerarChaveAcesso({
    cnpj: getEmpresaCnpj(),
    numero,
    serie,
  });

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

  config.proximoNumeroNfce = numero + 1;
  await config.save();

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
    cpfNota: nfce.cpfNota,
    dhEmi,
    valorTotal: nfce.valorTotal,
    digestValue,
  });

  const xmlAssinadoFinal = inserirInfNFeSupl(xmlAssinadoBase, qrCodeUrl);

  nfce.xml = xmlLimpo;
  nfce.xmlAssinado = limparXmlParaSefaz(xmlAssinadoFinal);
  nfce.qrCodeUrl = qrCodeUrl;
  nfce.status = "assinada";
  nfce.mensagemSefaz = "XML assinado com QR Code NFC-e. Próxima etapa: transmissão SEFAZ.";

  await nfce.save();
  return nfce;
}

async function transmitirNfce(nfceId) {
  let nfce = await Nfce.findById(nfceId);

  if (!nfce) throw new Error("NFC-e não encontrada.");
  if (!nfce.xmlAssinado) nfce = await assinarNfce(nfceId);

  const idLote = String(nfce.numero).padStart(15, "0");
  const retorno = await transmitirNfceParaSefaz(nfce.xmlAssinado, idLote);

  nfce.cStat = retorno.cStat || "";
  nfce.recibo = retorno.nRec || "";
  nfce.protocolo = retorno.nProt || "";
  nfce.mensagemSefaz = retorno.xMotivo || "Retorno SEFAZ recebido.";

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

module.exports = {
  gerarNfceDoPedido,
  assinarNfce,
  transmitirNfce,
  consultarRetornoNfce,
};

