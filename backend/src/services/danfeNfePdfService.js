const PDFDocument = require("pdfkit");
const bwipjs = require("bwip-js");

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

async function gerarCodigoBarras(chave) {
  const limpa = texto(chave).replace(/\D/g, "");
  if (limpa.length !== 44) return null;
  return bwipjs.toBuffer({ bcid: "code128", text: limpa, scale: 2, height: 10, includetext: false, padding: 0 });
}

async function gerarCodigoBarras(chave) {
  const limpa = texto(chave).replace(/\D/g, "");
  if (limpa.length !== 44) return null;
  return bwipjs.toBuffer({ bcid: "code128", text: limpa, scale: 2, height: 10, includetext: false, padding: 0 });
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

function campo(doc, x, y, w, h, rotulo, valor, opcoes = {}) {
  doc.rect(x, y, w, h).stroke();
  doc.font("Helvetica-Bold").fontSize(opcoes.tamanhoRotulo ? opcoes.tamanhoRotulo : 5.5).text(texto(rotulo).toUpperCase(), x + 3, y + 2, { width: w - 6 });
  doc.font(opcoes.negrito ? "Helvetica-Bold" : "Helvetica").fontSize(opcoes.tamanho ? opcoes.tamanho : 7).text(texto(valor), x + 3, y + 11, { width: w - 6, height: h - 13, align: opcoes.align ? opcoes.align : "left" });
}

async function gerarDanfeNfePdf(nfe) {
  const codigoBarras = await gerarCodigoBarras(nfe.chaveAcesso);
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

      const canhotoX = doc.page.margins.left;
      const canhotoW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const canhotoY = doc.y;
      doc.rect(canhotoX, canhotoY, canhotoW - 115, 42).stroke();
      doc.rect(canhotoX + canhotoW - 115, canhotoY, 115, 42).stroke();
      doc.font("Helvetica").fontSize(5.8).text("RECEBEMOS DE " + texto(e.razaoSocial ? e.razaoSocial : (e.nome ? e.nome : "CONCEITO FITNESS GOURMET")) + " OS PRODUTOS E/OU SERVICOS CONSTANTES DA NOTA FISCAL ELETRONICA INDICADA AO LADO.", canhotoX + 4, canhotoY + 4, { width: canhotoW - 123, height: 16 });
      doc.moveTo(canhotoX, canhotoY + 23).lineTo(canhotoX + canhotoW - 115, canhotoY + 23).stroke();
      doc.moveTo(canhotoX + 105, canhotoY + 23).lineTo(canhotoX + 105, canhotoY + 42).stroke();
      doc.font("Helvetica-Bold").fontSize(5.2).text("DATA DE RECEBIMENTO", canhotoX + 3, canhotoY + 26, { width: 99 });
      doc.text("IDENTIFICACAO E ASSINATURA DO RECEBEDOR", canhotoX + 109, canhotoY + 26, { width: canhotoW - 228 });
      doc.font("Helvetica-Bold").fontSize(10).text("NF-e", canhotoX + canhotoW - 111, canhotoY + 5, { width: 107, align: "center" });
      doc.font("Helvetica-Bold").fontSize(7).text("N. " + texto(nfe.numero), canhotoX + canhotoW - 111, canhotoY + 20, { width: 107, align: "center" });
      doc.text("SERIE " + texto(nfe.serie), canhotoX + canhotoW - 111, canhotoY + 31, { width: 107, align: "center" });
      doc.moveTo(canhotoX, canhotoY + 48).lineTo(canhotoX + canhotoW, canhotoY + 48).dash(3, { space: 2 }).stroke().undash();
      doc.y = canhotoY + 55;

      const hx = doc.page.margins.left;
      const hy = doc.y;
      const hw = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const hEmit = 245;
      const hDanfe = 92;
      const hChave = hw - hEmit - hDanfe;
      const alturaCab = 105;

      doc.rect(hx, hy, hEmit, alturaCab).stroke();
      doc.font("Helvetica-Bold").fontSize(11).text(texto(e.razaoSocial ? e.razaoSocial : (e.nome ? e.nome : "CONCEITO FITNESS GOURMET")), hx + 6, hy + 8, { width: hEmit - 12, align: "center" });
      doc.font("Helvetica-Bold").fontSize(8).text(texto(e.nomeFantasia), hx + 6, hy + 25, { width: hEmit - 12, align: "center" });
      doc.font("Helvetica").fontSize(6.5).text(formatarEndereco(ef), hx + 6, hy + 43, { width: hEmit - 12, align: "center" });
      doc.text("CNPJ: " + texto(e.cnpj) + "   IE: " + texto(e.inscricaoEstadual ? e.inscricaoEstadual : e.ie), hx + 6, hy + 75, { width: hEmit - 12, align: "center" });

      const dx = hx + hEmit;
      doc.rect(dx, hy, hDanfe, alturaCab).stroke();
      doc.font("Helvetica-Bold").fontSize(15).text("DANFE", dx + 4, hy + 7, { width: hDanfe - 8, align: "center" });
      doc.font("Helvetica").fontSize(6).text("Documento Auxiliar da Nota Fiscal Eletronica", dx + 5, hy + 27, { width: hDanfe - 10, align: "center" });
      doc.font("Helvetica").fontSize(6.5).text("0-Entrada", dx + 8, hy + 53);
      doc.text("1-Saida", dx + 8, hy + 63);
      doc.font("Helvetica-Bold").fontSize(8).text(texto(nfe.tipoOperacao ? nfe.tipoOperacao : 1), dx + 66, hy + 55);
      doc.font("Helvetica-Bold").fontSize(8).text("N. " + texto(nfe.numero), dx + 5, hy + 76, { width: hDanfe - 10, align: "center" });
      doc.text("Serie " + texto(nfe.serie) + "   Folha 1/1", dx + 5, hy + 88, { width: hDanfe - 10, align: "center" });

      const cx = dx + hDanfe;
      doc.rect(cx, hy, hChave, alturaCab).stroke();
      if (codigoBarras) doc.image(codigoBarras, cx + 8, hy + 8, { width: hChave - 16, height: 34 });
      doc.font("Helvetica-Bold").fontSize(5.5).text("CHAVE DE ACESSO", cx + 5, hy + 47, { width: hChave - 10 });
      doc.font("Helvetica").fontSize(7).text(formatarChave(nfe.chaveAcesso), cx + 5, hy + 58, { width: hChave - 10, align: "center" });
      doc.font("Helvetica").fontSize(5.5).text("Consulta de autenticidade no portal nacional da NF-e", cx + 5, hy + 78, { width: hChave - 10, align: "center" });

      const linhaY = hy + alturaCab;
      campo(doc, hx, linhaY, 330, 31, "NATUREZA DA OPERACAO", texto(nfe.naturezaOperacao), { tamanho: 7 });
      campo(doc, hx + 330, linhaY, hw - 330, 31, "PROTOCOLO DE AUTORIZACAO DE USO", texto(nfe.protocolo ? nfe.protocolo : "Aguardando autorizacao"), { tamanho: 7 });
      doc.y = linhaY + 36;

      doc.font("Helvetica-Bold").fontSize(6).text("DESTINATARIO / REMETENTE", hx, doc.y, { width: hw });
      const dy = doc.y + 8;
      campo(doc, hx, dy, 300, 30, "NOME / RAZAO SOCIAL", texto(d.nomeRazaoSocial), { tamanho: 7.2, negrito: true });
      campo(doc, hx + 300, dy, 135, 30, "CNPJ / CPF", texto(d.cnpj ? d.cnpj : d.cpf), { tamanho: 7 });
      campo(doc, hx + 435, dy, hw - 435, 30, "DATA DA EMISSAO", data(nfe.dataEmissao), { tamanho: 6.5 });
      const dy2 = dy + 30;
      campo(doc, hx, dy2, 275, 30, "ENDERECO", [texto(de.logradouro), texto(de.numero)].filter(Boolean).join(", ") + (de.complemento ? " - " + texto(de.complemento) : ""), { tamanho: 6.7 });
      campo(doc, hx + 275, dy2, 120, 30, "BAIRRO / DISTRITO", texto(de.bairro), { tamanho: 6.7 });
      campo(doc, hx + 395, dy2, hw - 395, 30, "CEP", texto(de.cep), { tamanho: 6.7 });
      const dy3 = dy2 + 30;
      campo(doc, hx, dy3, 245, 30, "MUNICIPIO", texto(de.cidade), { tamanho: 6.7 });
      campo(doc, hx + 245, dy3, 55, 30, "UF", texto(de.uf), { tamanho: 7, align: "center" });
      campo(doc, hx + 300, dy3, 130, 30, "INSCRICAO ESTADUAL", texto(d.inscricaoEstadual), { tamanho: 6.7 });
      campo(doc, hx + 430, dy3, hw - 430, 30, "FONE / FAX", texto(d.telefone), { tamanho: 6.7 });
      doc.y = dy3 + 36;

      doc.font("Helvetica-Bold").fontSize(6).text("DADOS DOS PRODUTOS / SERVICOS", hx, doc.y, { width: hw });
      const py = doc.y + 8;
      const col = [38, 210, 52, 42, 28, 55, 62, 63];
      const titulos = ["COD.", "DESCRICAO DO PRODUTO / SERVICO", "NCM/SH", "CFOP", "UN", "QTD.", "V. UNIT.", "V. TOTAL"];
      let px = hx;
      titulos.forEach((t, idx) => {
        doc.rect(px, py, col[idx], 20).stroke();
        doc.font("Helvetica-Bold").fontSize(5.2).text(t, px + 2, py + 6, { width: col[idx] - 4, align: "center" });
        px += col[idx];
      });
      let linhaProdutoY = py + 20;
      itens.forEach((i) => {
        const alturaLinha = 26;
        const valores = [
          texto(i.codigo),
          texto(i.descricao),
          texto(i.ncm),
          texto(i.cfop),
          texto(i.unidadeComercial),
          Number(i.quantidadeComercial ? i.quantidadeComercial : 0).toFixed(3),
          moeda(i.valorUnitarioComercial).replace("R$ ", ""),
          moeda(i.valorProduto).replace("R$ ", "")
        ];
        let cxp = hx;
        valores.forEach((v, idx) => {
          doc.rect(cxp, linhaProdutoY, col[idx], alturaLinha).stroke();
          doc.font(idx === 1 ? "Helvetica-Bold" : "Helvetica").fontSize(idx === 1 ? 5.8 : 5.5).text(v, cxp + 2, linhaProdutoY + 5, { width: col[idx] - 4, height: alturaLinha - 7, align: idx >= 5 ? "right" : (idx === 4 ? "center" : "left") });
          cxp += col[idx];
        });
        linhaProdutoY += alturaLinha;
      });
      doc.y = linhaProdutoY + 6;

      doc.font("Helvetica-Bold").fontSize(6).text("CALCULO DO IMPOSTO", hx, doc.y, { width: hw });
      const ty = doc.y + 8;
      const w1 = hw / 5;
      campo(doc, hx, ty, w1, 30, "BASE DE CALCULO DO ICMS", moeda(totais.valorBaseCalculo ? totais.valorBaseCalculo : 0), { tamanho: 6.5, align: "right" });
      campo(doc, hx + w1, ty, w1, 30, "VALOR DO ICMS", moeda(totais.valorIcms), { tamanho: 6.5, align: "right" });
      campo(doc, hx + w1 * 2, ty, w1, 30, "VALOR DOS PRODUTOS", moeda(totais.valorProdutos), { tamanho: 6.5, align: "right" });
      campo(doc, hx + w1 * 3, ty, w1, 30, "VALOR DO FRETE", moeda(totais.valorFrete), { tamanho: 6.5, align: "right" });
      campo(doc, hx + w1 * 4, ty, hw - w1 * 4, 30, "VALOR DO SEGURO", moeda(totais.valorSeguro), { tamanho: 6.5, align: "right" });
      const ty2 = ty + 30;
      campo(doc, hx, ty2, w1, 30, "DESCONTO", moeda(totais.valorDesconto), { tamanho: 6.5, align: "right" });
      campo(doc, hx + w1, ty2, w1, 30, "OUTRAS DESPESAS", moeda(totais.outrasDespesas), { tamanho: 6.5, align: "right" });
      campo(doc, hx + w1 * 2, ty2, w1, 30, "VALOR DO IPI", moeda(totais.valorIpi), { tamanho: 6.5, align: "right" });
      campo(doc, hx + w1 * 3, ty2, w1, 30, "PIS / COFINS", moeda(Number(totais.valorPis ? totais.valorPis : 0) + Number(totais.valorCofins ? totais.valorCofins : 0)), { tamanho: 6.5, align: "right" });
      campo(doc, hx + w1 * 4, ty2, hw - w1 * 4, 30, "VALOR TOTAL DA NF-E", moeda(totais.valorTotal), { tamanho: 7.2, negrito: true, align: "right" });
      doc.y = ty2 + 36;
      const tr = nfe.transportadora ? nfe.transportadora : {};
      const vols = Array.isArray(nfe.volumes) ? nfe.volumes : [];
      const vol = vols.length ? vols[0] : {};
      doc.font("Helvetica-Bold").fontSize(6).text("TRANSPORTADOR / VOLUMES TRANSPORTADOS", hx, doc.y, { width: hw });
      const vy = doc.y + 8;
      campo(doc, hx, vy, 245, 30, "RAZAO SOCIAL", texto(tr.razaoSocial ? tr.razaoSocial : tr.nome), { tamanho: 6.7 });
      campo(doc, hx + 245, vy, 95, 30, "FRETE POR CONTA", texto(nfe.modalidadeFrete), { tamanho: 6.5, align: "center" });
      campo(doc, hx + 340, vy, 85, 30, "CODIGO ANTT", texto(tr.codigoAntt), { tamanho: 6.5 });
      campo(doc, hx + 425, vy, 70, 30, "PLACA", texto(tr.placa), { tamanho: 6.5 });
      campo(doc, hx + 495, vy, hw - 495, 30, "UF", texto(tr.uf), { tamanho: 6.5, align: "center" });
      const vy2 = vy + 30;
      campo(doc, hx, vy2, 245, 30, "ENDERECO", texto(tr.endereco), { tamanho: 6.5 });
      campo(doc, hx + 245, vy2, 135, 30, "MUNICIPIO", texto(tr.municipio), { tamanho: 6.5 });
      campo(doc, hx + 380, vy2, 115, 30, "CNPJ / CPF", texto(tr.cnpj ? tr.cnpj : tr.cpf), { tamanho: 6.5 });
      campo(doc, hx + 495, vy2, hw - 495, 30, "IE", texto(tr.inscricaoEstadual), { tamanho: 6.5 });
      const vy3 = vy2 + 30;
      campo(doc, hx, vy3, 85, 30, "QUANTIDADE", texto(vol.quantidade), { tamanho: 6.5, align: "right" });
      campo(doc, hx + 85, vy3, 100, 30, "ESPECIE", texto(vol.especie), { tamanho: 6.5 });
      campo(doc, hx + 185, vy3, 100, 30, "MARCA", texto(vol.marca), { tamanho: 6.5 });
      campo(doc, hx + 285, vy3, 100, 30, "NUMERACAO", texto(vol.numeracao), { tamanho: 6.5 });
      campo(doc, hx + 385, vy3, 85, 30, "PESO BRUTO", texto(vol.pesoBruto), { tamanho: 6.5, align: "right" });
      campo(doc, hx + 470, vy3, hw - 470, 30, "PESO LIQUIDO", texto(vol.pesoLiquido), { tamanho: 6.5, align: "right" });
      doc.y = vy3 + 36;

      doc.font("Helvetica-Bold").fontSize(6).text("DADOS ADICIONAIS", hx, doc.y, { width: hw });
      const ay = doc.y + 8;
      const aw1 = hw * 0.72;
      const aw2 = hw - aw1;
      campo(doc, hx, ay, aw1, 72, "INFORMACOES COMPLEMENTARES", texto(nfe.informacoesComplementares), { tamanho: 6.2 });
      campo(doc, hx + aw1, ay, aw2, 72, "RESERVADO AO FISCO", "", { tamanho: 6.2 });
      doc.y = ay + 78;

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { gerarDanfeNfePdf };
