const Produto = require("../models/produto");
const Pedido = require("../models/pedido");
const Cliente = require("../models/cliente");
const ContaReceber = require("../models/contareceber");
const MovimentacaoFinanceira = require("../models/movimentacaofinanceira");
const FichaTecnica = require("../models/fichatecnica");
const MateriaPrima = require("../models/materiaprima");


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

    const dadosPedido = {
  numeroPedido: proximoNumero,

  cliente,
  telefone: telefone || "",

  cpfNota: cpfNota || "",

  produtos,

  total: Number(total || 0),

  subtotal: Number(req.body.subtotal || total || 0),

  taxaEntrega: Number(req.body.taxaEntrega || 0),

  desconto: Number(req.body.desconto || 0),

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

  pagamento:
    req.body.pagamento || "PIX",

  tipo:
    req.body.tipo || "balcao",

  mesa:
    req.body.mesa || "",
};

    if (req.usuario?.empresa) {
      dadosPedido.empresa = req.usuario.empresa;
    }

    
    const pedidoCriado = await Pedido.create(dadosPedido);
    
    // ===============================
// FINANCEIRO AUTOMÁTICO
// ===============================
try {
  const formaPagamento = req.body.pagamento || "PIX";
  const valorPedido = Number(total || 0);

  const contaReceber = await ContaReceber.create({
    descricao: `Pedido #${pedidoCriado._id.toString().slice(-6)}`,
    cliente: cliente || "Cliente",
    valor: valorPedido,
    vencimento: new Date(),
    dataRecebimento: new Date(),
    status: "recebida",
    formaRecebimento: formaPagamento,
    pedido: pedidoCriado._id,
    observacao: "Gerado automaticamente pelo pedido.",
    empresa: dadosPedido.empresa,
  });

  await MovimentacaoFinanceira.create({
    tipo: "entrada",
    origem: "pedido",
    descricao: `Venda: Pedido #${pedidoCriado._id.toString().slice(-6)}`,
    categoria: "Vendas",
    valor: valorPedido,
    formaPagamento,
    pedido: pedidoCriado._id,
    contaReceber: contaReceber._id,
    observacao: "Entrada automática gerada pelo pedido.",
    empresa: dadosPedido.empresa,
  });
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

  const valorPedido = Number(total || 0);
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
// BAIXA DE INSUMOS
// ==========================

const ficha = await FichaTecnica.findOne({
  produto: produto._id,
  ativa: true,
}).populate("itens.materiaPrima");

if (ficha) {
  for (const ingrediente of ficha.itens) {

    const materia = ingrediente.materiaPrima;

    if (!materia) continue;

    const consumo =
      Number(ingrediente.quantidade || 0) *
      Number(item.quantidade || 1);

    await MateriaPrima.findByIdAndUpdate(
      materia._id,
      {
        $inc: {
          estoqueAtual: -consumo,
        },
      }
    );
  }
}
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

return res.status(201).json({
  success: true,
  pedido: pedidoCriado,
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
    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido não encontrado",
      });
    }

    if (global.io) {
      global.io.emit("pedido-atualizado", pedido);
    }

    return res.json({
      success: true,
      pedido,
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