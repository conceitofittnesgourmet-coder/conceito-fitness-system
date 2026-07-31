export function numeroSeguro(valor, fallback = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : fallback;
}

export function formatarMoeda(valor) {
  return numeroSeguro(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function configuracoesAgrupadas(item = {}) {
  const configuracoes = Array.isArray(item.configuracoes)
    ? item.configuracoes
    : [];
  const grupos = new Map();

  configuracoes.forEach((configuracao) => {
    const grupo = String(configuracao.grupo || "Personalização").trim();
    const opcao = String(configuracao.opcao || "").trim();
    if (!opcao) return;

    if (!grupos.has(grupo)) grupos.set(grupo, []);
    grupos.get(grupo).push({
      ...configuracao,
      opcao,
      quantidade: Math.max(1, numeroSeguro(configuracao.quantidade, 1)),
      valor: Math.max(0, numeroSeguro(configuracao.valor, 0)),
    });
  });

  return Array.from(grupos.entries()).map(([grupo, opcoes]) => ({
    grupo,
    opcoes,
  }));
}

export function resumoOpcao(opcao = {}) {
  const quantidade = Math.max(1, numeroSeguro(opcao.quantidade, 1));
  return `${quantidade > 1 ? `${quantidade}x ` : ""}${opcao.opcao || "Opção"}`;
}

export function possuiPersonalizacao(item = {}) {
  return configuracoesAgrupadas(item).length > 0 || Boolean(String(item.observacaoItem || "").trim());
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function blocoItemHtml(item = {}) {
  const grupos = configuracoesAgrupadas(item);
  const observacao = String(item.observacaoItem || "").trim();
  const quantidade = Math.max(1, numeroSeguro(item.quantidade, 1));

  return `
    <section class="item">
      <div class="item-titulo">
        <strong>${quantidade}x ${escaparHtml(item.nome || "Produto")}</strong>
      </div>
      ${grupos
        .map(
          ({ grupo, opcoes }) => `
            <div class="grupo">
              <b>${escaparHtml(grupo)}:</b>
              ${opcoes.map((opcao) => escaparHtml(resumoOpcao(opcao))).join(", ")}
            </div>
          `
        )
        .join("")}
      ${observacao ? `<div class="observacao"><b>OBS:</b> ${escaparHtml(observacao)}</div>` : ""}
    </section>
  `;
}

export function htmlComandaPedido(pedido = {}, { titulo = "COMANDA DE PRODUÇÃO" } = {}) {
  const produtos = Array.isArray(pedido.produtos) ? pedido.produtos : [];
  const numero = pedido.numeroPedido || pedido.numero || pedido._id?.slice(-6)?.toUpperCase() || "------";
  const cliente = typeof pedido.cliente === "string" ? pedido.cliente : pedido.cliente?.nome || "Cliente";
  const observacao = String(pedido.observacao || "").trim();
  const data = new Date(pedido.createdAt || Date.now());

  return `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <title>${escaparHtml(titulo)} #${escaparHtml(numero)}</title>
      <style>
        @page { size: 80mm auto; margin: 4mm; }
        * { box-sizing: border-box; }
        body { width: 72mm; margin: 0 auto; font-family: Arial, sans-serif; color: #111; font-size: 12px; }
        h1 { margin: 0; text-align: center; font-size: 17px; }
        .marca { text-align: center; font-weight: 800; margin-bottom: 4px; }
        .linha { border-top: 1px dashed #111; margin: 9px 0; }
        .meta { display: grid; gap: 3px; }
        .item { padding: 7px 0; border-bottom: 1px dashed #777; }
        .item-titulo { font-size: 14px; margin-bottom: 5px; }
        .grupo { margin: 3px 0 3px 8px; line-height: 1.35; }
        .observacao { margin-top: 6px; padding: 6px; border: 2px solid #111; font-weight: 700; }
        .pedido-obs { margin-top: 9px; padding: 7px; border: 2px solid #111; }
        .rodape { margin-top: 12px; text-align: center; font-size: 10px; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <div class="marca">CONCEITO FITNESS GOURMET</div>
      <h1>${escaparHtml(titulo)}</h1>
      <div class="linha"></div>
      <div class="meta">
        <div><b>Pedido:</b> #${escaparHtml(numero)}</div>
        <div><b>Cliente:</b> ${escaparHtml(cliente)}</div>
        <div><b>Telefone:</b> ${escaparHtml(pedido.telefone || "-")}</div>
        <div><b>Horário:</b> ${escaparHtml(data.toLocaleString("pt-BR"))}</div>
        ${pedido.mesa ? `<div><b>Mesa:</b> ${escaparHtml(pedido.mesa)}</div>` : ""}
        ${pedido.tipoAtendimento ? `<div><b>Atendimento:</b> ${escaparHtml(pedido.tipoAtendimento)}</div>` : ""}
      </div>
      <div class="linha"></div>
      ${produtos.map(blocoItemHtml).join("") || "<p>Nenhum item informado.</p>"}
      ${observacao ? `<div class="pedido-obs"><b>OBSERVAÇÃO DO PEDIDO:</b><br/>${escaparHtml(observacao)}</div>` : ""}
      <div class="rodape">Confira todas as personalizações antes de liberar.</div>
    </body>
  </html>`;
}

export function imprimirComandaPedido(pedido, opcoes = {}) {
  const janela = window.open("", "_blank", "width=420,height=720");
  if (!janela) {
    throw new Error("O navegador bloqueou a janela de impressão.");
  }

  janela.document.open();
  janela.document.write(htmlComandaPedido(pedido, opcoes));
  janela.document.close();
  janela.focus();
  window.setTimeout(() => janela.print(), 250);
}
