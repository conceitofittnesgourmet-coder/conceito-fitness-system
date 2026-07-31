function textoSeguro(valor, fallback = "") {
  const texto = String(valor ?? "").trim();
  return texto || fallback;
}

function numeroSeguro(valor, fallback = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : fallback;
}

function configuracoesDoItem(item = {}) {
  const configuracoes = Array.isArray(item.configuracoes)
    ? item.configuracoes
    : [];

  const grupos = new Map();

  for (const configuracao of configuracoes) {
    const grupo = textoSeguro(configuracao.grupo, "Personalização");
    const opcao = textoSeguro(configuracao.opcao);
    if (!opcao) continue;

    const quantidade = Math.max(1, numeroSeguro(configuracao.quantidade, 1));
    const valorUnitario = Math.max(0, numeroSeguro(configuracao.valorUnitario, 0));
    const valor = Math.max(
      0,
      numeroSeguro(configuracao.valor, valorUnitario * quantidade)
    );

    if (!grupos.has(grupo)) {
      grupos.set(grupo, []);
    }

    grupos.get(grupo).push({
      opcao,
      quantidade,
      valorUnitario,
      valor,
    });
  }

  return Array.from(grupos.entries()).map(([grupo, opcoes]) => ({
    grupo,
    opcoes,
    resumo: opcoes
      .map((opcao) =>
        `${opcao.quantidade > 1 ? `${opcao.quantidade}x ` : ""}${opcao.opcao}`
      )
      .join(", "),
  }));
}

function montarRoteiroItem(item = {}, indice = 0) {
  return {
    indice,
    produtoId: item.produtoId || null,
    nome: textoSeguro(item.nome, "Produto"),
    quantidade: Math.max(1, numeroSeguro(item.quantidade, 1)),
    observacao: textoSeguro(item.observacaoItem),
    adicionais: Math.max(0, numeroSeguro(item.adicionais, 0)),
    grupos: configuracoesDoItem(item),
  };
}

function montarChecklistSugerido(pedido = {}) {
  const itens = Array.isArray(pedido.produtos) ? pedido.produtos : [];
  const checklist = [
    { nome: "Conferir itens e quantidades do pedido", concluido: false },
  ];

  for (const item of itens) {
    const nome = textoSeguro(item.nome, "Produto");
    const quantidade = Math.max(1, numeroSeguro(item.quantidade, 1));
    checklist.push({
      nome: `Preparar ${quantidade}x ${nome}`,
      concluido: false,
    });
  }

  checklist.push(
    { nome: "Conferir personalizações e observações", concluido: false },
    { nome: "Separar embalagem e identificação", concluido: false },
    { nome: "Liberar pedido para entrega ou retirada", concluido: false }
  );

  return checklist;
}

function enriquecerPedido(pedido = {}) {
  const objeto = typeof pedido.toObject === "function"
    ? pedido.toObject()
    : { ...pedido };

  const produtos = Array.isArray(objeto.produtos) ? objeto.produtos : [];
  const roteiroProducao = produtos.map(montarRoteiroItem);
  const possuiPersonalizacoes = roteiroProducao.some(
    (item) => item.grupos.length > 0 || item.observacao
  );

  return {
    ...objeto,
    roteiroProducao,
    possuiPersonalizacoes,
    checklistSugerido: montarChecklistSugerido(objeto),
  };
}

module.exports = {
  configuracoesDoItem,
  montarRoteiroItem,
  montarChecklistSugerido,
  enriquecerPedido,
};
