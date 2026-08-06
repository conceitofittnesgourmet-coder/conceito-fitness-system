const Grupo = require("../models/grupocomponente");
const Opcao = require("../models/opcaocomponente");
const Produto = require("../models/produto");

function gerarSlug(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

function normalizarBooleano(valor, padrao = false) {
  if (typeof valor === "boolean") return valor;
  if (valor === "true" || valor === 1 || valor === "1") return true;
  if (valor === "false" || valor === 0 || valor === "0") return false;
  return padrao;
}

function normalizarDados(body = {}) {
  const tipoSelecao = body.tipoSelecao === "multipla" ? "multipla" : "unica";
  let minimoEscolhas = Math.max(0, Number(body.minimoEscolhas || 0));
  let maximoEscolhas = Math.max(1, Number(body.maximoEscolhas || 1));
  const obrigatorio = normalizarBooleano(body.obrigatorio, false);

  if (tipoSelecao === "unica") {
    maximoEscolhas = 1;
    minimoEscolhas = obrigatorio ? 1 : Math.min(minimoEscolhas, 1);
  }

  if (obrigatorio && minimoEscolhas < 1) minimoEscolhas = 1;
  if (minimoEscolhas > maximoEscolhas) minimoEscolhas = maximoEscolhas;

  return {
    nome: String(body.nome || "").trim(),
    slug: gerarSlug(body.nome),
    descricao: String(body.descricao || "").trim(),
    textoAjuda: String(body.textoAjuda || "").trim(),
    tipo: body.tipo || "personalizado",
    tipoSelecao,
    visualizacao: ["lista", "cards", "seletor"].includes(body.visualizacao)
      ? body.visualizacao
      : "lista",
    obrigatorio,
    minimoEscolhas,
    maximoEscolhas,
    permiteQuantidadePorOpcao: normalizarBooleano(
      body.permiteQuantidadePorOpcao,
      false
    ),
    quantidadeMaximaPorOpcao: Math.max(
      1,
      Number(body.quantidadeMaximaPorOpcao || 1)
    ),
    ordem: Number(body.ordem || 0),
    canais: {
      pdv: normalizarBooleano(body.canais?.pdv, true),
      cardapio: normalizarBooleano(body.canais?.cardapio, true),
      pwa: normalizarBooleano(body.canais?.pwa, true),
      ifood: normalizarBooleano(body.canais?.ifood, false),
    },
    ativo: normalizarBooleano(body.ativo, true),
  };
}

async function anexarContadores(grupos) {
  const ids = grupos.map((grupo) => grupo._id);

  const [opcoes, produtos] = await Promise.all([
    Opcao.aggregate([
      { $match: { grupo: { $in: ids } } },
      {
        $group: {
          _id: "$grupo",
          total: { $sum: 1 },
          ativas: { $sum: { $cond: ["$ativo", 1, 0] } },
        },
      },
    ]),
    Produto.aggregate([
      {
        $match: {
          $or: [
            { gruposComponentes: { $in: ids } },
            { "configuracaoGrupos.grupoId": { $in: ids } },
          ],
        },
      },
      {
        $project: {
          grupos: {
            $setUnion: [
              { $ifNull: ["$gruposComponentes", []] },
              {
                $map: {
                  input: { $ifNull: ["$configuracaoGrupos", []] },
                  as: "configuracao",
                  in: "$$configuracao.grupoId",
                },
              },
            ],
          },
        },
      },
      { $unwind: "$grupos" },
      { $match: { grupos: { $in: ids } } },
      { $group: { _id: "$grupos", total: { $sum: 1 } } },
    ]),
  ]);

  const mapaOpcoes = new Map(opcoes.map((item) => [String(item._id), item]));
  const mapaProdutos = new Map(produtos.map((item) => [String(item._id), item]));

  return grupos.map((grupo) => {
    const objeto = grupo.toObject ? grupo.toObject() : grupo;
    const contadorOpcoes = mapaOpcoes.get(String(grupo._id));
    const contadorProdutos = mapaProdutos.get(String(grupo._id));

    return {
      ...objeto,
      contadores: {
        opcoes: contadorOpcoes?.total || 0,
        opcoesAtivas: contadorOpcoes?.ativas || 0,
        produtos: contadorProdutos?.total || 0,
      },
    };
  });
}

function tratarErro(res, erro, contexto) {
  console.error("\n========================================");
  console.error("ERRO:", contexto);
  console.error("========================================");

  console.error(erro);

  if (erro.stack) {
    console.error(erro.stack);
  }

  if (erro.errors) {
    console.error("Validation Errors:");
    console.error(erro.errors);
  }

  return res.status(500).json({
    success: false,
    message: erro.message,
  });
}

exports.listar = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.ativo === "true") filtro.ativo = true;
    if (req.query.ativo === "false") filtro.ativo = false;
    if (req.query.tipo) filtro.tipo = req.query.tipo;

    const grupos = await Grupo.find(filtro).sort({ ordem: 1, nome: 1 });

    res.json({
      success: true,
      grupos: await anexarContadores(grupos),
    });
  } catch (err) {
    return tratarErro(res, err, "LISTAR GRUPOS");
}
};

exports.buscar = async (req, res) => {
  try {
    const grupo = await Grupo.findById(req.params.id);

    if (!grupo) {
      return res.status(404).json({
        success: false,
        message: "Grupo não encontrado.",
      });
    }

    const [grupoComContador] = await anexarContadores([grupo]);
    res.json({ success: true, grupo: grupoComContador });
  } catch (err) {
    return tratarErro(res, err, "LISTAR GRUPOS");
}
};

exports.criar = async (req, res) => {
  try {
    const dados = normalizarDados(req.body);

    if (!dados.nome) {
      return res.status(400).json({ success: false, message: "Informe o nome do grupo." });
    }

    const existe = await Grupo.findOne({ slug: dados.slug });
    if (existe) {
      return res.status(409).json({
        success: false,
        message: "Já existe um grupo com este nome.",
      });
    }

    const grupo = await Grupo.create(dados);
    res.status(201).json({ success: true, grupo });
  } catch (err) {
    return tratarErro(res, err, "CRIAR GRUPO");
}
};

exports.atualizar = async (req, res) => {
  try {
    const atual = await Grupo.findById(req.params.id);
    if (!atual) {
      return res.status(404).json({ success: false, message: "Grupo não encontrado." });
    }

    const dados = normalizarDados({ ...atual.toObject(), ...req.body });
    const duplicado = await Grupo.findOne({
      slug: dados.slug,
      _id: { $ne: atual._id },
    });

    if (duplicado) {
      return res.status(409).json({
        success: false,
        message: "Já existe outro grupo com este nome.",
      });
    }

    Object.assign(atual, dados);
    await atual.save();

    res.json({ success: true, grupo: atual });
  } catch (err) {
    return tratarErro(res, err, "ATUALIZAR GRUPO");
  }
};

exports.duplicar = async (req, res) => {
  try {
    const original = await Grupo.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: "Grupo não encontrado." });
    }

    let nome = `${original.nome} - Cópia`;
    let slug = gerarSlug(nome);
    let indice = 2;

    while (await Grupo.exists({ slug })) {
      nome = `${original.nome} - Cópia ${indice}`;
      slug = gerarSlug(nome);
      indice += 1;
    }

    const dados = original.toObject();
    delete dados._id;
    delete dados.createdAt;
    delete dados.updatedAt;
    delete dados.__v;

    const grupo = await Grupo.create({ ...dados, nome, slug, ativo: false });
    res.status(201).json({ success: true, grupo });
  } catch (err) {
    return tratarErro(res, err, "DUPLICAR GRUPO");
}
};

exports.reordenar = async (req, res) => {
  try {
    const itens = Array.isArray(req.body.itens) ? req.body.itens : [];
    if (!itens.length) {
      return res.status(400).json({ success: false, message: "Informe os grupos para reordenar." });
    }

    await Grupo.bulkWrite(
      itens.map((item, indice) => ({
        updateOne: {
          filter: { _id: item.id || item._id },
          update: { $set: { ordem: Number(item.ordem ?? indice) } },
        },
      }))
    );

    res.json({ success: true });
  } catch (err) {
    return tratarErro(res, err, "REORDENAR GRUPOS");
}
};

exports.excluir = async (req, res) => {
  try {
    const grupo = await Grupo.findById(req.params.id);
    if (!grupo) {
      return res.status(404).json({ success: false, message: "Grupo não encontrado." });
    }

    const [opcoes, produtos] = await Promise.all([
      Opcao.countDocuments({ grupo: grupo._id }),
      Produto.countDocuments({
        $or: [
          { gruposComponentes: grupo._id },
          { "configuracaoGrupos.grupoId": grupo._id },
        ],
      }),
    ]);

    if (opcoes > 0 || produtos > 0) {
      return res.status(409).json({
        success: false,
        message:
          `Este grupo está em uso por ${opcoes} opção(ões) e ${produtos} produto(s). ` +
          "Desative-o ou remova primeiro os vínculos.",
      });
    }

    await grupo.deleteOne();
    res.json({ success: true });
  } catch (err) {
    return tratarErro(res, err, "EXCLUIR GRUPO");
  }
};
