const Pedido = require("../models/pedido");
const ContaPagar = require("../models/contapagar");
const ContaReceber = require("../models/contareceber");
const MovimentacaoFinanceira =
  require("../models/movimentacaofinanceira");

const {
  inicioDiaSaoPaulo,
  fimDiaSaoPaulo,
  inicioMesSaoPaulo,
  dataBrParaInicio,
  dataBrParaFim,
  filtroEmpresa,
  filtroVendaValida,
  resumirPedidos,
} = require("./vendasMetricsService");


function numero(valor) {
  const n = Number(valor || 0);

  return Number.isFinite(n)
    ? n
    : 0;
}


function normalizarStatusConta(conta, tipo) {
  if (!conta) {
    return conta;
  }

  const status = String(
    conta.status || ""
  ).toLowerCase();

  if (
    [
      "paga",
      "recebida",
      "cancelada",
    ].includes(status)
  ) {
    return conta;
  }

  if (!conta.vencimento) {
    return conta;
  }

  const vencimento =
    new Date(conta.vencimento);

  const hoje =
    inicioDiaSaoPaulo(
      new Date()
    );

  if (vencimento < hoje) {
    conta.status =
      "vencida";
  }

  return conta;
}


function periodoDaConsulta(query = {}) {
  const {
    inicio,
    fim,
    periodo,
  } = query;

  if (inicio || fim) {
    return {
      inicio:
        inicio
          ? dataBrParaInicio(inicio)
          : new Date(0),

      fim:
        fim
          ? dataBrParaFim(fim)
          : new Date(),
    };
  }


  if (periodo === "mes") {
    return {
      inicio:
        inicioMesSaoPaulo(
          new Date()
        ),

      fim:
        new Date(),
    };
  }


  return {
    inicio:
      inicioDiaSaoPaulo(
        new Date()
      ),

    fim:
      fimDiaSaoPaulo(
        new Date()
      ),
  };
}


async function buscarDadosFinanceiros(
  req,
  opcoes = {}
) {
  const {
    inicio,
    fim,
  } = periodoDaConsulta(
    opcoes.query || req.query || {}
  );

  const empresa =
    filtroEmpresa(req);


  const [
    pedidos,
    movimentacoes,
    contasPagar,
    contasReceber,
  ] =
    await Promise.all([

      Pedido.find({
        ...empresa,

        ...filtroVendaValida(),

        createdAt: {
          $gte: inicio,
          $lte: fim,
        },
      }).sort({
        createdAt: -1,
      }),


      MovimentacaoFinanceira.find({
  ...empresa,

  status: {
    $ne: "estornada",
  },

  data: {
    $gte: inicio,
    $lte: fim,
  },
}).sort({
  data: -1,
}),


      ContaPagar.find({
        ...empresa,
      }).sort({
        vencimento: 1,
      }),


      ContaReceber.find({
        ...empresa,
      }).sort({
        vencimento: 1,
      }),

    ]);


  return {
    inicio,
    fim,
    pedidos,
    movimentacoes,
    contasPagar:
      contasPagar.map(
        (conta) =>
          normalizarStatusConta(
            conta,
            "pagar"
          )
      ),

    contasReceber:
      contasReceber.map(
        (conta) =>
          normalizarStatusConta(
            conta,
            "receber"
          )
      ),
  };
}


function resumirMovimentacoes(
  movimentacoes = []
) {
  const resumo = {
    entradas: 0,
    saidas: 0,
    saldo: 0,
    entradasPorForma: {},
    saidasPorForma: {},
    quantidadeEntradas: 0,
    quantidadeSaidas: 0,
  };


  for (
    const movimentacao
    of movimentacoes
  ) {
    const tipo =
      String(
        movimentacao.tipo || ""
      ).toLowerCase();

    const valor =
      numero(
        movimentacao.valor
      );

    const forma =
      String(
        movimentacao.formaPagamento ||
        "Não informado"
      );


    if (tipo === "entrada") {
      resumo.entradas +=
        valor;

      resumo.quantidadeEntradas +=
        1;

      resumo.entradasPorForma[
        forma
      ] =
        numero(
          resumo.entradasPorForma[
            forma
          ]
        ) + valor;
    }


    if (tipo === "saida") {
      resumo.saidas +=
        valor;

      resumo.quantidadeSaidas +=
        1;

      resumo.saidasPorForma[
        forma
      ] =
        numero(
          resumo.saidasPorForma[
            forma
          ]
        ) + valor;
    }
  }


  resumo.saldo =
    resumo.entradas -
    resumo.saidas;


  return resumo;
}


function resumirContas(
  contasPagar = [],
  contasReceber = []
) {
  const hoje =
    inicioDiaSaoPaulo(
      new Date()
    );


  const pagarAberto =
    contasPagar.filter(
      (conta) =>
        [
          "pendente",
          "vencida",
        ].includes(
          conta.status
        )
    );


  const receberAberto =
    contasReceber.filter(
      (conta) =>
        [
          "pendente",
          "vencida",
        ].includes(
          conta.status
        )
    );


  const pagarVencido =
    pagarAberto.filter(
      (conta) =>
        conta.vencimento &&
        new Date(
          conta.vencimento
        ) < hoje
    );


  const receberVencido =
    receberAberto.filter(
      (conta) =>
        conta.vencimento &&
        new Date(
          conta.vencimento
        ) < hoje
    );


  return {
    contasPagar: {
      totalAberto:
        pagarAberto.reduce(
          (soma, conta) =>
            soma +
            numero(
              conta.valor
            ),
          0
        ),

      totalVencido:
        pagarVencido.reduce(
          (soma, conta) =>
            soma +
            numero(
              conta.valor
            ),
          0
        ),

      quantidadeAberta:
        pagarAberto.length,

      quantidadeVencida:
        pagarVencido.length,
    },


    contasReceber: {
      totalAberto:
        receberAberto.reduce(
          (soma, conta) =>
            soma +
            numero(
              conta.valor
            ),
          0
        ),

      totalVencido:
        receberVencido.reduce(
          (soma, conta) =>
            soma +
            numero(
              conta.valor
            ),
          0
        ),

      quantidadeAberta:
        receberAberto.length,

      quantidadeVencida:
        receberVencido.length,
    },
  };
}


async function gerarResumoFinanceiro(
  req,
  opcoes = {}
) {
  const dados =
    await buscarDadosFinanceiros(
      req,
      opcoes
    );


  const vendas =
    resumirPedidos(
      dados.pedidos
    );


  const movimento =
    resumirMovimentacoes(
      dados.movimentacoes
    );


  const contas =
    resumirContas(
      dados.contasPagar,
      dados.contasReceber
    );


  return {
    periodo: {
      inicio:
        dados.inicio,

      fim:
        dados.fim,
    },


    vendas: {
      faturamento:
        numero(
          vendas.total
        ),

      quantidade:
        numero(
          vendas.quantidadePedidos
        ),

      ticketMedio:
        numero(
          vendas.ticketMedio
        ),

      maiorVenda:
        numero(
          vendas.maiorVenda
        ),

      pix:
        numero(
          vendas.pix
        ),

      credito:
        numero(
          vendas.credito
        ),

      debito:
        numero(
          vendas.debito
        ),

      dinheiro:
        numero(
          vendas.dinheiro
        ),

      crediario:
        numero(
          vendas.crediario
        ),

      outros:
        numero(
          vendas.outros
        ),
    },


    financeiro: {
      entradas:
        movimento.entradas,

      saidas:
        movimento.saidas,

      saldo:
        movimento.saldo,

      entradasPorForma:
        movimento.entradasPorForma,

      saidasPorForma:
        movimento.saidasPorForma,

      quantidadeEntradas:
        movimento.quantidadeEntradas,

      quantidadeSaidas:
        movimento.quantidadeSaidas,
    },


    contas: {
      pagar:
        contas.contasPagar,

      receber:
        contas.contasReceber,
    },


    resultado: {
      faturamento:
        numero(
          vendas.total
        ),

      entradasRealizadas:
        movimento.entradas,

      despesasRealizadas:
        movimento.saidas,

      resultadoFinanceiro:
        movimento.entradas -
        movimento.saidas,
    },


    dados: {
      pedidos:
        dados.pedidos,

      movimentacoes:
        dados.movimentacoes,

      contasPagar:
        dados.contasPagar,

      contasReceber:
        dados.contasReceber,
    },
  };
}


module.exports = {
  numero,
  periodoDaConsulta,
  buscarDadosFinanceiros,
  resumirMovimentacoes,
  resumirContas,
  gerarResumoFinanceiro,
};