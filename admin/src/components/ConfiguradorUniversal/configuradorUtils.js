function obterId(valor) {
  if (!valor) return "";
  if (typeof valor === "string") return valor;
  return String(valor._id || valor.id || valor);
}

function idsDaLista(lista = []) {
  return lista.map(obterId).filter(Boolean);
}

function quantidadeOpcao(opcao) {
  return Math.max(1, Number(opcao?.quantidade || 1));
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

      const minimo = Number(config?.minimoEscolhas ?? grupo.minimoEscolhas ?? 0);
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
        quantidade: quantidadeOpcao(opcao),
        indisponivel:
          disponibilidade.disponivel === false || estoqueInsuficiente,
        motivoIndisponibilidade:
          disponibilidade.motivo ||
          (estoqueInsuficiente ? "Opção esgotada" : ""),
      };
    })
    .sort(
      (a, b) =>
        Number(a.ordem || 0) - Number(b.ordem || 0) ||
        String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR")
    );
}

export function montarSelecoesPadrao(grupos = [], opcoes = []) {
  return grupos.reduce((resultado, grupo) => {
    const padrao = new Set(grupo.opcoesPadrao || []);
    if (padrao.size === 0) return resultado;

    const selecionadas = obterOpcoesDoGrupo(grupo, opcoes)
      .filter((opcao) => padrao.has(obterId(opcao)) && !opcao.indisponivel)
      .map((opcao) => ({ ...opcao, quantidade: 1 }));

    if (selecionadas.length > 0) {
      resultado[obterId(grupo)] = selecionadas.slice(
        0,
        Number(grupo.maximoEscolhas || 1)
      );
    }

    return resultado;
  }, {});
}

export function clonarSelecoes(selecoes = {}) {
  return Object.entries(selecoes || {}).reduce((resultado, [grupoId, lista]) => {
    resultado[grupoId] = (lista || []).map((opcao) => ({
      ...opcao,
      quantidade: quantidadeOpcao(opcao),
    }));
    return resultado;
  }, {});
}

export function calcularAdicionais(selecoes = {}) {
  return Object.values(selecoes)
    .flat()
    .reduce(
      (acc, opcao) =>
        acc +
        Number(opcao.precoAdicional || opcao.valor || 0) *
          quantidadeOpcao(opcao),
      0
    );
}

export function totalEscolhasDoGrupo(grupo, selecionadas = []) {
  if (grupo?.permiteQuantidadePorOpcao) {
    return selecionadas.reduce(
      (total, opcao) => total + quantidadeOpcao(opcao),
      0
    );
  }
  return selecionadas.length;
}

export function montarConfiguracoesPersistencia(grupos = [], selecoes = {}) {
  return grupos.flatMap((grupo) => {
    const grupoId = obterId(grupo);
    return (selecoes[grupoId] || []).map((opcao) => {
      const quantidade = quantidadeOpcao(opcao);
      const valorUnitario = Number(
        opcao.precoAdicional ?? opcao.valor ?? 0
      );

      return {
        grupoId,
        grupo: grupo.nome || "Personalização",
        grupoTipo: grupo.tipo || "personalizado",
        opcaoId: obterId(opcao),
        opcao: opcao.nome || "Opção",
        quantidade,
        valorUnitario,
        valor: valorUnitario * quantidade,
      };
    });
  });
}

export function montarResumoConfiguracoes(grupos = [], selecoes = {}) {
  return grupos
    .map((grupo) => {
      const escolhidas = selecoes[obterId(grupo)] || [];
      if (!escolhidas.length) return null;

      const texto = escolhidas
        .map((opcao) => {
          const quantidade = quantidadeOpcao(opcao);
          return `${quantidade > 1 ? `${quantidade}x ` : ""}${opcao.nome}`;
        })
        .join(", ");

      return {
        grupoId: obterId(grupo),
        grupo: grupo.nome,
        texto,
      };
    })
    .filter(Boolean);
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
    const totalEscolhas = totalEscolhasDoGrupo(grupo, selecionadas);

    if (selecionadas.some((opcao) => opcao.indisponivel)) {
      return {
        valido: false,
        mensagem: `Uma opção selecionada em ${grupo.nome} não está mais disponível.`,
      };
    }

    if (selecionadas.some((opcao) => quantidadeOpcao(opcao) < 1)) {
      return {
        valido: false,
        mensagem: `Existe uma quantidade inválida em ${grupo.nome}.`,
      };
    }

    if (
      grupo.permiteQuantidadePorOpcao &&
      selecionadas.some(
        (opcao) =>
          quantidadeOpcao(opcao) >
          Number(grupo.quantidadeMaximaPorOpcao || 1)
      )
    ) {
      return {
        valido: false,
        mensagem: `A quantidade máxima por opção em ${grupo.nome} é ${Number(
          grupo.quantidadeMaximaPorOpcao || 1
        )}.`,
      };
    }

    if (totalEscolhas < minimo) {
      return {
        valido: false,
        mensagem: `Escolha pelo menos ${minimo} item(ns) em ${grupo.nome}.`,
      };
    }

    if (totalEscolhas > maximo) {
      return {
        valido: false,
        mensagem: `Escolha no máximo ${maximo} item(ns) em ${grupo.nome}.`,
      };
    }
  }

  return { valido: true, mensagem: "" };
}
