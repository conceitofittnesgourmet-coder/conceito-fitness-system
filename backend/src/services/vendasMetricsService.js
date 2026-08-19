const TZ_OFFSET_HOURS = 3; // America/Sao_Paulo (UTC-03:00)

function numero(valor) {
  const n = Number(valor || 0);
  return Number.isFinite(n) ? n : 0;
}

function inicioDiaSaoPaulo(data = new Date()) {
  const local = new Date(data.getTime() - TZ_OFFSET_HOURS * 3600000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), TZ_OFFSET_HOURS));
}

function fimDiaSaoPaulo(data = new Date()) {
  return new Date(inicioDiaSaoPaulo(data).getTime() + 86400000 - 1);
}

function inicioMesSaoPaulo(data = new Date()) {
  const local = new Date(data.getTime() - TZ_OFFSET_HOURS * 3600000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1, TZ_OFFSET_HOURS));
}

function fimMesSaoPaulo(data = new Date()) {
  const inicio = inicioMesSaoPaulo(data);
  return new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + 1, 1, TZ_OFFSET_HOURS) - 1);
}

function dataBrParaInicio(valor) {
  if (!valor) return null;
  const [ano, mes, dia] = String(valor).split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia, TZ_OFFSET_HOURS));
}

function dataBrParaFim(valor) {
  const inicio = dataBrParaInicio(valor);
  return inicio ? new Date(inicio.getTime() + 86400000 - 1) : null;
}

function filtroEmpresa(req) {
  const empresa = req?.usuario?.empresa || req?.admin?.empresa;
  return empresa ? { empresa } : {};
}

function filtroVendaValida() {
  return { status: { $nin: ["cancelado", "cancelada", "estornado", "estornada"] } };
}

function pagamentosDoPedido(pedido) {
  if (Array.isArray(pedido.pagamentos) && pedido.pagamentos.length) {
    return pedido.pagamentos.map((p) => ({
      forma: String(p.forma || "OUTROS").toUpperCase(),
      valor: numero(p.valor),
    }));
  }
  return [{ forma: String(pedido.pagamento || "OUTROS").toUpperCase(), valor: numero(pedido.total) }];
}

function resumirPedidos(pedidos = []) {
  const resumo = {
    total: 0, quantidadePedidos: pedidos.length, ticketMedio: 0, maiorVenda: 0,
    pix: 0, credito: 0, debito: 0, dinheiro: 0, crediario: 0, outros: 0,
  };
  for (const pedido of pedidos) {
    const total = numero(pedido.total);
    resumo.total += total;
    resumo.maiorVenda = Math.max(resumo.maiorVenda, total);
    for (const pagamento of pagamentosDoPedido(pedido)) {
      if (pagamento.forma === "PIX") {
  resumo.pix += pagamento.valor;
} else if (["CREDITO", "CRÉDITO"].includes(pagamento.forma)) {
  resumo.credito += pagamento.valor;
} else if (["DEBITO", "DÉBITO"].includes(pagamento.forma)) {
  resumo.debito += pagamento.valor;
} else if (pagamento.forma === "DINHEIRO") {
  resumo.dinheiro += pagamento.valor;
} else if (pagamento.forma === "CREDIARIO") {
  resumo.crediario += pagamento.valor;
} else {
  resumo.outros += pagamento.valor;
}
    }
  }
  resumo.ticketMedio = resumo.quantidadePedidos ? resumo.total / resumo.quantidadePedidos : 0;
  return resumo;
}

function partesSaoPaulo(data) {
  const local = new Date(new Date(data).getTime() - TZ_OFFSET_HOURS * 3600000);
  return {
    ano: local.getUTCFullYear(), mes: local.getUTCMonth(), dia: local.getUTCDate(),
    hora: local.getUTCHours(), semana: local.getUTCDay(),
  };
}

module.exports = {
  numero, inicioDiaSaoPaulo, fimDiaSaoPaulo, inicioMesSaoPaulo, fimMesSaoPaulo,
  dataBrParaInicio, dataBrParaFim, filtroEmpresa, filtroVendaValida,
  pagamentosDoPedido, resumirPedidos, partesSaoPaulo,
};
