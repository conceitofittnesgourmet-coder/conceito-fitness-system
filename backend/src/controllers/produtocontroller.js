const cloudinary = require("../config/cloudinary");
const fs = require("fs-extra");
const Produto = require("../models/produto");
const ProdutoService = require("../services/ProdutoService");

async function uploadImagens(files = []) {
  const imagens = [];
  for (const file of files) {
    try {
      const resultado = await cloudinary.uploader.upload(file.path, {
        folder: "conceito-fitness/produtos",
      });
      imagens.push({
        url: resultado.secure_url,
        public_id: resultado.public_id,
        filename: file.filename,
      });
    } finally {
      if (file.path) await fs.remove(file.path).catch(() => {});
    }
  }
  return imagens;
}

async function removerImagensCloudinary(imagens = []) {
  for (const imagem of imagens) {
    if (!imagem?.public_id) continue;
    try {
      await cloudinary.uploader.destroy(imagem.public_id);
    } catch (error) {
      console.error("Erro ao remover imagem do Cloudinary:", error.message);
    }
  }
}

function responderErro(res, error, contexto) {
  console.error(contexto, error);
  const status = error?.name === "ValidationError" ? 400 : 500;
  return res.status(status).json({
    success: false,
    message: error.message || "Erro interno do servidor",
  });
}

const criarProduto = async (req, res) => {
  try {
    const { nome, preco, estoque } = req.body || {};
    if (!nome || preco === undefined || preco === null || preco === "" || estoque === undefined || estoque === null || estoque === "") {
      return res.status(400).json({
        success: false,
        message: "Nome, preço e estoque são obrigatórios",
      });
    }

    const imagens = await uploadImagens(req.files || []);
    const produto = await ProdutoService.criarProduto(req.body, imagens);

    if (global.io) global.io.emit("produto-criado", produto);
    return res.status(201).json({
      success: true,
      message: "Produto criado com sucesso",
      produto,
    });
  } catch (error) {
    return responderErro(res, error, "ERRO CRIAR PRODUTO:");
  }
};

const listarProdutos = async (req, res) => {
  try {
    const { search, destaque, ativo, page = 1, limit = 9999 } = req.query;
    const filtro = {};
    if (search) filtro.nome = { $regex: search, $options: "i" };
    if (destaque !== undefined) {
      const valor = destaque === "true";
      filtro.$or = [
        { destaque: valor },
        { "publicacao.destaque": valor },
        { "publicacao.destaques.destaque": valor },
      ];
    }
    if (ativo !== undefined) filtro.ativo = ativo === "true";

    const pagina = Math.max(1, Number(page) || 1);
    const limite = Math.min(10000, Math.max(1, Number(limit) || 9999));
    const [produtos, total] = await Promise.all([
      Produto.find(filtro).sort({ createdAt: -1 }).skip((pagina - 1) * limite).limit(limite),
      Produto.countDocuments(filtro),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pagina,
      pages: Math.ceil(total / limite),
      produtos: produtos.map(ProdutoService.formatarProdutoPublico),
    });
  } catch (error) {
    return responderErro(res, error, "ERRO LISTAR PRODUTOS:");
  }
};

const listarProdutosCardapio = async (req, res) => {
  try {
    const { search, categoria, destaque, novidade, promocao, exclusivoClube } = req.query;
    const condicoes = [
      { ativo: true },
      {
        $or: [
          { "publicacao.canais.cardapio": { $ne: false } },
          { "publicacao.cardapioOnline": { $ne: false } },
        ],
      },
    ];

    if (search) {
      condicoes.push({
        $or: [
          { nome: { $regex: search, $options: "i" } },
          { descricao: { $regex: search, $options: "i" } },
        ],
      });
    }
    if (categoria) {
      const regex = { $regex: `^${categoria.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" };
      condicoes.push({ $or: [{ categoria: regex }, { categorias: { $elemMatch: regex } }] });
    }
    if (destaque === "true") {
      condicoes.push({
        $or: [
          { "publicacao.destaques.destaque": true },
          { "publicacao.destaque": true },
          { destaque: true },
        ],
      });
    }
    if (novidade === "true") {
      condicoes.push({
        $or: [
          { "publicacao.destaques.novidade": true },
          { "publicacao.novidade": true },
        ],
      });
    }
    if (promocao === "true") {
      condicoes.push({
        $or: [
          { "publicacao.promocaoDetalhada.ativa": true },
          { "publicacao.promocao": true },
        ],
      });
    }
    if (exclusivoClube === "true") {
      condicoes.push({
        $or: [
          { "publicacao.destaques.exclusivoClube": true },
          { "publicacao.exclusivoClube": true },
        ],
      });
    }

    const produtos = await Produto.find({ $and: condicoes }).sort({
      "publicacao.prioridadeExibicao": 1,
      "publicacao.ordem": 1,
      destaque: -1,
      createdAt: -1,
    });

    const produtosFormatados = produtos
      .map(ProdutoService.formatarProdutoPublico)
      .filter((produto) => !(
        produto.disponivel === false &&
        produto.disponibilidade?.ocultarQuandoIndisponivel === true
      ));

    const categoriasMap = new Map();
    for (const produto of produtosFormatados) {
      for (const nome of [produto.categoria, ...(produto.categorias || [])].filter(Boolean)) {
        const chave = String(nome).trim().toLowerCase();
        if (!categoriasMap.has(chave)) categoriasMap.set(chave, String(nome).trim());
      }
    }

    return res.status(200).json({
      success: true,
      total: produtosFormatados.length,
      categorias: Array.from(categoriasMap.values()).sort((a, b) => a.localeCompare(b, "pt-BR")),
      produtos: produtosFormatados,
    });
  } catch (error) {
    return responderErro(res, error, "ERRO LISTAR CARDÁPIO:");
  }
};

const buscarProduto = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ success: false, message: "Produto não encontrado" });
    return res.status(200).json({ success: true, produto });
  } catch (error) {
    return responderErro(res, error, "ERRO BUSCAR PRODUTO:");
  }
};

const atualizarProduto = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ success: false, message: "Produto não encontrado" });

    let novasImagens;
    const imagensAntigas = produto.imagens || [];
    if (req.files?.length) novasImagens = await uploadImagens(req.files);

    const produtoAtualizado = await ProdutoService.atualizarProduto(
      produto,
      req.body || {},
      novasImagens
    );

    if (novasImagens) await removerImagensCloudinary(imagensAntigas);
    if (global.io) global.io.emit("produto-atualizado", produtoAtualizado);

    return res.status(200).json({
      success: true,
      message: "Produto atualizado com sucesso",
      produto: produtoAtualizado,
    });
  } catch (error) {
    return responderErro(res, error, "ERRO ATUALIZAR PRODUTO:");
  }
};

const atualizarPublicacaoProduto = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ success: false, message: "Produto não encontrado" });

    const body = { ...req.body };
    if (body.canal && body.publicado !== undefined) {
      const mapaCanais = {
        pdv: "pdv",
        cardapioOnline: "cardapio",
        cardapio: "cardapio",
        whatsapp: "whatsapp",
        ifood: "ifood",
        aiqfome: "aiqfome",
        site: "site",
      };
      const canal = mapaCanais[body.canal];
      if (canal) {
        const atual = produto.publicacao?.toObject?.() || produto.publicacao || {};
        body.publicacao = {
          ...atual,
          canais: {
            ...(atual.canais || {}),
            [canal]: ProdutoService.parseBoolean(body.publicado),
          },
        };
      }
    }

    const publicacaoRecebida = ProdutoService.parseJsonSeguro(body.publicacao, {});
    for (const campo of ["destaque", "novidade", "maisVendido", "exclusivoClube"]) {
      if (body[campo] !== undefined) {
        publicacaoRecebida[campo] = ProdutoService.parseBoolean(body[campo]);
        publicacaoRecebida.destaques = {
          ...(publicacaoRecebida.destaques || {}),
          [campo]: ProdutoService.parseBoolean(body[campo]),
        };
      }
    }
    if (body.promocao !== undefined) {
      publicacaoRecebida.promocao = ProdutoService.parseBoolean(body.promocao);
      publicacaoRecebida.promocaoDetalhada = {
        ...(publicacaoRecebida.promocaoDetalhada || {}),
        ativa: ProdutoService.parseBoolean(body.promocao),
      };
    }
    if (body.ordem !== undefined) {
      publicacaoRecebida.ordem = ProdutoService.parseNumero(body.ordem, 0);
      publicacaoRecebida.prioridadeExibicao = ProdutoService.parseNumero(body.ordem, 0);
    }

    const disponibilidadeRecebida = ProdutoService.parseJsonSeguro(body.disponibilidade, {});
    if (body.disponivel !== undefined) disponibilidadeRecebida.disponivel = ProdutoService.parseBoolean(body.disponivel);
    if (body.motivoIndisponibilidade !== undefined) disponibilidadeRecebida.motivoIndisponibilidade = body.motivoIndisponibilidade || "";
    if (body.pausadoAte !== undefined) disponibilidadeRecebida.pausadoAte = body.pausadoAte || null;

    const dados = {
      publicacao: publicacaoRecebida,
      disponibilidade: disponibilidadeRecebida,
    };
    if (body.ativo !== undefined) dados.ativo = body.ativo;

    const produtoAtualizado = await ProdutoService.atualizarProduto(produto, dados);
    if (global.io) global.io.emit("produto-publicacao-atualizada", produtoAtualizado);

    return res.status(200).json({
      success: true,
      message: "Publicação do produto atualizada",
      produto: produtoAtualizado,
    });
  } catch (error) {
    return responderErro(res, error, "ERRO ATUALIZAR PUBLICAÇÃO:");
  }
};

const deletarProduto = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ success: false, message: "Produto não encontrado" });

    await removerImagensCloudinary(produto.imagens || []);
    await produto.deleteOne();
    if (global.io) global.io.emit("produto-deletado", req.params.id);

    return res.status(200).json({ success: true, message: "Produto deletado com sucesso" });
  } catch (error) {
    return responderErro(res, error, "ERRO DELETAR PRODUTO:");
  }
};

module.exports = {
  criarProduto,
  listarProdutos,
  listarProdutosCardapio,
  buscarProduto,
  atualizarProduto,
  atualizarPublicacaoProduto,
  deletarProduto,
};
