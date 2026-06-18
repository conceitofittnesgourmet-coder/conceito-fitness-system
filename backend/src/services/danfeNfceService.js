const QRCode = require("qrcode");

function dinheiro(valor) {
  return Number(valor || 0).toFixed(2).replace(".", ",");
}

function dataHora(data) {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR");
}

async function gerarDanfeNfceHtml(nfce) {
  const pedido = nfce.pedido || {};
  const produtos = pedido.produtos || [];

  const qrConteudo =
    nfce.qrCodeUrl ||
    nfce.chaveAcesso ||
    `NFC-e ${nfce.numero}`;

  const qrCodeDataUrl = await QRCode.toDataURL(qrConteudo);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>DANFE NFC-e ${nfce.numero}</title>
<style>
  body {
    font-family: Arial, sans-serif;
    width: 300px;
    margin: 0 auto;
    padding: 10px;
    font-size: 12px;
    color: #111;
  }
  .center { text-align: center; }
  .linha { border-top: 1px dashed #000; margin: 8px 0; }
  .item { display: flex; justify-content: space-between; gap: 8px; }
  .small { font-size: 10px; }
  .total { font-size: 16px; font-weight: bold; }
  img { width: 160px; height: 160px; }
  button {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    background: #00c853;
    border: 0;
    font-weight: bold;
    cursor: pointer;
  }
  @media print {
    button { display: none; }
    body { width: 280px; }
  }
</style>
</head>
<body>
<button onclick="window.print()">Imprimir DANFE</button>

<div class="center">
  <strong>CONCEITO FITNESS GOURMET LTDA</strong><br/>
  CNPJ: 67.199.298/0001-81<br/>
  IE: 9123591400<br/>
  AV PARANA, 8455 - ZONA III<br/>
  UMUARAMA - PR
</div>

<div class="linha"></div>

<div class="center">
  <strong>DANFE NFC-e</strong><br/>
  Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica<br/>
  <span class="small">Não permite aproveitamento de crédito de ICMS</span>
</div>

<div class="linha"></div>

<div>
  <strong>NFC-e:</strong> ${nfce.numero}<br/>
  <strong>Série:</strong> ${nfce.serie}<br/>
  <strong>Ambiente:</strong> ${nfce.ambiente}<br/>
  <strong>Status:</strong> ${nfce.status}<br/>
  <strong>cStat:</strong> ${nfce.cStat || "-"}<br/>
  <strong>Emissão:</strong> ${dataHora(nfce.createdAt)}
</div>

<div class="linha"></div>

<strong>Itens</strong><br/>
${produtos.map((p) => `
  <div class="item">
    <span>${p.quantidade}x ${p.nome}</span>
    <span>R$ ${dinheiro(p.subtotal || p.preco)}</span>
  </div>
`).join("")}

<div class="linha"></div>

<div class="item total">
  <span>TOTAL</span>
  <span>R$ ${dinheiro(nfce.valorTotal)}</span>
</div>

<div class="linha"></div>

<div>
  <strong>Cliente:</strong> ${pedido.cliente || "Consumidor Final"}<br/>
  <strong>CPF na nota:</strong> ${nfce.cpfNota || "Não informado"}<br/>
  <strong>Pagamento:</strong> ${pedido.pagamento || "-"}
</div>

<div class="linha"></div>

<div class="center">
  <img src="${qrCodeDataUrl}" />
  <br/>
  <span class="small">Consulte pela chave de acesso</span>
</div>

<div class="small">
  <strong>Chave:</strong><br/>
  ${nfce.chaveAcesso || "-"}
</div>

<div class="linha"></div>

<div class="center small">
  ${nfce.mensagemSefaz || ""}
</div>

</body>
</html>`;
}

module.exports = {
  gerarDanfeNfceHtml,
};