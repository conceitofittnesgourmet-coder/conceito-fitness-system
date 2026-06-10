const cloudinary = require("../config/cloudinary");
const fs = require("fs-extra");
const generateSlug = require("../utils/generateslug");
const Produto = require("../models/produto");

async function uploadImagens(files = []) {
  const imagens = [];

  for (const file of files) {
    try {
      const resultado = await cloudinary.uploader.upload(
        file.path,
        {
          folder: "conceito-fitness/produtos",
        }
      );

      imagens.push({
        url: resultado.secure_url,
        public_id: resultado.public_id,
        filename: file.filename,
      });

      await fs.remove(file.path);
    } catch (error) {
      console.log(
        "ERRO CLOUDINARY:",
        error.message
      );
    }
  }

  return imagens;
}

// CRIAR PRODUTO
const criarProduto = async (req, res) => {
    console.log("================================");
console.log("BODY PRODUTO:");
console.log(req.body);
console.log("CUSTO RECEBIDO:", req.body.custo);
console.log("================================");
console.log("FILES:", req.files);
  try {
    const {
  nome,
  preco,
  estoque,
  descricao,
  categoria,
  tempoPreparo,
  restricoes,
  peso,
  destaque
} = req.body || {};

    if (!nome || !preco || !estoque) {
      return res.status(400).json({
        success: false,
        message: "Nome, preço e estoque são obrigatórios",
      });
    }

    const imagens = await uploadImagens(req.files || []);

    const precoVenda = Number(
  String(preco).replace(",", ".")
);

const custoProduto = Number(
  String(req.body.custo || 0).replace(",", ".")
);

const lucro = precoVenda - custoProduto;

const margem =
  precoVenda > 0
    ? Number(
        ((lucro / precoVenda) * 100).toFixed(2)
      )
    : 0;

    console.log("BODY PRODUTO:");
console.log(req.body);

const produto = await Produto.create({
  ...req.body,
  nome,
  descricao: descricao || "",
  categoria: categoria || "Gourmet",
  preco: precoVenda,
  custo: custoProduto,
  lucro,
  margem,
  tipoProduto: req.body.tipoProduto || "producao",
  estoque: Number(estoque),
  tempoPreparo: Number(tempoPreparo || 0),
  restricoes: restricoes || "",
  peso: peso || "",
  destaque: destaque === "true" || destaque === true,
  slug: generateSlug(nome),
  imagens,
});

    if (global.io) {
      global.io.emit("produto-criado", produto);
    }

    return res.status(201).json({
      success: true,
      message: "Produto criado com sucesso",
      produto,
    });
  } catch (error) {
    console.log("ERRO CRIAR PRODUTO:", error);

    
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// LISTAR PRODUTOS
const listarProdutos = async (req, res) => {
  try {
    const { search, destaque, ativo, page = 1, limit = 50 } = req.query;

    const filtro = {};

    if (search) {
      filtro.nome = {
        $regex: search,
        $options: "i",
      };
    }

    if (destaque !== undefined) {
      filtro.destaque = destaque === "true";
    }

    if (ativo !== undefined) {
      filtro.ativo = ativo === "true";
    }

    const skip = (Number(page) - 1) * Number(limit);

    const produtos = await Produto.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

      const produtosFormatados = produtos.map((produto) => {
  const produtoObj = produto.toObject();

  return {
    ...produtoObj,

    imagem:
      produtoObj.imagem ||
      produtoObj.foto ||
      produtoObj.image ||
      (produtoObj.imagens &&
      produtoObj.imagens.length > 0
        ? produtoObj.imagens[0].url || produtoObj.imagens[0]
        : ""),

    estoque: Number(produtoObj.estoque || 0),

    preco: Number(produtoObj.preco || 0),

    destaque: Boolean(produtoObj.destaque),
  };
});

    const total = await Produto.countDocuments(filtro);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      produtos: produtosFormatados,
    });
  } catch (error) {
    console.log("ERRO LISTAR PRODUTOS:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// BUSCAR PRODUTO
const buscarProduto = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);

    if (!produto) {
      return res.status(404).json({
        success: false,
        message: "Produto não encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      produto,
    });
  } catch (error) {
    console.log("ERRO BUSCAR PRODUTO:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ATUALIZAR PRODUTO
const atualizarProduto = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);

    if (!produto) {
      return res.status(404).json({
        success: false,
        message: "Produto não encontrado",
      });
    }

    let imagens = produto.imagens || [];

    if (req.files && req.files.length > 0) {
      if (produto.imagens?.length > 0) {
        for (const imagem of produto.imagens) {
          if (imagem.public_id) {
            await cloudinary.uploader.destroy(imagem.public_id);
          }
        }
      }

      imagens = await uploadImagens(req.files);
    }

    const dadosAtualizados = {
      ...req.body,
      imagens,
    };

    if (req.body?.nome) {
      dadosAtualizados.slug = generateSlug(req.body.nome);
    }

    if (
  req.body?.preco !== undefined &&
  req.body?.preco !== null &&
  String(req.body.preco).trim() !== ""
) {
  const precoConvertido = Number(
    String(req.body.preco).replace(",", ".")
  );

  if (!Number.isNaN(precoConvertido)) {
    dadosAtualizados.preco = precoConvertido;
  }
} else {
  delete dadosAtualizados.preco;
}

    if (
  req.body?.estoque !== undefined &&
  req.body?.estoque !== null &&
  String(req.body.estoque).trim() !== ""
) {
  const estoqueConvertido = Number(
    String(req.body.estoque).replace(",", ".")
  );

  if (!Number.isNaN(estoqueConvertido)) {
    dadosAtualizados.estoque = estoqueConvertido;
  }
} else {
  delete dadosAtualizados.estoque;
}

const precoAtual =
  dadosAtualizados.preco ??
  produto.preco ??
  0;

const custoAtual =
  Number(
    dadosAtualizados.custo ??
    produto.custo ??
    0
  );

dadosAtualizados.custo =
  custoAtual;

dadosAtualizados.lucro =
  precoAtual - custoAtual;

dadosAtualizados.margem =
  precoAtual > 0
    ? Number(
        (
          ((precoAtual - custoAtual) /
            precoAtual) *
          100
        ).toFixed(2)
      )
    : 0;

    const produtoAtualizado = await Produto.findByIdAndUpdate(
      req.params.id,
      dadosAtualizados,
      {
        new: true,
        runValidators: true,
      }
    );

    if (global.io) {
      global.io.emit("produto-atualizado", produtoAtualizado);
    }

        return res.status(200).json({
      success: true,
      message: "Produto atualizado com sucesso",
      produto: produtoAtualizado,
    });
  } catch (error) {
    console.log("ERRO ATUALIZAR PRODUTO:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETAR PRODUTO
const deletarProduto = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);

    if (!produto) {
      return res.status(404).json({
        success: false,
        message: "Produto não encontrado",
      });
    }

    if (produto.imagens?.length > 0) {
      for (const imagem of produto.imagens) {
        if (imagem.public_id) {
          await cloudinary.uploader.destroy(imagem.public_id);
        }
      }
    }

    await Produto.findByIdAndDelete(req.params.id);

    if (global.io) {
      global.io.emit("produto-deletado", req.params.id);
    }

    return res.status(200).json({
      success: true,
      message: "Produto deletado com sucesso",
    });
  } catch (error) {
    console.log("ERRO DELETAR PRODUTO:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  criarProduto,
  listarProdutos,
  buscarProduto,
  atualizarProduto,
  deletarProduto,
};