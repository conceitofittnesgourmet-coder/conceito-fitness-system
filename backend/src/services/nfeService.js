const Pedido = require("../models/pedido");
const Nfe = require("../models/nfe");
const Empresa = require("../models/empresa");
const ConfiguracaoFiscal = require("../models/configuracaofiscal");
const Cliente = require("../models/cliente");
const { assinarXmlNfe } = require("./xmlSignatureService");
const { gerarXmlNfe } = require("./nfeXmlService");
const { transmitirNfeParaSefaz, consultarReciboNfe, consultarNfePorChave, consultarStatusServicoNfe } = require("./sefazNfeService");
const { validarAntesDeGerarNfe, obterEnderecoFiscalEmpresa } = require("./fiscalValidationService");
const {
  cancelarNfeNaSefaz,
  enviarCartaCorrecaoNfe,
  validarJustificativa: validarJustificativaCancelamentoNfe,
  validarCorrecao: validarCorrecaoNfe,
} = require("./sefazNfeEventoService");

function registrarHistorico(nfe, etapa, dados = {}) {
  nfe.historicoProcessamento = nfe.historicoProcessamento || [];
  nfe.historicoProcessamento.push({
    etapa,
    status: dados.status || nfe.status || "",
    cStat: String(dados.cStat || nfe.cStat || ""),
    mensagem: dados.mensagem || nfe.mensagemSefaz || "",
    protocolo: dados.protocolo || nfe.protocolo || "",
    recibo: dados.recibo || nfe.recibo || "",
    data: new Date(),
  });
  if (nfe.historicoProcessamento.length > 100) {
    nfe.historicoProcessamento = nfe.historicoProcessamento.slice(-100);
  }
}

function montarXmlAutorizado(xmlAssinado, xmlRetorno) {
  const xml = String(xmlAssinado || "").replace(/^<\?xml[^>]*>\s*/i, "").trim();
  const retorno = String(xmlRetorno || "");
  const protocolo = retorno.match(/<(?:\w+:)?protNFe\b[^>]*>[\s\S]*?<\/(?:\w+:)?protNFe>/i)?.[0] || "";
  if (!xml || !protocolo) return xmlAssinado || "";
  return `<?xml version="1.0" encoding="UTF-8"?><nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">${xml}${protocolo}</nfeProc>`;
}

function montarXmlCancelamentoProcessado(
  xmlEventoAssinado,
  xmlRetorno
) {
  const evento = String(xmlEventoAssinado || "")
    .replace(/^<\?xml[^>]*>\s*/i, "")
    .trim();

  const retorno = String(xmlRetorno || "");

  const retEvento =
    retorno.match(
      /<(?:\w+:)?retEvento\b[^>]*>[\s\S]*?<\/(?:\w+:)?retEvento>/i
    )?.[0] || "";

  if (!evento || !retEvento) {
    return "";
  }

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<procEventoNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">' +
    evento +
    retEvento +
    "</procEventoNFe>"
  );
}

function montarXmlCartaCorrecaoProcessado(
  xmlEventoAssinado,
  xmlRetorno
) {
  const evento = String(xmlEventoAssinado || "")
    .replace(/^<\?xml[^>]*>\s*/i, "")
    .trim();

  const retorno = String(xmlRetorno || "");

  const retEvento =
    retorno.match(
      /<(?:\w+:)?retEvento\b[^>]*>[\s\S]*?<\/(?:\w+:)?retEvento>/i
    )?.[0] || "";

  if (!evento || !retEvento) {
    return "";
  }

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<procEventoNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">' +
    evento +
    retEvento +
    "</procEventoNFe>"
  );
}

function aplicarRetornoSefaz(nfe, ret, etapa) {
  nfe.cStat = String(ret.cStat || "");
  nfe.recibo = ret.nRec || nfe.recibo || "";
  nfe.protocolo = ret.nProt || nfe.protocolo || "";
  nfe.mensagemSefaz = ret.xMotivo || "Retorno SEFAZ recebido.";
  nfe.xmlRetornoSefaz = ret.xmlRetorno || ret.xmlSoap || nfe.xmlRetornoSefaz || "";
  nfe.ultimaTentativaSefaz = new Date();

  if (nfe.cStat === "100") {
    nfe.status = "autorizada";
    nfe.dataAutorizacao = ret.dhRecbto ? new Date(ret.dhRecbto) : new Date();
    nfe.xmlAutorizado = montarXmlAutorizado(nfe.xmlAssinado, nfe.xmlRetornoSefaz);
  } else if (["103", "104", "105"].includes(nfe.cStat) || nfe.recibo) {
    nfe.status = "processando";
  } else if (["110", "301", "302", "303"].includes(nfe.cStat)) {
    nfe.status = "denegada";
  } else {
    nfe.status = "rejeitada";
  }

  registrarHistorico(nfe, etapa, {
    status: nfe.status,
    cStat: nfe.cStat,
    mensagem: nfe.mensagemSefaz,
    protocolo: nfe.protocolo,
    recibo: nfe.recibo,
  });
}

function nums(v) { return String(v || "").replace(/\D/g, ""); }
function num(v,d=0) { const n=Number(v); return Number.isFinite(n)?n:d; }
function r2(v) { return Number(num(v).toFixed(2)); }

function ratearValorProporcional(total, valores) {
  const totalRateio = r2(total);

  if (
    totalRateio <= 0 ||
    !Array.isArray(valores) ||
    valores.length === 0
  ) {
    return Array.isArray(valores)
      ? valores.map(() => 0)
      : [];
  }

  const valoresNormalizados =
    valores.map((v) => Math.max(0, r2(v)));

  const soma =
    r2(
      valoresNormalizados.reduce(
        (acc, v) => acc + v,
        0
      )
    );

  if (soma <= 0) {
    throw new Error(
      "Não foi possível ratear o valor: soma dos itens é zero."
    );
  }

  if (totalRateio > soma) {
    throw new Error(
      "O valor a ratear não pode ser maior que o total dos itens."
    );
  }

  let acumulado = 0;

  return valoresNormalizados.map(
    (valor, indice) => {
      if (indice === valoresNormalizados.length - 1) {
        return r2(totalRateio - acumulado);
      }

      const parcela =
        r2(totalRateio * (valor / soma));

      acumulado =
        r2(acumulado + parcela);

      return parcela;
    }
  );
}
function estadoEmpresa(empresa) {
  const endereco = obterEnderecoFiscalEmpresa(empresa);
  return String(endereco?.uf || empresa?.estado || empresa?.uf || "PR").toUpperCase();
}

function destinatarioDoPedido(pedido, informado={}) {
  const end=informado.endereco || {};
  const cnpj=nums(informado.cnpj);
  const cpf=nums(informado.cpf || pedido.cpfNota);
  const tipo=informado.tipoPessoa || (cnpj ? "juridica" : "fisica");
  const nome=informado.nomeRazaoSocial || informado.razaoSocial || pedido.cliente;
  if (!nome) throw new Error("Nome ou razão social do destinatário é obrigatório.");
  if (tipo === "juridica" && cnpj.length !== 14) throw new Error("CNPJ do destinatário deve possuir 14 dígitos.");
  if (tipo === "fisica" && cpf.length !== 11) throw new Error("CPF do destinatário deve possuir 11 dígitos.");
  return {
    tipoPessoa:tipo, nomeRazaoSocial:nome, nomeFantasia:informado.nomeFantasia || "",
    cnpj:tipo === "juridica" ? cnpj : "", cpf:tipo === "fisica" ? cpf : "",
    inscricaoEstadual:informado.inscricaoEstadual || "", indicadorIe:num(informado.indicadorIe,9),
    email:informado.email || "", telefone:nums(informado.telefone || pedido.telefone),
    endereco:{ cep:nums(end.cep), logradouro:end.logradouro || end.rua || "", numero:String(end.numero || ""), complemento:end.complemento || "", bairro:end.bairro || "", cidade:end.cidade || end.municipio || "", codigoMunicipioIbge:end.codigoMunicipioIbge || end.codigoIbge || "", uf:String(end.uf || "").toUpperCase(), codigoPais:end.codigoPais || "1058", pais:end.pais || "Brasil" }
  };
}


  function itensDoPedido(pedido, ufEmitente, ufDestinatario, crt = 1, valorDescontoTotal = 0, valorFreteTotal = 0) {
  const usaCsosn = [1, 4].includes(Number(crt));

  if (!pedido.produtos?.length) {
    throw new Error("Pedido sem produtos.");
  }

  const valoresBrutos =
    pedido.produtos.map((p) => {
      const q = num(p.quantidade);
      const vu = num(p.precoUnitario ?? p.preco);
      return r2(p.subtotal || q * vu);
    });

  const descontosRateados =
    ratearValorProporcional(
      valorDescontoTotal,
      valoresBrutos
    );

  const fretesRateados =
    ratearValorProporcional(
      valorFreteTotal,
      valoresBrutos
    );

  return pedido.produtos.map((p, idx) => {
    const f = p.dadosFiscais || {};

    const q = num(p.quantidade);
    const vu = num(p.precoUnitario ?? p.preco);
    const vp = r2(p.subtotal || q * vu);

    const ncm = nums(f.ncm);

    if (!ncm) {
      throw new Error(
        `NCM não cadastrado no item ${idx + 1}: ${p.nome}.`
      );
    }

    const cfop = nums(
      ufEmitente === ufDestinatario
        ? f.cfopInterno
        : f.cfopInterestadual
    );

    if (!cfop) {
      throw new Error(
        `CFOP não cadastrado no item ${idx + 1}: ${p.nome}.`
      );
    }

    return {
      produto: p.produtoId || null,
      codigo: p.sku || p.codigoBarras || String(idx + 1),
      descricao: p.nome,

      ncm,
      cest: nums(f.cest),
      cfop,

      unidadeComercial:
        f.unidadeComercial ||
        p.unidadeMedida ||
        "UN",

      quantidadeComercial: q,
      valorUnitarioComercial: vu,
      valorProduto: vp,
      valorDesconto: descontosRateados[idx] || 0,
      valorFrete: fretesRateados[idx] || 0,

      unidadeTributavel:
        f.unidadeTributavel ||
        p.unidadeMedida ||
        "UN",

      quantidadeTributavel: q,
      valorUnitarioTributavel: vu,

      gtin:
        f.gtin ||
        p.codigoBarras ||
        "SEM GTIN",

      gtinTributavel:
        f.gtinTributavel ||
        f.gtin ||
        p.codigoBarras ||
        "SEM GTIN",

      origem: f.origemMercadoria || "0",

      // Reforma Tributária - IBS/CBS
      // Sem defaults tributários automáticos.
      // CST e cClassTrib devem vir do cadastro fiscal.
      cstIbsCbs: String(f.cstIbsCbs || "").trim(),
      cClassTrib: String(f.cClassTrib || "").trim(),

      baseCalculoIbsCbs: num(f.baseCalculoIbsCbs),
      aliquotaIbs: num(f.aliquotaIbs),
      reducaoAliquotaIbs: num(f.reducaoAliquotaIbs),
      valorIbsUf: num(f.valorIbsUf),
      valorIbsMun: num(f.valorIbsMun),
      valorIbs: num(f.valorIbs),

      aliquotaCbs: num(f.aliquotaCbs),
      reducaoAliquotaCbs: num(f.reducaoAliquotaCbs),
      valorCbs: num(f.valorCbs),

      // Simples Nacional
      csosn: usaCsosn
        ? String(f.csosn || "").trim()
        : "",

      // Regime Normal
      cstIcms: usaCsosn
        ? ""
        : String(f.cstIcms || "").trim(),

      baseCalculoIcms: num(f.baseCalculoIcms),
      aliquotaIcms: num(f.aliquotaIcms),
      valorIcms: num(f.valorIcms),

      cstPis: String(f.cstPis || "").trim(),
      baseCalculoPis: num(f.baseCalculoPis),
      aliquotaPis: num(f.aliquotaPis),
      valorPis: num(f.valorPis),

      cstCofins: String(f.cstCofins || "").trim(),
      baseCalculoCofins: num(f.baseCalculoCofins),
      aliquotaCofins: num(f.aliquotaCofins),
      valorCofins: num(f.valorCofins),

      cstIpi: String(f.cstIpi || "").trim(),
      aliquotaIpi: num(f.aliquotaIpi),
      valorIpi: num(f.valorIpi),

      codigoBeneficioFiscal:
        String(f.codigoBeneficioFiscal || "").trim(),
    };
  });
}

function totais(itens, dados) {
  const valorProdutos = r2(
    itens.reduce(
      (total, item) => total + num(item.valorProduto),
      0
    )
  );

  const valorFrete = r2(dados.valorFrete);
  const valorSeguro = r2(dados.valorSeguro);
  const valorDesconto = r2(dados.valorDesconto);
  const outrasDespesas = r2(dados.outrasDespesas);

  const valorIcms = r2(
    itens.reduce(
      (total, item) => total + num(item.valorIcms),
      0
    )
  );

  const valorIpi = r2(
    itens.reduce(
      (total, item) => total + num(item.valorIpi),
      0
    )
  );

  const valorPis = r2(
    itens.reduce(
      (total, item) => total + num(item.valorPis),
      0
    )
  );

  const valorCofins = r2(
    itens.reduce(
      (total, item) => total + num(item.valorCofins),
      0
    )
  );

  return {
    valorProdutos,
    valorFrete,
    valorSeguro,
    valorDesconto,
    outrasDespesas,
    valorIcms,
    valorIpi,
    valorPis,
    valorCofins,

    valorTotal: r2(
      valorProdutos +
      valorFrete +
      valorSeguro +
      outrasDespesas -
      valorDesconto
    ),
  };
}

async function reservar(empresaId, ambienteInformado, serieInformada) {
  let cfg = await ConfiguracaoFiscal.findOne({ empresa: empresaId });

  if (!cfg) {
    cfg = await ConfiguracaoFiscal.create({
      empresa: empresaId,
      ambiente: ambienteInformado || "homologacao",
      serieNfe: 1,
      proximoNumeroNfe: 1,
      serieNfeProducao: 1,
      proximoNumeroNfeProducao: 1,
    });
  }

  const ambiente =
    ambienteInformado ||
    cfg.ambiente ||
    "homologacao";

  const producao = ambiente === "producao";

  const campoSerie = producao
    ? "serieNfeProducao"
    : "serieNfe";

  const campoNumero = producao
    ? "proximoNumeroNfeProducao"
    : "proximoNumeroNfe";

  const serie = num(
    serieInformada || cfg[campoSerie],
    1
  );

  const numeroAtual = num(cfg[campoNumero], 1);

  // Garante que documentos antigos tenham o contador do ambiente criado
  // antes da reserva atômica.
  if (!Number(cfg[campoNumero]) || Number(cfg[campoNumero]) < 1) {
    await ConfiguracaoFiscal.updateOne(
      { _id: cfg._id },
      {
        $set: {
          [campoSerie]: serie,
          [campoNumero]: numeroAtual,
        },
      }
    );
  }

  const reservado = await ConfiguracaoFiscal.findOneAndUpdate(
    { _id: cfg._id },
    {
      $set: {
        [campoSerie]: serie,
      },
      $inc: {
        [campoNumero]: 1,
      },
    },
    {
      new: false,
    }
  );

  if (!reservado) {
    throw new Error("Não foi possível reservar a numeração da NF-e.");
  }

  const numero = num(reservado[campoNumero], numeroAtual);

  return {
    numero,
    serie,
    ambiente,
  };
}


async function prevalidarNfeDoPedido(dados) {
  const pedido = await Pedido.findById(dados.pedidoId);
  if (!pedido) throw new Error("Pedido não encontrado.");
  if (pedido.status === "cancelado") throw new Error("Não é permitido emitir NF-e para pedido cancelado.");

  let empresaId = dados.empresaId || pedido.empresa;

let empresa;

if (empresaId) {
  empresa = await Empresa.findById(empresaId);
} else {
  empresa = await Empresa.findOne();
}

if (!empresa) {
  throw new Error("Empresa emissora não encontrada. Cadastre os dados da empresa antes de emitir a NF-e.");
}

empresaId = empresa._id;

  const existente = await Nfe.findOne({ empresa: empresaId, pedido: pedido._id });
  if (existente && !["rejeitada", "erro"].includes(existente.status)) {
    throw new Error(`Já existe uma NF-e ${existente.status} vinculada a este pedido.`);
  }

  let destinatarioInformado = dados.destinatario || {};

  if (!dados.destinatario || Object.keys(destinatarioInformado).length === 0) {
    const documentoPedido = nums(pedido.cpfNota);

    let clienteFiscal = null;

    if (documentoPedido.length === 14) {
      clienteFiscal = await Cliente.findOne({ cnpj: documentoPedido }).lean();
    } else if (documentoPedido.length === 11) {
      clienteFiscal = await Cliente.findOne({ cpf: documentoPedido }).lean();
    }

    if (clienteFiscal) {
      destinatarioInformado = clienteFiscal;
    }
  }

  const destinatario = destinatarioDoPedido(
    pedido,
    destinatarioInformado
  );

  const ufEmitente = estadoEmpresa(empresa);
  const itens = itensDoPedido(
    pedido,
    estadoEmpresa(empresa),
    destinatario.endereco.uf,
    empresa.crt || empresa.regimeTributarioCodigo || 1,
    dados.valorDesconto ?? pedido.desconto ?? 0,
    dados.valorFrete ?? pedido.taxaEntrega ?? 0
  );
  const resumoTotais = totais(itens, {
    ...dados,
    valorFrete: dados.valorFrete ?? pedido.taxaEntrega ?? 0,
    valorDesconto: dados.valorDesconto ?? pedido.desconto ?? 0,
  });

  const validacao = validarAntesDeGerarNfe({
    empresa,
    destinatario,
    itens,
    totais: resumoTotais,
    validarA1: true,
  });

  const cfg = await ConfiguracaoFiscal.findOne({ empresa: empresaId });

const ambiente =
  dados.ambiente ||
  cfg?.ambiente ||
  "homologacao";

const producao = ambiente === "producao";

const serie = num(
  dados.serie ||
    (producao
      ? cfg?.serieNfeProducao
      : cfg?.serieNfe),
  1
);

const proximoNumero = num(
  producao
    ? cfg?.proximoNumeroNfeProducao
    : cfg?.proximoNumeroNfe,
  1
);

  return {
    valido: true,
    ambiente,
    homologacao: ambiente === "homologacao",
    serie,
    proximoNumero,
    pedido: {
      id: pedido._id,
      cliente: pedido.cliente || destinatario.nomeRazaoSocial,
      total: resumoTotais.valorTotal,
      quantidadeItens: itens.length,
    },
    emitente: {
      razaoSocial: empresa.razaoSocial || empresa.nome || "",
      cnpj: validacao.cnpjEmitente,
      uf: ufEmitente,
    },
    destinatario: {
      nomeRazaoSocial: destinatario.nomeRazaoSocial,
      documento: validacao.cnpjDestinatario || validacao.cpf,
      uf: destinatario.endereco.uf,
    },
    itens: itens.map((item, indice) => ({
      numero: indice + 1,
      descricao: item.descricao,
      ncm: item.ncm,
      cfop: item.cfop,
      tributacao: item.csosn || item.cstIcms,
      quantidade: item.quantidadeComercial,
      valor: item.valorProduto,
    })),
    totais: resumoTotais,
    aviso: ambiente === "homologacao"
      ? "Validação concluída em ambiente de homologação. Nenhuma numeração foi consumida e nenhum XML foi transmitido."
      : "A configuração está em produção. Confirme os dados antes de transmitir a NF-e.",
  };
}
async function gerarNfeDoPedido(dados) {
  const pedido=await Pedido.findById(dados.pedidoId);
  if (!pedido) throw new Error("Pedido não encontrado.");
  if (pedido.status === "cancelado") throw new Error("Não é permitido emitir NF-e para pedido cancelado.");
  let empresaId = dados.empresaId || pedido.empresa;

let empresa;

if (empresaId) {
  empresa = await Empresa.findById(empresaId);
} else {
  empresa = await Empresa.findOne();
}

if (!empresa) {
  throw new Error("Empresa emissora não encontrada. Cadastre os dados da empresa antes de emitir a NF-e.");
}

empresaId = empresa._id;

if (!empresa) throw new Error("Empresa emissora não encontrada.");
  const existente=await Nfe.findOne({ empresa:empresaId, pedido:pedido._id }); if (existente) throw new Error("Já existe uma NF-e vinculada a este pedido.");
  let destinatarioInformado = dados.destinatario || {};

  if (!dados.destinatario || Object.keys(destinatarioInformado).length === 0) {
    const documentoPedido = nums(pedido.cpfNota);

    let clienteFiscal = null;

    if (documentoPedido.length === 14) {
      clienteFiscal = await Cliente.findOne({ cnpj: documentoPedido }).lean();
    } else if (documentoPedido.length === 11) {
      clienteFiscal = await Cliente.findOne({ cpf: documentoPedido }).lean();
    }

    if (clienteFiscal) {
      destinatarioInformado = clienteFiscal;
    }
  }

  const dest = destinatarioDoPedido(
    pedido,
    destinatarioInformado
  );

const itens = itensDoPedido(
    pedido,
    estadoEmpresa(empresa),
    dest.endereco.uf,
    empresa.crt || empresa.regimeTributarioCodigo || 1,
    dados.valorDesconto ?? pedido.desconto ?? 0,
    dados.valorFrete ?? pedido.taxaEntrega ?? 0
  );

const t = totais(itens, {
  ...dados,
  valorFrete: dados.valorFrete ?? pedido.taxaEntrega ?? 0,
    valorDesconto: dados.valorDesconto ?? pedido.desconto ?? 0
});

  // Valida todos os dados antes de reservar numeração, criar a NF-e e gerar o XML.
  // Assim, erros de CPF/CNPJ, endereço, produtos ou certificado não consomem número fiscal.
  validarAntesDeGerarNfe({
    empresa,
    destinatario: dest,
    itens,
    totais: t,
    validarA1: true,
  });

  const nr=await reservar(empresaId,dados.ambiente,dados.serie);
  const nfe=await Nfe.create({ empresa:empresaId, pedido:pedido._id, cliente:null, numero:nr.numero, serie:nr.serie, modelo:"55", ambiente:nr.ambiente, naturezaOperacao:dados.naturezaOperacao || "Venda de mercadoria", tipoOperacao:1, finalidade:1, consumidorFinal:dados.consumidorFinal ?? true, indicadorPresenca:dados.indicadorPresenca ?? 1, destinoOperacao:estadoEmpresa(empresa) === dest.endereco.uf ? 1 : 2, modalidadeFrete:num(dados.modalidadeFrete,9), destinatario:dest, itens, totais:t, pagamento: (() => {
    const pagamentosPedido = Array.isArray(pedido.pagamentos)
      ? pedido.pagamentos
      : [];

    const pagamentoCrediario = pagamentosPedido.find(
      (p) =>
        String(p?.forma || "").trim().toUpperCase() === "CREDIARIO"
    );

    const ehCrediario =
      String(pedido.pagamento || "").trim().toUpperCase() === "CREDIARIO" ||
      Boolean(pagamentoCrediario);

    return {
      forma: String(
        dados.formaPagamento ||
        (ehCrediario ? "14" : "17")
      ),
      indicador:
        dados.indicadorPagamento !== undefined
          ? Number(dados.indicadorPagamento)
          : ehCrediario
            ? 1
            : 0,
      descricao:
        dados.descricaoPagamento ||
        pedido.pagamento ||
        "PIX",
      valor: t.valorTotal,
    };
  })(),

  cobranca: (() => {
    const pagamentosPedido = Array.isArray(pedido.pagamentos)
      ? pedido.pagamentos
      : [];

    const parcelasCrediario = pagamentosPedido.filter(
      (p) =>
        String(p?.forma || "").trim().toUpperCase() === "CREDIARIO" &&
        Number(p?.valor || 0) > 0
    );

    if (!parcelasCrediario.length) {
      return {
        fatura: {
          numero: "",
          valorOriginal: 0,
          valorDesconto: 0,
          valorLiquido: 0,
        },
        duplicatas: [],
      };
    }

    return {
      fatura: {
        numero: String(
          dados.numeroFatura ||
          pedido.numero ||
          nr.numero
        ),
        valorOriginal: t.valorTotal,
        valorDesconto: 0,
        valorLiquido: t.valorTotal,
      },

      duplicatas: parcelasCrediario.map((p, idx) => ({
        numero: String(idx + 1).padStart(3, "0"),
        vencimento: p.vencimento || null,
        valor: num(p.valor),
      })),
    };
  })(), informacoesComplementares:dados.informacoesComplementares || pedido.observacao || "", status:"gerada" });
  const gerado=gerarXmlNfe({ nfe, empresa }); nfe.xml=gerado.xml; nfe.chaveAcesso=gerado.chaveAcesso; nfe.mensagemSefaz="XML da NF-e gerado. Próxima etapa: assinatura."; registrarHistorico(nfe, "geracao", { status: "gerada", mensagem: nfe.mensagemSefaz }); await nfe.save(); return nfe;
}

async function assinarNfe(id) {
  const nfe=await Nfe.findById(id); if (!nfe) throw new Error("NF-e não encontrada."); if (!nfe.xml) throw new Error("XML da NF-e não encontrado.");
  nfe.xmlAssinado=assinarXmlNfe(String(nfe.xml).replace(/>\s+</g,"><").trim()); nfe.status="assinada"; nfe.mensagemSefaz="XML da NF-e assinado. Próxima etapa: transmissão."; registrarHistorico(nfe, "assinatura", { status: "assinada", mensagem: nfe.mensagemSefaz }); await nfe.save(); return nfe;
}

async function transmitirNfe(id) {
  let nfe = await Nfe.findById(id);
  if (!nfe) throw new Error("NF-e não encontrada.");
  if (["autorizada", "cancelada", "denegada"].includes(nfe.status)) {
    throw new Error(`NF-e já está ${nfe.status}.`);
  }
  if (!nfe.xmlAssinado) nfe = await assinarNfe(id);

  nfe.quantidadeTentativasSefaz = num(nfe.quantidadeTentativasSefaz) + 1;
  nfe.ultimaTentativaSefaz = new Date();
  registrarHistorico(nfe, "transmissao_iniciada", { status: "transmitida", mensagem: "NF-e enviada à SEFAZ." });
  await nfe.save();

  try {
    const ret = await transmitirNfeParaSefaz(
      nfe.xmlAssinado,
      String(nfe.numero).padStart(15, "0"),
      nfe.ambiente
    );
    aplicarRetornoSefaz(nfe, ret, "retorno_transmissao");
    await nfe.save();
    return nfe;
  } catch (error) {
    nfe.status = "erro";
    nfe.mensagemSefaz = error.message || "Falha técnica na comunicação com a SEFAZ.";
    registrarHistorico(nfe, "erro_transmissao", { status: "erro", mensagem: nfe.mensagemSefaz });
    await nfe.save();
    throw error;
  }
}

async function consultarRetornoNfe(id) {
  const nfe = await Nfe.findById(id);
  if (!nfe) throw new Error("NF-e não encontrada.");
  if (nfe.status === "autorizada") return nfe;

  let ret;
  if (nfe.recibo) {
    ret = await consultarReciboNfe(nfe.recibo, nfe.ambiente);
  } else if (nfe.chaveAcesso) {
    ret = await consultarNfePorChave(nfe.chaveAcesso, nfe.ambiente);
  } else {
    throw new Error("A NF-e não possui recibo nem chave de acesso para consulta.");
  }

  aplicarRetornoSefaz(nfe, ret, "consulta_sefaz");
  await nfe.save();
  return nfe;
}

async function consultarStatusSefaz(ambiente = "homologacao") {
  return consultarStatusServicoNfe(ambiente);
}

async function processarNfeDoPedido(dados) {
  let nfe = await Nfe.findOne({ pedido: dados.pedidoId });

  if (!nfe) {
    nfe = await gerarNfeDoPedido(dados);
  }

  if (nfe.status === "autorizada") return nfe;
  if (nfe.status === "cancelada") throw new Error("A NF-e vinculada a este pedido está cancelada.");

  if (!nfe.xmlAssinado) {
    nfe = await assinarNfe(nfe._id);
  }

  if (nfe.status !== "autorizada") {
    nfe = await transmitirNfe(nfe._id);
  }

  return nfe;
}

async function cancelarNfe(id, justificativa) {
  if (!id) {
    throw new Error(
      "O identificador da NF-e não foi informado."
    );
  }

  const nfe = await Nfe.findById(id);

  if (!nfe) {
    throw new Error("NF-e não encontrada.");
  }

  if (nfe.status === "cancelada") {
    throw new Error(
      "Esta NF-e já está cancelada."
    );
  }

  if (nfe.status !== "autorizada") {
    throw new Error(
      `Somente uma NF-e autorizada pode ser cancelada. Status atual: ${nfe.status || "não informado"}.`
    );
  }

  if (!nfe.chaveAcesso) {
    throw new Error(
      "A chave de acesso da NF-e não foi encontrada."
    );
  }

  if (!nfe.protocolo) {
    throw new Error(
      "O protocolo de autorização da NF-e não foi encontrado."
    );
  }

  const justificativaValidada =
    validarJustificativaCancelamentoNfe(
      justificativa
    );

  const dataEvento = new Date();

  const retorno =
    await cancelarNfeNaSefaz({
      chaveAcesso: nfe.chaveAcesso,
      protocolo: nfe.protocolo,
      justificativa:
        justificativaValidada,
      ambiente:
        nfe.ambiente || "homologacao",
      sequenciaEvento: 1,
      dataEvento,
    });

  nfe.cancelamento = {
    justificativa:
      justificativaValidada,

    protocolo:
      retorno.protocoloEvento || "",

    cStat:
      retorno.cStatEvento ||
      retorno.cStat ||
      "",

    xMotivo:
      retorno.xMotivoEvento ||
      retorno.xMotivo ||
      "",

    dataEvento,

        xmlEvento:
      retorno.xmlEvento || "",

    xmlEventoAssinado:
      retorno.xmlEventoAssinado || "",

    xmlRetorno:
      retorno.xmlRetorno || "",

    xmlProcessado:
      montarXmlCancelamentoProcessado(
        retorno.xmlEventoAssinado || "",
        retorno.xmlRetorno || ""
      ),
  };

  const concluido =
    Boolean(
      retorno.cancelamentoConfirmado
    ) ||
    Boolean(
      retorno.eventoDuplicado
    );

  if (concluido) {
    nfe.status = "cancelada";

    nfe.mensagemSefaz =
      retorno.xMotivoEvento ||
      retorno.xMotivo ||
      "Cancelamento da NF-e confirmado pela SEFAZ.";
  } else {
    nfe.mensagemSefaz =
      retorno.xMotivoEvento ||
      retorno.xMotivo ||
      "A SEFAZ não confirmou o cancelamento da NF-e.";
  }

  registrarHistorico(
    nfe,
    "cancelamento",
    {
      status: nfe.status,
      cStat:
        retorno.cStatEvento ||
        retorno.cStat ||
        "",
      mensagem: nfe.mensagemSefaz,
      protocolo:
        retorno.protocoloEvento || "",
    }
  );

  await nfe.save();

  return nfe;
}

async function cartaCorrecaoNfe(id, correcao) {
  if (!id) {
    throw new Error(
      "O identificador da NF-e não foi informado."
    );
  }

  const nfe = await Nfe.findById(id);

  if (!nfe) {
    throw new Error("NF-e não encontrada.");
  }

  if (nfe.status === "cancelada") {
    throw new Error(
      "Não é permitido registrar Carta de Correção para NF-e cancelada."
    );
  }

  if (nfe.status !== "autorizada") {
    throw new Error(
      `Somente uma NF-e autorizada pode receber Carta de Correção. Status atual: ${nfe.status || "não informado"}.`
    );
  }

  if (!nfe.chaveAcesso) {
    throw new Error(
      "A chave de acesso da NF-e não foi encontrada."
    );
  }

  const correcaoValidada =
    validarCorrecaoNfe(correcao);

  nfe.cartaCorrecao =
    nfe.cartaCorrecao || [];

  const maiorSequencia =
    nfe.cartaCorrecao.reduce(
      (maior, carta) =>
        Math.max(
          maior,
          Number(carta.sequencia || 0)
        ),
      0
    );

  const sequenciaEvento =
    maiorSequencia + 1;

  if (sequenciaEvento > 20) {
    throw new Error(
      "A NF-e já atingiu o limite de 20 Cartas de Correção."
    );
  }

  const dataEvento = new Date();

  const retorno =
    await enviarCartaCorrecaoNfe({
      chaveAcesso: nfe.chaveAcesso,
      correcao: correcaoValidada,
      ambiente:
        nfe.ambiente || "homologacao",
      sequenciaEvento,
      dataEvento,
    });

  const cStat =
    String(
      retorno.cStatEvento ||
      retorno.cStat ||
      ""
    );

  const xMotivo =
    retorno.xMotivoEvento ||
    retorno.xMotivo ||
    "";

  const xmlProcessado =
    montarXmlCartaCorrecaoProcessado(
      retorno.xmlEventoAssinado || "",
      retorno.xmlRetorno || ""
    );

  if (retorno.cartaCorrecaoConfirmada) {
    nfe.cartaCorrecao.push({
      sequencia: sequenciaEvento,
      correcao: correcaoValidada,

      protocolo:
        retorno.protocoloEvento || "",

      cStat,
      xMotivo,
      dataEvento,

      xmlEvento:
        retorno.xmlEvento || "",

      xmlEventoAssinado:
        retorno.xmlEventoAssinado || "",

      xmlRetorno:
        retorno.xmlRetorno || "",

      xmlProcessado,
    });

    nfe.mensagemSefaz =
      xMotivo ||
      "Carta de Correção registrada pela SEFAZ.";

    registrarHistorico(
      nfe,
      "carta_correcao",
      {
        status: nfe.status,
        cStat,
        mensagem: nfe.mensagemSefaz,
        protocolo:
          retorno.protocoloEvento || "",
      }
    );

    await nfe.save();
  }

  return {
    nfe,
    evento: {
      confirmado:
        Boolean(
          retorno.cartaCorrecaoConfirmada
        ),

      sequencia:
        sequenciaEvento,

      cStat,
      xMotivo,

      protocolo:
        retorno.protocoloEvento || "",

      dataRegistro:
        retorno.dataRegistro || "",

      xmlProcessado,
    },
  };
}

module.exports = {
  prevalidarNfeDoPedido,
  gerarNfeDoPedido,
  assinarNfe,
  transmitirNfe,
  consultarRetornoNfe,
  consultarStatusSefaz,
  processarNfeDoPedido,
  cancelarNfe,
  cartaCorrecaoNfe,

  __previewInternals: {
    destinatarioDoPedido,
    itensDoPedido,
    totais,
    estadoEmpresa,
  },
};