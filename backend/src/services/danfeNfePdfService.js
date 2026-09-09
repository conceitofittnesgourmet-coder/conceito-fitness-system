const PDFDocument = require("pdfkit");

function texto(v) {
  return String(v ?? "");
}

function moeda(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function data(v) {
  return v ? new Date(v).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "";
}

function formatarChave(v) {
  return texto(v).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatarEndereco(e = {}) {
  const partes = [];
  const linha = [texto(e.logradouro), texto(e.numero)].filter(Boolean).join(", ");
  if (linha) partes.push(linha);
  if (e.complemento) partes.push(texto(e.complemento));
  if (e.bairro) partes.push(texto(e.bairro));
  const cidadeUf = [texto(e.cidade), texto(e.uf)].filter(Boolean).join(" - ");
  if (cidadeUf) partes.push(cidadeUf);
  if (e.cep) partes.push("CEP " + texto(e.cep));
  return partes.join(" - ");
}

function caixa(doc, titulo, conteudo) {
  const x = doc.page.margins.left;
  const largura = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const y = doc.y;
  const alturaTexto = doc.heightOfString(texto(conteudo), { width: largura - 12 });
  const altura = Math.max(38, alturaTexto + 24);
  doc.rect(x, y, largura, altura).stroke();
  doc.font("Helvetica-Bold").fontSize(7).text(texto(titulo), x + 5, y + 4, { width: largura - 10 });
  doc.font("Helvetica").fontSize(8).text(texto(conteudo), x + 5, y + 15, { width: largura - 10 });
  doc.y = y + altura + 5;
}

function gerarDanfeNfePdf(nfe) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 24, bufferPages: true });
      const chunks = [];

      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const e = nfe.empresa || {};
      const d = nfe.destinatario || {};
      const itens = Array.isArray(nfe.itens) ? nfe.itens : [];
      const ef = e.enderecoFiscal || {};
      const de = d.endereco || {};
      const totais = nfe.totais || {};
      const cancelamento = nfe.cancelamento || {};

      if (nfe.status === "cancelada") {
        doc.font("Helvetica-Bold").fontSize(16).text("NF-e CANCELADA", { align: "center" });
        doc.font("Helvetica").fontSize(8).text("Protocolo: " + texto(cancelamento.protocolo) + "   Data/Hora: " + data(cancelamento.dataEvento), { align: "center" });
        doc.text("cStat: " + texto(cancelamento.cStat) + "   Motivo: " + texto(cancelamento.xMotivo), { align: "center" });
        if (cancelamento.justificativa) doc.text("Justificativa: " + texto(cancelamento.justificativa), { align: "center" });
        doc.moveDown(0.5);
      }

      if (nfe.ambiente !== "producao") {
        doc.font("Helvetica-Bold").fontSize(12).text("SEM VALOR FISCAL - AMBIENTE DE HOMOLOGACAO", { align: "center" });
        doc.moveDown(0.4);
      }

      doc.font("Helvetica-Bold").fontSize(16).text("DANFE", { align: "center" });
      doc.font("Helvetica").fontSize(8).text("Documento Auxiliar da Nota Fiscal Eletronica", { align: "center" });
      doc.font("Helvetica-Bold").fontSize(9).text("NF-e " + texto(nfe.numero) + "   Serie " + texto(nfe.serie), { align: "center" });
      doc.moveDown(0.5);

      caixa(doc, "EMITENTE", texto(e.razaoSocial || e.nome || "CONCEITO FITNESS GOURMET") + "\nNome fantasia: " + texto(e.nomeFantasia) + "\nCNPJ: " + texto(e.cnpj) + "   IE: " + texto(e.inscricaoEstadual || e.ie) + "\n" + formatarEndereco(ef));

      caixa(doc, "CHAVE DE ACESSO / AUTORIZACAO", "Chave: " + formatarChave(nfe.chaveAcesso) + "\nProtocolo: " + texto(nfe.protocolo || "Aguardando autorizacao") + "\nEmissao: " + data(nfe.dataEmissao));

      caixa(doc, "DESTINATARIO / REMETENTE", "Nome/Razao Social: " + texto(d.nomeRazaoSocial) + "\nCNPJ/CPF: " + texto(d.cnpj || d.cpf) + "   IE: " + texto(d.inscricaoEstadual) + "\nEndereco: " + formatarEndereco(de));

      doc.font("Helvetica-Bold").text("DADOS DOS PRODUTOS / SERVICOS");
      doc.font("Helvetica");
      itens.forEach((i, idx) => {
        const qtd = Number(i.quantidadeComercial ? i.quantidadeComercial : 0).toFixed(3);
        doc.font("Helvetica-Bold").text((idx + 1) + ". Cod: " + texto(i.codigo) + " - " + texto(i.descricao));
        doc.font("Helvetica").text("NCM: " + texto(i.ncm) + "   CFOP: " + texto(i.cfop) + "   UN: " + texto(i.unidadeComercial) + "   Qtd: " + qtd);
        doc.text("V. Unit.: " + moeda(i.valorUnitarioComercial) + "   V. Total: " + moeda(i.valorProduto));
        doc.moveDown(0.4);
      });
      doc.moveDown();

      caixa(doc, "CALCULO / TOTAIS DA NF-E", "Produtos: " + moeda(totais.valorProdutos) + "   Frete: " + moeda(totais.valorFrete) + "   Desconto: " + moeda(totais.valorDesconto) + "\nOutras despesas: " + moeda(totais.outrasDespesas) + "   Valor total da NF-e: " + moeda(totais.valorTotal));
      if (nfe.informacoesComplementares) {
        caixa(doc, "INFORMACOES COMPLEMENTARES", texto(nfe.informacoesComplementares));
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { gerarDanfeNfePdf };
