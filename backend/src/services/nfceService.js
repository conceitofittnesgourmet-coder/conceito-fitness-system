const crypto = require("crypto");
const Pedido = require("../models/pedido");
const Nfce = require("../models/nfce");
const ConfiguracaoFiscal = require("../models/configuracaofiscal");

const { assinarXmlNfce } = require("./xmlSignatureService");
const {
  transmitirNfceParaSefaz,
  consultarReciboSefaz,
} = require("./sefazPrService");

function somenteNumeros(valor = "") {
  return String(valor).replace(/\D/g, "");
}

function numeroComZeros(numero, tamanho) {
  return String(numero).padStart(tamanho, "0");
}

function calcularDV(chave43) {
  const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;
  let pesoIndex = 0;

  for (let i = chave43.length - 1; i >= 0; i--) {
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

function gerarChaveAcesso({ cnpj, numero, serie, ambiente }) {
  const cUF = "41"; // Paraná
  const agora = new Date();
  const ano = String(agora.getFullYear()).slice(2);
  const mes = numeroComZeros(agora.getMonth() + 1, 2);
  const aamm = `${ano}${mes}`;
  const cnpj14 = numeroComZeros(somenteNumeros(cnpj), 14);
  const modelo = "65";
  const serie3 = numeroComZeros(serie, 3);
  const numero9 = numeroComZeros(numero, 9);
  const tpEmis = "1";
  const cNF = gerarCodigoNumerico();

  const chave43 =
    cUF + aamm + cnpj14 + modelo + serie3 + numero9 + tpEmis + cNF;

  const dv = calcularDV(chave43);

  return {
    chave: `${chave43}${dv}`,
    cUF,
    cNF,
    dv,
  };
}

function escapeXml(valor = "") {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function limparXmlParaSefaz(xml = "") {
  return String(xml)
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/>\s+</g, "><")
    .trim();
}

function obterCodigoPagamento(tipo) {
  const pagamento = String(tipo || "").toUpperCase();

  if (pagamento.includes("PIX")) return "17";
  if (pagamento.includes("DINHEIRO")) return "01";
  if (pagamento.includes("DEBITO")) return "04";
  if (pagamento.includes("DÉBITO")) return "04";
  if (pagamento.includes("CREDITO")) return "03";
  if (pagamento.includes("CRÉDITO")) return "03";

  return "99";
}

function montarItensXml(produtos = []) {
  return produtos
    .map((item, index) => {
      const quantidade = Number(item.quantidade || 1);
      const preco = Number(item.preco || 0);
      const total = quantidade * preco;

      return `
      <det nItem="${index + 1}">
        <prod>
          <cProd>${escapeXml(item.produtoId || index + 1)}</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>${
  process.env.NFCE_AMBIENTE !== "producao" && index === 0
    ? "NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL"
    : escapeXml(item.nome || "Produto")
}</xProd>
          <NCM>21069090</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>${quantidade.toFixed(4)}</qCom>
          <vUnCom>${preco.toFixed(2)}</vUnCom>
          <vProd>${total.toFixed(2)}</vProd>
          <cEANTrib>SEM GTIN</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>${quantidade.toFixed(4)}</qTrib>
          <vUnTrib>${preco.toFixed(2)}</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMSSN102>
              <orig>0</orig>
              <CSOSN>102</CSOSN>
            </ICMSSN102>
          </ICMS>
          <PIS>
            <PISOutr>
              <CST>99</CST>
              <vBC>0.00</vBC>
              <pPIS>0.00</pPIS>
              <vPIS>0.00</vPIS>
            </PISOutr>
          </PIS>
          <COFINS>
            <COFINSOutr>
              <CST>99</CST>
              <vBC>0.00</vBC>
              <pCOFINS>0.00</pCOFINS>
              <vCOFINS>0.00</vCOFINS>
            </COFINSOutr>
          </COFINS>
        </imposto>
      </det>`;
    })
    .join("");
}

function montarXmlNfce({ pedido, numero, serie, chaveDados, ambiente }) {
  const cnpj = somenteNumeros(process.env.EMPRESA_CNPJ || "67199298000181");
  const cpfNota = somenteNumeros(pedido.cpfNota || "");
  const valorTotal = Number(pedido.total || 0);
  const dhEmi = new Date()
  .toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" })
  .replace(" ", "T") + "-03:00";

  const id = `NFe${chaveDados.chave}`;

 const destXml =
  cpfNota.length === 11
    ? `
      <dest>
        <CPF>${cpfNota}</CPF>
        ${
          ambiente !== "producao"
            ? "<xNome>NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL</xNome>"
            : ""
        }
        <indIEDest>9</indIEDest>
      </dest>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="${id}" versao="4.00">
    <ide>
      <cUF>41</cUF>
      <cNF>${chaveDados.cNF}</cNF>
      <natOp>VENDA</natOp>
      <mod>65</mod>
      <serie>${serie}</serie>
      <nNF>${numero}</nNF>
      <dhEmi>${dhEmi}</dhEmi>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <cMunFG>4128104</cMunFG>
      <tpImp>4</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>${chaveDados.dv}</cDV>
      <tpAmb>${ambiente === "producao" ? "1" : "2"}</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>1</indFinal>
      <indPres>1</indPres>
      <procEmi>0</procEmi>
      <verProc>ConceitoFitERP-1.0</verProc>
    </ide>

    <emit>
      <CNPJ>${cnpj}</CNPJ>
      <xNome>CONCEITO FITNESS</xNome>
      <xFant>CONCEITO FITNESS</xFant>
      <enderEmit>
  <xLgr>AV PARANA</xLgr>
  <nro>8455</nro>
  <xBairro>ZONA III</xBairro>
  <cMun>4128104</cMun>
  <xMun>UMUARAMA</xMun>
  <UF>PR</UF>
  <CEP>87502000</CEP>
  <cPais>1058</cPais>
  <xPais>BRASIL</xPais>
</enderEmit>
      <IE>${somenteNumeros(process.env.EMPRESA_IE || "9123591400")}</IE>
      <CRT>1</CRT>
    </emit>

    ${destXml}

    ${montarItensXml(pedido.produtos)}

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
        <vProd>${valorTotal.toFixed(2)}</vProd>
        <vFrete>0.00</vFrete>
        <vSeg>0.00</vSeg>
        <vDesc>0.00</vDesc>
        <vII>0.00</vII>
        <vIPI>0.00</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>0.00</vPIS>
        <vCOFINS>0.00</vCOFINS>
        <vOutro>0.00</vOutro>
        <vNF>${valorTotal.toFixed(2)}</vNF>
      </ICMSTot>
    </total>

    <transp>
      <modFrete>9</modFrete>
    </transp>

    <pag>
      <detPag>
        <tPag>${obterCodigoPagamento(pedido.pagamento)}</tPag>
        <vPag>${valorTotal.toFixed(2)}</vPag>
      </detPag>
    </pag>

    <infAdic>
  <infCpl>TESTE</infCpl>
</infAdic>
  </infNFe>
</NFe>`;
}

async function gerarNfceDoPedido(pedidoId) {
  const pedido = await Pedido.findById(pedidoId);

  if (!pedido) {
    throw new Error("Pedido não encontrado.");
  }

  if (pedido.status === "cancelado") {
  throw new Error(
    "Não é permitido emitir NFC-e para pedido cancelado."
  );
}

  const config =
    (await ConfiguracaoFiscal.findOne()) ||
    (await ConfiguracaoFiscal.create({}));

  const numero = Number(config.proximoNumeroNfce || 1);
  const serie = Number(config.serieNfce || 1);
  const ambiente = process.env.NFCE_AMBIENTE || config.ambiente || "homologacao";

  const chaveDados = gerarChaveAcesso({
    cnpj: process.env.EMPRESA_CNPJ || "67199298000181",
    numero,
    serie,
    ambiente,
  });

  

  const xml = montarXmlNfce({
    pedido,
    numero,
    serie,
    chaveDados,
    ambiente,
  });

  const qrCodeUrl = crypto
    .createHash("sha256")
    .update(`${chaveDados.chave}|${process.env.NFCE_CSC || ""}`)
    .digest("hex");

  const nfce = await Nfce.create({
    pedido: pedido._id,
    numero,
    serie,
    ambiente,
    chaveAcesso: chaveDados.chave,
    cpfNota: pedido.cpfNota || "",
    valorTotal: Number(pedido.total || 0),
    xml,
    status: "gerada",
    qrCodeUrl,
    mensagemSefaz:
      "NFC-e gerada em homologação. Próxima etapa: assinatura e transmissão SEFAZ.",
  });

  config.proximoNumeroNfce = numero + 1;
  await config.save();

  return nfce;
}

async function assinarNfce(nfceId) {
  const nfce = await Nfce.findById(nfceId);

  if (!nfce) {
    throw new Error("NFC-e não encontrada.");
  }

  if (!nfce.xml) {
    throw new Error("XML da NFC-e não encontrado.");
  }

  const xmlLimpo = limparXmlParaSefaz(nfce.xml);
  const xmlAssinado = assinarXmlNfce(xmlLimpo);

  nfce.xml = xmlLimpo;
  nfce.xmlAssinado = xmlAssinado;
  nfce.status = "assinada";
  nfce.mensagemSefaz =
    "XML assinado com certificado A1. Próxima etapa: transmissão SEFAZ.";

  await nfce.save();

  return nfce;
}

async function transmitirNfce(nfceId) {
  const nfce = await Nfce.findById(nfceId);

  if (!nfce) throw new Error("NFC-e não encontrada.");
  if (!nfce.xmlAssinado) throw new Error("XML assinado não encontrado.");

  const idLote = String(nfce.numero).padStart(15, "0");
  const retorno = await transmitirNfceParaSefaz(nfce.xmlAssinado, idLote);

  nfce.cStat = retorno.cStat || "";
  nfce.recibo = retorno.nRec || "";
  nfce.protocolo = retorno.nProt || "";
  nfce.mensagemSefaz = retorno.xMotivo || "Retorno SEFAZ recebido.";

 if (retorno.cStat === "100") {
  nfce.status = "autorizada";
  nfce.protocolo = retorno.nProt || "";
  nfce.dataAutorizacao = retorno.dhRecbto
    ? new Date(retorno.dhRecbto)
    : new Date();
} else if (
  retorno.cStat === "103" ||
  retorno.cStat === "104" ||
  retorno.cStat === "105" ||
  retorno.nRec
) {
  nfce.status = "assinada";
} else if (
  retorno.cStat === "108" ||
  retorno.cStat === "109"
) {
  nfce.status = "assinada";
  nfce.mensagemSefaz =
    retorno.xMotivo ||
    "SEFAZ temporariamente indisponível. Tente novamente.";
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
  nfce.dataAutorizacao = retorno.dhRecbto
    ? new Date(retorno.dhRecbto)
    : new Date();
} else if (
  retorno.cStat === "103" ||
  retorno.cStat === "104" ||
  retorno.cStat === "105" ||
  retorno.nRec
) {
  nfce.status = "assinada";
} else if (
  retorno.cStat === "108" ||
  retorno.cStat === "109"
) {
  nfce.status = "assinada";
  nfce.mensagemSefaz =
    retorno.xMotivo ||
    "SEFAZ temporariamente indisponível. Tente novamente.";
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