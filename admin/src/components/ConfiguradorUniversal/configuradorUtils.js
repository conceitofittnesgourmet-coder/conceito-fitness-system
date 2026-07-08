export function obterGruposDoProduto(produto, grupos = []) {
  const gruposIds = (produto?.gruposComponentes || []).map((g) =>
    typeof g === "string" ? g : g._id
  );

  const configs = produto?.configuracaoGrupos || [];

  return grupos
    .filter((grupo) => gruposIds.includes(grupo._id))
    .map((grupo) => {
      const config = configs.find(
        (c) => String(c.grupoId) === String(grupo._id)
      );

      return {
        ...grupo,
        config,
        obrigatorio: config?.obrigatorio ?? grupo.obrigatorio,
        minimoEscolhas: config?.minimoEscolhas ?? grupo.minimoEscolhas ?? 0,
        maximoEscolhas: config?.maximoEscolhas ?? grupo.maximoEscolhas ?? 1,
        ordem: config?.ordem ?? grupo.ordem ?? 0,
        mostrarCardapio: config?.mostrarCardapio ?? true,
        mostrarPDV: config?.mostrarPDV ?? true,
        regraPreco: config?.regraPreco ?? "sem_alteracao",
        valorPreco: config?.valorPreco ?? 0,
      };
    })
    .sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0));
}

export function calcularAdicionais(selecoes = {}) {
  return Object.values(selecoes)
    .flat()
    .reduce((acc, opcao) => acc + Number(opcao.precoAdicional || opcao.valor || 0), 0);
}

export function validarGruposObrigatorios(grupos = [], selecoes = {}) {
  for (const grupo of grupos) {
    const minimo = Number(grupo.minimoEscolhas || 0);
    const selecionadas = selecoes[grupo._id] || [];

    if (grupo.obrigatorio && selecionadas.length < minimo) {
      return {
        valido: false,
        mensagem: `Escolha pelo menos ${minimo} opção(ões) em ${grupo.nome}.`,
      };
    }
  }

  return {
    valido: true,
    mensagem: "",
  };
}