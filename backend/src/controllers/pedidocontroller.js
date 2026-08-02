const Produto = require("../models/produto");
const Pedido = require("../models/pedido");
const Cliente = require("../models/cliente");
const ClubeGamificacao = require("../services/ClubeGamificacaoService");
const ContaReceber = require("../models/contareceber");
const MovimentacaoFinanceira = require("../models/movimentacaofinanceira");
const Caixa = require("../models/caixa");
const {
  gerarNfceDoPedido,
  transmitirNfce,
} = require("../services/nfceService");
const Nfce = require("../models/nfce");
const {
  consumirFichaDoItemPedido,
} = require("../services/fichaTecnicaService");
const { validarPersonalizacao } = require("../services/PersonalizacaoPedidoService");


// LISTAR
exports.listarPedidos = async (req, res) => {
  try {
    const filtro = {};

    if (req.usuario?.empresa) {
      filtro.empresa = req.usuario.empresa;
    }

    const pedidos = await Pedido.find(filtro).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      pedidos,
    });
  } catch (error) {
    console.log("ERRO LISTAR PEDIDOS:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// BUSCAR POR ID
exports.buscarPedido = async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido não encontrado",
      });
    }

    return res.json({
      success: true,
      pedido,
    });
  } catch (error) {
    console.log("ERRO BUSCAR PEDIDO:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// CRIAR
exports.criarPedido = async (req, res) => {
  try {
   const { cliente, telefone, cpfNota, produtos, total } = req.body || {};

const pagamentosRecebidos = Array.isArray(req.body.pagamentos)
  ? req.body.pagamentos
      .map((p) => ({
        forma: String(p.forma || "").toUpperCase(),
        valor: Number(p.valor || 0),
      }))
      .filter((p) => p.forma && p.valor > 0)
  : [];

const pagamentoPrincipal =
  pagamentosRecebidos[0]?.forma || req.body.pagamento || "PIX";

    if (!cliente) {
      return res.status(400).json({
        success: false,
        message: "Cliente é obrigatório",
      });
    }

    if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Pedido precisa ter produtos",
      });
    }

    const ultimoPedido = await Pedido.findOne().sort({
  numeroPedido: -1,
});

const proximoNumero =
  ultimoPedido?.numeroPedido
    ? ultimoPedido.numeroPedido + 1
    : 1;

    // ===============================
// SNAPSHOT DOS PRODUTOS
// ===============================

const produtosSnapshot = [];

for (const item of produtos) {

  const produtoBanco = await Produto.findById(item.produtoId).lean();

  if (!produtoBanco) {
    return res.status(404).json({
      success: false,
      message: `Produto não encontrado: ${item.nome}`,
    });
  }

  const personalizacao = await validarPersonalizacao(
    produtoBanco,
    item.configuracoes || []
  );
  const precoBase = Number(produtoBanco.preco || 0);
  const precoUnitarioSeguro =
    personalizacao.configuracoes.length > 0
      ? precoBase + Number(personalizacao.adicionais || 0)
      : Number(item.precoUnitario || item.preco || precoBase);
  const quantidadeItem = Number(item.quantidade || 1);
  if (!Number.isFinite(quantidadeItem) || quantidadeItem <= 0) {
    return res.status(400).json({
      success: false,
      message: `Quantidade inválida para ${produtoBanco.nome}.`,
    });
  }

  const observacaoItem = String(item.observacaoItem || "").trim().slice(0, 300);

  produtosSnapshot.push({

    produtoId: produtoBanco._id,

    nome: produtoBanco.nome,

    categoria: produtoBanco.categoria || "",

    sku: produtoBanco.sku || "",

    codigoBarras: produtoBanco.codigoBarras || "",

    quantidade: quantidadeItem,

    preco: precoUnitarioSeguro,

    precoUnitario: precoUnitarioSeguro,

    precoOriginal: precoBase,

    custoNaVenda: Number(produtoBanco.custo || 0),

    subtotal: precoUnitarioSeguro * quantidadeItem,

    unidadeMedida:
      item.unidadeMedida ||
      produtoBanco.unidadeMedida ||
      "UN",

    vendaPorPeso:
      Boolean(item.vendaPorPeso),

    permiteFracionado:
      Boolean(item.permiteFracionado),

    imagem:
      item.imagem ||
      produtoBanco.imagem ||
      "",

    configuracoes: personalizacao.configuracoes,

    adicionais: Number(personalizacao.adicionais || 0),

    observacaoItem,

    dadosNutricionais:
      produtoBanco.informacoesNutricionais || {},

    selos:
      produtoBanco.selos || [],

    gruposComponentes:
      produtoBanco.gruposComponentes || [],

    dadosFiscais:
      produtoBanco.dadosFiscais || {},

  });

}

const subtotalSeguro = produtosSnapshot.reduce(
  (soma, item) => soma + Number(item.subtotal || 0),
  0
);
const taxaEntregaSegura = Math.max(0, Number(req.body.taxaEntrega || 0));
const descontoSeguro = Math.min(
  Math.max(0, Number(req.body.desconto || 0)),
  subtotalSeguro + taxaEntregaSegura
);
const totalSeguro = Math.max(
  0,
  subtotalSeguro + taxaEntregaSegura - descontoSeguro
);

const pagamentosSeguros = pagamentosRecebidos.length > 0
  ? pagamentosRecebidos
  : [{ forma: pagamentoPrincipal, valor: totalSeguro }];
const totalPagamentos = pagamentosSeguros.reduce(
  (soma, pagamento) => soma + Number(pagamento.valor || 0),
  0
);
if (Math.abs(totalPagamentos - totalSeguro) > 0.01) {
  return res.status(400).json({
    success: false,
    message: `A soma dos pagamentos (${totalPagamentos.toFixed(2)}) deve ser igual ao total seguro do pedido (${totalSeguro.toFixed(2)}).`,
  });
}

    const dadosPedido = {
  numeroPedido: proximoNumero,

  cliente,
  telefone: telefone || "",

  cpfNota: cpfNota || "",

  produtos: produtosSnapshot,

  total: totalSeguro,

  subtotal: subtotalSeguro,

  taxaEntrega: taxaEntregaSegura,

  desconto: descontoSeguro,

  motivoDesconto:
    req.body.motivoDesconto || "",

  observacao:
    req.body.observacao || "",

  enderecoEntrega:
    req.body.enderecoEntrega || "",

  cep:
  req.body.cep || "",

numeroEntrega:
  req.body.numeroEntrega || "",

bairroEntrega:
  req.body.bairroEntrega || "",

complementoEntrega:
  req.body.complementoEntrega || "",

  referenciaEntrega:
    req.body.referenciaEntrega || "",

  pagamento: pagamentoPrincipal,
pagamentos: pagamentosSeguros,

  tipo:
    req.body.tipo || "balcao",

  mesa:
    req.body.mesa || "",
};

    if (req.usuario?.empresa) {
      dadosPedido.empresa = req.usuario.empresa;
    }

    // Vincula a venda ao caixa aberto. Assim o fechamento fica imutável e auditável.
    const filtroCaixa = { status: "aberto" };
    if (req.usuario?.empresa || req.admin?.empresa) filtroCaixa.empresa = req.usuario?.empresa || req.admin?.empresa;
    const caixaAberto = await Caixa.findOne(filtroCaixa).sort({ abertoEm: -1 });
    if (caixaAberto) dadosPedido.caixa = caixaAberto._id;

    const pedidoCriado = await Pedido.create(dadosPedido);

    // GAMIFICAÇÃO DO CLUBE: não interrompe a venda caso o cliente não esteja cadastrado.
    ClubeGamificacao.processarEvento({
      telefone: telefone || "",
      valor: totalSeguro,
      pedidoId: pedidoCriado._id,
      itens: produtosSnapshot.map((item) => ({ produtoId: item.produtoId, categoria: item.categoria, quantidade: item.quantidade })),
    }).catch((erro) => console.error("ERRO GAMIFICAÇÃO DO PEDIDO:", erro.message));

    // ===============================
// FINANCEIRO AUTOMÁTICO
// ===============================
try {
  const valorPedido = totalSeguro;

const pagamentosFinanceiro = pagamentosSeguros;

  for (const pagamentoItem of pagamentosFinanceiro) {
  const contaReceber = await ContaReceber.create({
    descricao: `Pedido #${pedidoCriado._id.toString().slice(-6)} - ${pagamentoItem.forma}`,
    cliente: cliente || "Cliente",
    valor: Number(pagamentoItem.valor || 0),
    vencimento: new Date(),
    dataRecebimento: new Date(),
    status: "recebida",
    formaRecebimento: pagamentoItem.forma,
    pedido: pedidoCriado._id,
    observacao: "Gerado automaticamente pelo pedido.",
    empresa: dadosPedido.empresa,
  });

  await MovimentacaoFinanceira.create({
    tipo: "entrada",
    origem: "pedido",
    descricao: `Venda: Pedido #${pedidoCriado._id.toString().slice(-6)} - ${pagamentoItem.forma}`,
    categoria: "Vendas",
    valor: Number(pagamentoItem.valor || 0),
    formaPagamento: pagamentoItem.forma,
    pedido: pedidoCriado._id,
    contaReceber: contaReceber._id,
    observacao: "Entrada automática gerada pelo pedido.",
    empresa: dadosPedido.empresa,
  });
}
} catch (financeiroError) {
  console.log(
    "ERRO AO GERAR FINANCEIRO DO PEDIDO:",
    financeiroError.message
  );
}

const io = req.app.get("io");

if (io) {
  io.emit("novo_pedido", pedidoCriado);
}

// ===============================
// FIDELIDADE / CLIENTE
// ===============================
if (telefone) {
  const telefoneLimpo = String(telefone).trim();

  let clienteEncontrado = await Cliente.findOne({
    telefone: telefoneLimpo,
  });

  const valorPedido = totalSeguro;
  const pontosGanhos = Math.floor(valorPedido);
  const cashbackGanho = valorPedido * 0.03;

  if (!clienteEncontrado) {
    await Cliente.create({
      nome: cliente || "Cliente",
      telefone: telefoneLimpo,
      pedidos: 1,
      gasto: valorPedido,
      pontos: pontosGanhos,
      cashback: cashbackGanho,
      ultimoPedido: new Date(),
      origem: "pedido",
    });
  } else {
    clienteEncontrado.pedidos =
      Number(clienteEncontrado.pedidos || 0) + 1;

    clienteEncontrado.gasto =
      Number(clienteEncontrado.gasto || 0) + valorPedido;

    clienteEncontrado.pontos =
      Number(clienteEncontrado.pontos || 0) + pontosGanhos;

    clienteEncontrado.cashback =
      Number(clienteEncontrado.cashback || 0) + cashbackGanho;

    clienteEncontrado.ultimoPedido = new Date();

    const gastoTotal = Number(clienteEncontrado.gasto || 0);

    clienteEncontrado.clube =
      gastoTotal >= 2000
        ? "Black"
        : gastoTotal >= 1000
        ? "Premium"
        : gastoTotal >= 500
        ? "Ouro"
        : gastoTotal >= 250
        ? "Prata"
        : "Básico";

    await clienteEncontrado.save();
  }
}

// ===============================
// BAIXA DE ESTOQUE
// ===============================
for (const item of pedidoCriado.produtos || []) {
  if (!item.produtoId) continue;

  try {
    const produto = await Produto.findById(item.produtoId);

    if (produto) {
      produto.estoque = Math.max(
        0,
        Number(produto.estoque || 0) -
          Number(item.quantidade || 1)
      );

      produto.movimentacoes.push({
        tipo: "venda",
        quantidade: Number(item.quantidade || 1),
        motivo: `Pedido ${pedidoCriado._id}`,
      });

      await produto.save();
    }

     // ==========================
// BAIXA INTELIGENTE DE INSUMOS
// ==========================
const resultadoFicha =
  await consumirFichaDoItemPedido(item);

console.log(
  `CMV DO ITEM ${item.nome}:`,
  resultadoFicha.custoTotal
);

  } catch (error) {
    console.log(
      `ERRO ATUALIZAR ESTOQUE PRODUTO ${item.produtoId}:`,
      error.message
    );
  }
}

if (global.io) {
  global.io.emit("novo-pedido", pedidoCriado);
  global.io.emit("produto-atualizado");
}

// ===============================
// NFC-E AUTOMÁTICA
// ===============================
let nfceAutomatica = null;

try {
  const nfceExistente = await Nfce.findOne({
    pedido: pedidoCriado._id,
  });

  if (!nfceExistente) {
    const nfceGerada = await gerarNfceDoPedido(pedidoCriado._id);
    nfceAutomatica = await transmitirNfce(nfceGerada._id);
  } else if (nfceExistente.status !== "autorizada") {
    nfceAutomatica = await transmitirNfce(nfceExistente._id);
  } else {
    nfceAutomatica = nfceExistente;
  }
} catch (nfceError) {
  console.log(
    "ERRO NFC-E AUTOMATICA:",
    nfceError.message
  );
}

return res.status(201).json({
  success: true,
  pedido: pedidoCriado,
  nfce: nfceAutomatica,
});

  } catch (error) {
    console.log("ERRO CRIAR PEDIDO:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ATUALIZAR STATUS
exports.atualizarStatus = async (req, res) => {
  try {
    const novoStatus = String(req.body.status || "")
      .trim()
      .toLowerCase();

    if (!novoStatus) {
      return res.status(400).json({
        success: false,
        message: "O novo status do pedido é obrigatório.",
      });
    }

    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      {
        status: novoStatus,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido não encontrado.",
      });
    }

    let nfce = null;
    let erroFiscal = null;

    /*
     * O PDV utiliza "finalizado".
     * Mantemos "entregue" por compatibilidade com pedidos antigos
     * ou outros fluxos do sistema.
     */
    const deveGerarNfce = ["finalizado", "entregue"].includes(
      novoStatus
    );

    if (deveGerarNfce) {
      try {
        const nfceExistente = await Nfce.findOne({
          pedido: pedido._id,
        });

        if (nfceExistente) {
          nfce = nfceExistente;
        } else {
          nfce = await gerarNfceDoPedido(pedido._id);
        }
      } catch (nfceError) {
        erroFiscal = nfceError.message;

        console.log(
          "ERRO GERAR NFC-E AO FINALIZAR PEDIDO:",
          nfceError
        );
      }
    }

    if (global.io) {
      global.io.emit("pedido-atualizado", pedido);

      if (nfce) {
        global.io.emit("nfce-atualizada", nfce);
      }
    }

    return res.json({
      success: true,
      pedido,
      nfce,
      fiscal: {
        gerada: Boolean(nfce),
        erro: erroFiscal,
      },
    });
  } catch (error) {
    console.log("ERRO ATUALIZAR STATUS:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.cancelarPedido = async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido não encontrado",
      });
    }

    pedido.status = "cancelado";

    await pedido.save();

    await ContaReceber.updateMany(
      { pedido: pedido._id },
      {
        status: "cancelada",
      }
    );

    await MovimentacaoFinanceira.deleteMany({
      pedido: pedido._id,
    });

    for (const item of pedido.produtos || []) {
      if (!item.produtoId) continue;

      const produto = await Produto.findById(
        item.produtoId
      );

      if (produto) {
        produto.estoque =
          Number(produto.estoque || 0) +
          Number(item.quantidade || 0);

        await produto.save();
      }
    }

    return res.json({
      success: true,
      message: "Pedido cancelado com sucesso",
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};