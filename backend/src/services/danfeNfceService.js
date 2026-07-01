const QRCode = require("qrcode");

function dinheiro(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataHora(data) {
  if (!data) return new Date().toLocaleString("pt-BR");
  return new Date(data).toLocaleString("pt-BR");
}

function texto(valor, padrao = "-") {
  return String(valor || padrao);
}

async function gerarDanfeNfceHtml(nfce) {
  const pedido = nfce?.pedido || {};
  const produtos = Array.isArray(pedido.produtos)
    ? pedido.produtos
    : [];

  const qrConteudo =
    nfce?.qrCodeUrl ||
    nfce?.chaveAcesso ||
    `NFC-e ${nfce?.numero || ""}`;

  const qrCodeDataUrl = await QRCode.toDataURL(qrConteudo, {
    width: 220,
    margin: 1,
  });

  const itensHtml =
    produtos.length > 0
      ? produtos
          .map((item, index) => {
            const quantidade = Number(item.quantidade || 1);
            const preco = Number(item.preco || item.precoUnitario || 0);
            const subtotal = Number(
              item.subtotal || item.total || quantidade * preco
            );

            return `
              <tr>
                <td>${index + 1}</td>
                <td>
                  <strong>${texto(item.nome || item.produtoNome || "Produto")}</strong>
                  <br />
                  <small>${quantidade} x ${dinheiro(preco)}</small>
                </td>
                <td class="right">${dinheiro(subtotal)}</td>
              </tr>
            `;
          })
          .join("")
      : `
        <tr>
          <td colspan="3" class="center">
            Itens não encontrados no pedido vinculado.
          </td>
        </tr>
      `;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>DANFE NFC-e ${nfce?.numero || ""}</title>

  <style>
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
    }

    .danfe {
      width: 300px;
      max-width: 300px;
      margin: 0 auto;
      padding: 10px;
      background: #ffffff;
      color: #000000;
    }

    .center {
      text-align: center;
    }

    .right {
      text-align: right;
    }

    .linha {
      border-top: 1px dashed #000000;
      margin: 8px 0;
    }

    h1 {
      font-size: 15px;
      margin: 0 0 4px;
      text-align: center;
    }

    h2 {
      font-size: 13px;
      margin: 6px 0;
      text-align: center;
    }

    p {
      margin: 2px 0;
      line-height: 1.35;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      border-bottom: 1px solid #000000;
      font-size: 10px;
      text-align: left;
      padding: 3px 0;
    }

    td {
      padding: 4px 0;
      vertical-align: top;
      border-bottom: 1px dotted #999999;
    }

    small {
      font-size: 10px;
    }

    .total {
      display: flex;
      justify-content: space-between;
      font-size: 16px;
      font-weight: bold;
      margin-top: 6px;
    }

    .qr img {
      width: 190px;
      height: 190px;
      display: block;
      margin: 8px auto;
    }

    .chave {
      word-break: break-all;
      font-size: 10px;
      text-align: center;
      line-height: 1.4;
    }

    .btn-print {
      display: block;
      width: 300px;
      margin: 10px auto;
      padding: 10px;
      border: none;
      background: #16a34a;
      color: #ffffff;
      font-weight: bold;
      cursor: pointer;
      border-radius: 6px;
    }

    .status {
      font-weight: bold;
      text-transform: uppercase;
    }

    @page {
      size: 80mm auto;
      margin: 0;
    }

    @media print {
      html,
      body {
        width: 80mm;
        margin: 0;
        padding: 0;
        background: #ffffff !important;
        color: #000000 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .btn-print {
        display: none !important;
      }

      .danfe {
        width: 80mm;
        max-width: 80mm;
        margin: 0;
        padding: 6px;
      }
    }
  </style>
</head>

<body>
  <button class="btn-print" onclick="window.print()">
    Imprimir DANFE
  </button>

  <div class="danfe">
    <h1>CONCEITO FITNESS GOURMET</h1>

    <p class="center">CNPJ: 67.199.298/0001-81</p>
    <p class="center">IE: 9123591400</p>
    <p class="center">AV PARANÁ, 8455 - ZONA III</p>
    <p class="center">UMUARAMA - PR</p>

    <div class="linha"></div>

    <h2>DANFE NFC-e</h2>
    <p class="center">
      Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica
    </p>
    <p class="center">
      Não permite aproveitamento de crédito de ICMS
    </p>

    <div class="linha"></div>

    <p><strong>NFC-e:</strong> ${texto(nfce?.numero)}</p>
    <p><strong>Série:</strong> ${texto(nfce?.serie)}</p>
    <p><strong>Ambiente:</strong> ${texto(nfce?.ambiente)}</p>
    <p><strong>Status:</strong> <span class="status">${texto(nfce?.status)}</span></p>
    <p><strong>cStat:</strong> ${texto(nfce?.cStat)}</p>
    <p><strong>Protocolo:</strong> ${texto(nfce?.protocolo)}</p>
    <p><strong>Emissão:</strong> ${dataHora(nfce?.createdAt)}</p>

    <div class="linha"></div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Produto</th>
          <th class="right">Total</th>
        </tr>
      </thead>

      <tbody>
        ${itensHtml}
      </tbody>
    </table>

    <div class="linha"></div>

    <div class="total">
      <span>TOTAL</span>
      <span>${dinheiro(nfce?.valorTotal)}</span>
    </div>

    <div class="linha"></div>

    <p><strong>Cliente:</strong> ${texto(pedido.cliente, "Consumidor Final")}</p>
    <p><strong>CPF/CNPJ:</strong> ${texto(nfce?.cpfNota, "Não informado")}</p>
    <p><strong>Pagamento:</strong> ${texto(pedido.pagamento || pedido.formaPagamento)}</p>

    <div class="linha"></div>

    <div class="qr center">
      <img src="${qrCodeDataUrl}" alt="QR Code NFC-e" />
      <p>Consulte pela chave de acesso ou QR Code</p>
    </div>

    <div class="chave">
      <strong>Chave de acesso:</strong><br />
      ${texto(nfce?.chaveAcesso)}
    </div>

    <div class="linha"></div>

    <p class="center">
      ${texto(nfce?.mensagemSefaz, "")}
    </p>
  </div>

  <script>
    window.addEventListener("load", function () {
      setTimeout(function () {
        window.focus();
      }, 500);
    });
  </script>
</body>
</html>`;
}

module.exports = {
  gerarDanfeNfceHtml,
};