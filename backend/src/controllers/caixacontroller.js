const Caixa = require("../models/caixa");
const Pedido = require("../models/pedido");

exports.caixaAtual = async (req, res) => {
  try {
    let caixa = await Caixa.findOne({ status: "aberto" }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      caixa,
    });
  } catch (error) {
    console.log("ERRO CAIXA ATUAL:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.abrirCaixa = async (req, res) => {
  try {
    const caixaAberto = await Caixa.findOne({ status: "aberto" });

    if (caixaAberto) {
      return res.status(400).json({
        success: false,
        message: "Já existe um caixa aberto.",
      });
    }

    const caixa = await Caixa.create({
      saldoInicial: Number(req.body.saldoInicial || 0),
      operador: req.body.operador || "Administrador",
      status: "aberto",
      abertoEm: new Date(),
    });

    return res.status(201).json({
      success: true,
      caixa,
    });
  } catch (error) {
    console.log("ERRO ABRIR CAIXA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.fecharCaixa = async (req, res) => {
  try {
    const caixa = await Caixa.findOne({ status: "aberto" }).sort({
      createdAt: -1,
    });

    if (!caixa) {
      return res.status(404).json({
        success: false,
        message: "Nenhum caixa aberto encontrado.",
      });
    }

    const valorContado =
  Number(req.body.valorContado || 0);

const saldoEsperado =
  Number(req.body.saldoEsperado || 0);

caixa.valorContado = valorContado;

caixa.diferencaFechamento =
  valorContado - saldoEsperado;

caixa.observacaoFechamento =
  req.body.observacao || "";

caixa.status = "fechado";
caixa.fechadoEm = new Date();

    await caixa.save();

    return res.json({
      success: true,
      caixa,
    });
  } catch (error) {
    console.log("ERRO FECHAR CAIXA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.registrarSangria = async (req, res) => {
  try {
    const caixa = await Caixa.findOne({ status: "aberto" });

    if (!caixa) {
      return res.status(404).json({
        success: false,
        message: "Nenhum caixa aberto.",
      });
    }

    caixa.sangrias.push({
      valor: Number(req.body.valor || 0),
      motivo: req.body.motivo || "Sangria",
    });

    await caixa.save();

    return res.json({
      success: true,
      caixa,
    });
  } catch (error) {
    console.log("ERRO SANGRIA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.registrarSuprimento = async (req, res) => {
  try {
    const caixa = await Caixa.findOne({ status: "aberto" });

    if (!caixa) {
      return res.status(404).json({
        success: false,
        message: "Nenhum caixa aberto.",
      });
    }

    caixa.suprimentos.push({
      valor: Number(req.body.valor || 0),
      motivo: req.body.motivo || "Suprimento",
    });

    await caixa.save();

    return res.json({
      success: true,
      caixa,
    });
  } catch (error) {
    console.log("ERRO SUPRIMENTO:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.resumoCaixa = async (req, res) => {
  try {
    const caixa = await Caixa.findOne({ status: "aberto" }).sort({
      createdAt: -1,
    });

    const inicio = caixa?.abertoEm || new Date(new Date().setHours(0, 0, 0, 0));

    const pedidos = await Pedido.find({
      createdAt: {
        $gte: inicio,
      },
      status: {
        $ne: "cancelado",
      },
    }).sort({
      createdAt: -1,
    });

    function somarPorForma(forma) {
      return pedidos.reduce((acc, pedido) => {
        if (Array.isArray(pedido.pagamentos) && pedido.pagamentos.length > 0) {
          const totalForma = pedido.pagamentos
            .filter((p) => String(p.forma || "").toUpperCase() === forma)
            .reduce((soma, p) => soma + Number(p.valor || 0), 0);

          return acc + totalForma;
        }

        if (String(pedido.pagamento || "").toUpperCase() === forma) {
          return acc + Number(pedido.total || 0);
        }

        return acc;
      }, 0);
    }

    const total = pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);

    const pix = somarPorForma("PIX");
    const credito = somarPorForma("CREDITO");
    const debito = somarPorForma("DEBITO");
    const dinheiro = somarPorForma("DINHEIRO");

    const totalSangrias =
      caixa?.sangrias?.reduce((acc, s) => acc + Number(s.valor || 0), 0) || 0;

    const totalSuprimentos =
      caixa?.suprimentos?.reduce((acc, s) => acc + Number(s.valor || 0), 0) || 0;

    const saldoInicial = Number(caixa?.saldoInicial || 0);

    return res.json({
      success: true,
      caixa,
      pedidos,
      resumo: {
        total,
        pix,
        credito,
        debito,
        dinheiro,
        quantidadePedidos: pedidos.length,
        ticketMedio: pedidos.length ? total / pedidos.length : 0,
        maiorVenda: pedidos.length
          ? Math.max(...pedidos.map((p) => Number(p.total || 0)))
          : 0,
        totalSangrias,
        totalSuprimentos,
        saldoAtual: saldoInicial + dinheiro + totalSuprimentos - totalSangrias,
      },
    });
  } catch (error) {
    console.log("ERRO RESUMO CAIXA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.historicoCaixas = async (req, res) => {
  try {
    const caixas = await Caixa.find()
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      caixas,
    });
  } catch (error) {
    console.log("ERRO HISTORICO CAIXAS:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};