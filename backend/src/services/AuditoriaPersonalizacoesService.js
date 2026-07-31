const Produto = require("../models/produto");
const GrupoComponente = require("../models/grupocomponente");
const OpcaoComponente = require("../models/opcaocomponente");

function id(valor) {
  if (!valor) return "";
  return String(valor._id || valor.id || valor);
}

function criarPendencia({ severidade = "atencao", codigo, produto, grupo, opcao, mensagem, acao }) {
  return {
    severidade,
    codigo,
    produtoId: id(produto),
    produto: produto?.nome || "",
    grupoId: id(grupo),
    grupo: grupo?.nome || "",
    opcaoId: id(opcao),
    opcao: opcao?.nome || "",
    mensagem,
    acao: acao || "Revisar a configuração no cadastro administrativo.",
  };
}

async function executarAuditoria() {
  const [produtos, grupos, opcoes] = await Promise.all([
    Produto.find({}).select("nome ativo preco configuravel permiteMontagemCliente gruposComponentes configuracaoGrupos").lean(),
    GrupoComponente.find({}).lean(),
    OpcaoComponente.find({}).lean(),
  ]);

  const gruposPorId = new Map(grupos.map((grupo) => [id(grupo), grupo]));
  const opcoesPorId = new Map(opcoes.map((opcao) => [id(opcao), opcao]));
  const opcoesPorGrupo = new Map();

  for (const opcao of opcoes) {
    const grupoId = id(opcao.grupo);
    if (!opcoesPorGrupo.has(grupoId)) opcoesPorGrupo.set(grupoId, []);
    opcoesPorGrupo.get(grupoId).push(opcao);
  }

  const pendencias = [];
  let produtosConfigurados = 0;
  let produtosProntos = 0;

  for (const produto of produtos) {
    const gruposIds = [...new Set((produto.gruposComponentes || []).map(id).filter(Boolean))];
    const configs = Array.isArray(produto.configuracaoGrupos) ? produto.configuracaoGrupos : [];

    if (gruposIds.length === 0) continue;
    produtosConfigurados += 1;
    const inicioPendencias = pendencias.length;

    if (produto.configuravel === false || produto.permiteMontagemCliente === false) {
      pendencias.push(criarPendencia({
        severidade: "atencao",
        codigo: "MONTAGEM_DESATIVADA",
        produto,
        mensagem: "O produto possui grupos vinculados, mas a montagem pelo cliente está desativada.",
        acao: "Ative a montagem pelo cliente ou remova os grupos do produto.",
      }));
    }

    if (Number(produto.preco || 0) <= 0) {
      pendencias.push(criarPendencia({
        severidade: "critica",
        codigo: "PRECO_INVALIDO",
        produto,
        mensagem: "O produto configurável está sem preço base válido.",
        acao: "Cadastre um preço base maior que zero.",
      }));
    }

    for (const grupoId of gruposIds) {
      const grupo = gruposPorId.get(grupoId);
      const config = configs.find((item) => id(item.grupoId) === grupoId);

      if (!grupo) {
        pendencias.push(criarPendencia({
          severidade: "critica",
          codigo: "GRUPO_INEXISTENTE",
          produto,
          mensagem: "Existe um grupo vinculado ao produto que não foi encontrado no catálogo.",
          acao: "Abra o cadastro do produto e salve novamente a configuração.",
        }));
        continue;
      }

      if (grupo.ativo === false) {
        pendencias.push(criarPendencia({
          severidade: "critica",
          codigo: "GRUPO_INATIVO",
          produto,
          grupo,
          mensagem: "O produto utiliza um grupo inativo.",
          acao: "Ative o grupo ou remova-o do produto.",
        }));
      }

      if (grupo.canais?.cardapio === false || config?.mostrarCardapio === false) {
        pendencias.push(criarPendencia({
          severidade: "informativa",
          codigo: "GRUPO_FORA_CARDAPIO",
          produto,
          grupo,
          mensagem: "Este grupo não será exibido no Cardápio Online.",
          acao: "Habilite o canal Cardápio quando a escolha precisar aparecer para o cliente.",
        }));
      }

      const minimo = Number(config?.minimoEscolhas ?? grupo.minimoEscolhas ?? 0);
      const maximo = Number(config?.maximoEscolhas ?? grupo.maximoEscolhas ?? 1);
      const obrigatorio = config?.obrigatorio ?? grupo.obrigatorio ?? false;

      if (maximo < 1 || minimo < 0 || minimo > maximo || (obrigatorio && minimo < 1)) {
        pendencias.push(criarPendencia({
          severidade: "critica",
          codigo: "LIMITES_INVALIDOS",
          produto,
          grupo,
          mensagem: `Regras inválidas: mínimo ${minimo}, máximo ${maximo}, obrigatório ${obrigatorio ? "sim" : "não"}.`,
          acao: "Ajuste mínimo, máximo e obrigatoriedade do grupo.",
        }));
      }

      if (grupo.tipoSelecao === "unica" && maximo !== 1) {
        pendencias.push(criarPendencia({
          severidade: "critica",
          codigo: "SELECAO_UNICA_MAXIMO",
          produto,
          grupo,
          mensagem: "Grupo de seleção única deve permitir no máximo uma escolha.",
          acao: "Defina o máximo de escolhas como 1.",
        }));
      }

      const permitidasIds = [...new Set((config?.opcoesPermitidas || []).map(id).filter(Boolean))];
      const padraoIds = [...new Set((config?.opcoesPadrao || []).map(id).filter(Boolean))];
      const opcoesGrupo = opcoesPorGrupo.get(grupoId) || [];
      const opcoesDisponiveis = opcoesGrupo.filter(
        (opcao) => opcao.ativo !== false && opcao.canais?.cardapio !== false
      );
      const universoPermitido = permitidasIds.length
        ? opcoesDisponiveis.filter((opcao) => permitidasIds.includes(id(opcao)))
        : opcoesDisponiveis;

      if (universoPermitido.length === 0) {
        pendencias.push(criarPendencia({
          severidade: "critica",
          codigo: "SEM_OPCOES_DISPONIVEIS",
          produto,
          grupo,
          mensagem: "O grupo não possui opções ativas e disponíveis para o Cardápio Online.",
          acao: "Cadastre ou ative ao menos uma opção neste grupo.",
        }));
      } else if (minimo > universoPermitido.length && grupo.permiteQuantidadePorOpcao !== true) {
        pendencias.push(criarPendencia({
          severidade: "critica",
          codigo: "MINIMO_MAIOR_QUE_OPCOES",
          produto,
          grupo,
          mensagem: `O mínimo é ${minimo}, mas existem somente ${universoPermitido.length} opção(ões) disponíveis.`,
          acao: "Reduza o mínimo ou disponibilize mais opções.",
        }));
      }

      for (const opcaoId of permitidasIds) {
        const opcao = opcoesPorId.get(opcaoId);
        if (!opcao || id(opcao.grupo) !== grupoId) {
          pendencias.push(criarPendencia({
            severidade: "critica",
            codigo: "OPCAO_PERMITIDA_INVALIDA",
            produto,
            grupo,
            opcao,
            mensagem: "Uma opção permitida não existe ou pertence a outro grupo.",
            acao: "Salve novamente a configuração deste produto.",
          }));
        } else if (opcao.ativo === false) {
          pendencias.push(criarPendencia({
            severidade: "atencao",
            codigo: "OPCAO_PERMITIDA_INATIVA",
            produto,
            grupo,
            opcao,
            mensagem: "Uma opção permitida está inativa.",
            acao: "Ative a opção ou remova-a da lista de permitidas.",
          }));
        }
      }

      for (const opcaoId of padraoIds) {
        const opcao = opcoesPorId.get(opcaoId);
        if (!opcao || id(opcao.grupo) !== grupoId) {
          pendencias.push(criarPendencia({
            severidade: "critica",
            codigo: "OPCAO_PADRAO_INVALIDA",
            produto,
            grupo,
            opcao,
            mensagem: "Uma opção padrão não existe ou pertence a outro grupo.",
            acao: "Remova a opção padrão inválida.",
          }));
        } else if (permitidasIds.length && !permitidasIds.includes(opcaoId)) {
          pendencias.push(criarPendencia({
            severidade: "critica",
            codigo: "PADRAO_NAO_PERMITIDO",
            produto,
            grupo,
            opcao,
            mensagem: "Uma opção padrão não está entre as opções permitidas.",
            acao: "Permita a opção ou remova-a como padrão.",
          }));
        }
      }

      if (padraoIds.length > maximo) {
        pendencias.push(criarPendencia({
          severidade: "atencao",
          codigo: "PADROES_ACIMA_MAXIMO",
          produto,
          grupo,
          mensagem: `Existem ${padraoIds.length} opções padrão para um máximo de ${maximo}.`,
          acao: "Reduza a quantidade de opções padrão.",
        }));
      }
    }

    if (pendencias.length === inicioPendencias) produtosProntos += 1;
  }

  const resumo = pendencias.reduce(
    (acc, item) => {
      acc[item.severidade] = (acc[item.severidade] || 0) + 1;
      return acc;
    },
    { critica: 0, atencao: 0, informativa: 0 }
  );

  return {
    executadoEm: new Date(),
    resumo: {
      produtosTotal: produtos.length,
      produtosConfigurados,
      produtosProntos,
      produtosComPendencias: Math.max(0, produtosConfigurados - produtosProntos),
      gruposTotal: grupos.length,
      opcoesTotal: opcoes.length,
      pendenciasTotal: pendencias.length,
      ...resumo,
    },
    pendencias,
  };
}

module.exports = { executarAuditoria };
