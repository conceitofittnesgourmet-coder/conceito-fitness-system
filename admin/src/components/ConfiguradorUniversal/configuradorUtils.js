function obterId(valor) {
  if (!valor) return "";
  if (typeof valor === "string") return valor;
  return String(valor._id || valor.id || valor);
}

function idsDaLista(lista = []) {
  return lista.map(obterId).filter(Boolean);
}

export function obterGruposDoProduto(produto, grupos = []) {
  const gruposIds = idsDaLista(produto?.gruposComponentes || []);
  const configs = produto?.configuracaoGrupos || [];

  return grupos
    .filter((grupo) => gruposIds.includes(obterId(grupo)))
    .map((grupo) => {
      const config = configs.find(
        (item) => obterId(item.grupoId) === obterId(grupo)
      );

      const minimo = Number(
        config?.minimoEscolhas ?? grupo.minimoEscolhas ?? 0
      );
      const maximo = Math.max(
        minimo,
        Number(config?.maximoEscolhas ?? grupo.maximoEscolhas ?? 1)
      );

      return {
        ...grupo,
        config,
        obrigatorio: config?.obrigatorio ?? grupo.obrigatorio,
        minimoEscolhas: minimo,
        maximoEscolhas: maximo,
        ordem: config?.ordem ?? grupo.ordem ?? 0,
        mostrarCardapio: config?.mostrarCardapio ?? true,
        mostrarPDV: config?.mostrarPDV ?? true,
        mostrarPWA: config?.mostrarPWA ?? true,
        regraPreco: config?.regraPreco ?? "sem_alteracao",
        valorPreco: Number(config?.valorPreco || 0),
        opcoesPermitidas: idsDaLista(config?.opcoesPermitidas || []),
        opcoesPadrao: idsDaLista(config?.opcoesPadrao || []),
      };
    })
    .sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0));
}

export function obterOpcoesDoGrupo(grupo, opcoes = [], canal = "cardapio") {
  const permitidas = new Set(grupo?.opcoesPermitidas || []);

  return opcoes
    .filter((opcao) => obterId(opcao.grupo) === obterId(grupo))
    .filter((opcao) => opcao.ativo !== false)
    .filter((opcao) => opcao.canais?.[canal] !== false)
    .filter((opcao) => permitidas.size === 0 || permitidas.has(obterId(opcao)))
    .map((opcao) => {
      const disponibilidade = opcao.disponibilidade || {};
      const estoqueInsuficiente =
        disponibilidade.controlarEstoque === true &&
        Number(disponibilidade.estoque || 0) <
          Number(disponibilidade.estoqueMinimo || 1);

      return {
        ...opcao,
        indisponivel:
          disponibilidade.disponivel === false || estoqueInsuficiente,
        motivoIndisponibilidade:
          disponibilidade.motivo ||
          (estoqueInsuficiente ? "Opção esgotada" : ""),
      };
    })
    .sort((a, b) =>
      Number(a.ordem || 0) - Number(b.ordem || 0) ||
      String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR")
    );
}

export function montarSelecoesPadrao(grupos = [], opcoes = []) {
  return grupos.reduce((resultado, grupo) => {
    const padrao = new Set(grupo.opcoesPadrao || []);
    if (padrao.size === 0) return resultado;

    const selecionadas = obterOpcoesDoGrupo(grupo, opcoes).filter(
      (opcao) => padrao.has(obterId(opcao)) && !opcao.indisponivel
    );

    if (selecionadas.length > 0) {
      resultado[obterId(grupo)] = selecionadas.slice(
        0,
        Number(grupo.maximoEscolhas || 1)
      );
    }

    return resultado;
  }, {});
}

export function calcularAdicionais(selecoes = {}) {
  return Object.values(selecoes)
    .flat()
    .reduce(
      (acc, opcao) =>
        acc + Number(opcao.precoAdicional || opcao.valor || 0),
      0
    );
}

export function validarGruposObrigatorios(grupos = [], selecoes = {}) {
  for (const grupo of grupos) {
    const minimo = Number(
      grupo.obrigatorio
        ? Math.max(1, grupo.minimoEscolhas || 0)
        : grupo.minimoEscolhas || 0
    );
    const maximo = Number(grupo.maximoEscolhas || 1);
    const selecionadas = selecoes[obterId(grupo)] || [];

    if (selecionadas.some((opcao) => opcao.indisponivel)) {
      return {
        valido: false,
        mensagem: `Uma opção selecionada em ${grupo.nome} não está mais disponível.`,
      };
    }

    if (selecionadas.length < minimo) {
      return {
        valido: false,
        mensagem: `Escolha pelo menos ${minimo} opção(ões) em ${grupo.nome}.`,
      };
    }

    if (selecionadas.length > maximo) {
      return {
        valido: false,
        mensagem: `Escolha no máximo ${maximo} opção(ões) em ${grupo.nome}.`,
      };
    }
  }

  return { valido: true, mensagem: "" };
}
