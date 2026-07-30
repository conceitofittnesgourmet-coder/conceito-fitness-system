const Pedido = require("../models/pedido");
const Nfe = require("../models/nfe");
const Empresa = require("../models/empresa");
const ConfiguracaoFiscal = require("../models/configuracaofiscal");
const { assinarXmlNfe } = require("./xmlSignatureService");
const { gerarXmlNfe } = require("./nfeXmlService");
const { transmitirNfeParaSefaz, consultarReciboNfe } = require("./sefazNfeService");
const { validarAntesDeGerarNfe, obterEnderecoFiscalEmpresa } = require("./fiscalValidationService");

function nums(v) { return String(v || "").replace(/\D/g, ""); }
function num(v,d=0) { const n=Number(v); return Number.isFinite(n)?n:d; }
function r2(v) { return Number(num(v).toFixed(2)); }
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

function itensDoPedido(pedido, ufEmitente, ufDestinatario) {
  if (!pedido.produtos?.length) throw new Error("Pedido sem produtos.");
  return pedido.produtos.map((p,idx)=>{
    const f=p.dadosFiscais || {};
    const q=num(p.quantidade); const vu=num(p.precoUnitario ?? p.preco); const vp=r2(p.subtotal || q*vu);
    const ncm=nums(f.ncm); if (!ncm) throw new Error(`NCM não cadastrado no item ${idx+1}: ${p.nome}.`);
    const cfop=nums(ufEmitente === ufDestinatario ? f.cfopInterno : f.cfopInterestadual); if (!cfop) throw new Error(`CFOP não cadastrado no item ${idx+1}: ${p.nome}.`);
    return { produto:p.produtoId || null, codigo:p.sku || p.codigoBarras || String(idx+1), descricao:p.nome, ncm, cest:nums(f.cest), cfop, unidadeComercial:f.unidadeComercial || p.unidadeMedida || "UN", quantidadeComercial:q, valorUnitarioComercial:vu, valorProduto:vp, unidadeTributavel:f.unidadeTributavel || p.unidadeMedida || "UN", quantidadeTributavel:q, valorUnitarioTributavel:vu, gtin:f.gtin || p.codigoBarras || "SEM GTIN", gtinTributavel:f.gtinTributavel || f.gtin || p.codigoBarras || "SEM GTIN", origem:f.origemMercadoria || "0", csosn:f.csosn || "102", cstIcms:f.cstIcms || "", aliquotaIcms:num(f.aliquotaIcms), valorIcms:0, cstPis:f.cstPis || "99", aliquotaPis:num(f.aliquotaPis), valorPis:0, cstCofins:f.cstCofins || "99", aliquotaCofins:num(f.aliquotaCofins), valorCofins:0, cstIpi:f.cstIpi || "", aliquotaIpi:num(f.aliquotaIpi), valorIpi:0, codigoBeneficioFiscal:f.codigoBeneficioFiscal || "" };
  });
}

function totais(itens, dados) {
  const vp=r2(itens.reduce((s,i)=>s+i.valorProduto,0));
  const frete=r2(dados.valorFrete), seguro=r2(dados.valorSeguro), desconto=r2(dados.valorDesconto), outras=r2(dados.outrasDespesas);
  return { valorProdutos:vp, valorFrete:frete, valorSeguro:seguro, valorDesconto:desconto, outrasDespesas:outras, valorIcms:0, valorIpi:0, valorPis:0, valorCofins:0, valorTotal:r2(vp+frete+seguro+outras-desconto) };
}

async function reservar(empresaId, ambienteInformado, serieInformada) {
  let cfg=await ConfiguracaoFiscal.findOne({ empresa:empresaId });
  if (!cfg) cfg=await ConfiguracaoFiscal.create({ empresa:empresaId, ambiente:ambienteInformado || "homologacao", serieNfe:num(serieInformada,1), proximoNumeroNfe:1 });
  const numero=num(cfg.proximoNumeroNfe,1); const serie=num(serieInformada || cfg.serieNfe,1); const ambiente=ambienteInformado || cfg.ambiente || "homologacao";
  await ConfiguracaoFiscal.updateOne({ _id:cfg._id }, { $set:{ serieNfe:serie }, $inc:{ proximoNumeroNfe:1 } });
  return { numero, serie, ambiente };
}


async function prevalidarNfeDoPedido(dados) {
  const pedido = await Pedido.findById(dados.pedidoId);
  if (!pedido) throw new Error("Pedido não encontrado.");
  if (pedido.status === "cancelado") throw new Error("Não é permitido emitir NF-e para pedido cancelado.");

  const empresaId = dados.empresaId || pedido.empresa;
  if (!empresaId) throw new Error("Empresa emissora não identificada no pedido nem na requisição.");

  const empresa = await Empresa.findById(empresaId);
  if (!empresa) throw new Error("Empresa emissora não encontrada.");

  const existente = await Nfe.findOne({ empresa: empresaId, pedido: pedido._id });
  if (existente && !["rejeitada", "erro"].includes(existente.status)) {
    throw new Error(`Já existe uma NF-e ${existente.status} vinculada a este pedido.`);
  }

  const destinatario = destinatarioDoPedido(pedido, dados.destinatario || {});
  const ufEmitente = estadoEmpresa(empresa);
  const itens = itensDoPedido(pedido, ufEmitente, destinatario.endereco.uf);
  const resumoTotais = totais(itens, {
    ...dados,
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
  const ambiente = dados.ambiente || cfg?.ambiente || "homologacao";
  const serie = num(dados.serie || cfg?.serieNfe, 1);
  const proximoNumero = num(cfg?.proximoNumeroNfe, 1);

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
  const empresaId=dados.empresaId || pedido.empresa;
  if (!empresaId) throw new Error("Empresa emissora não identificada no pedido nem na requisição.");
  const empresa=await Empresa.findById(empresaId); if (!empresa) throw new Error("Empresa emissora não encontrada.");
  const existente=await Nfe.findOne({ empresa:empresaId, pedido:pedido._id }); if (existente) throw new Error("Já existe uma NF-e vinculada a este pedido.");
  const dest=destinatarioDoPedido(pedido,dados.destinatario || {});
  const itens=itensDoPedido(pedido,estadoEmpresa(empresa),dest.endereco.uf);
  const t=totais(itens,{ ...dados, valorDesconto:dados.valorDesconto ?? pedido.desconto ?? 0 });

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
  const nfe=await Nfe.create({ empresa:empresaId, pedido:pedido._id, cliente:null, numero:nr.numero, serie:nr.serie, modelo:"55", ambiente:nr.ambiente, naturezaOperacao:dados.naturezaOperacao || "Venda de mercadoria", tipoOperacao:1, finalidade:1, consumidorFinal:dados.consumidorFinal ?? true, indicadorPresenca:dados.indicadorPresenca ?? 1, destinoOperacao:estadoEmpresa(empresa) === dest.endereco.uf ? 1 : 2, modalidadeFrete:num(dados.modalidadeFrete,9), destinatario:dest, itens, totais:t, pagamento:{ forma:String(dados.formaPagamento || "17"), descricao:dados.descricaoPagamento || pedido.pagamento || "PIX", valor:t.valorTotal }, informacoesComplementares:dados.informacoesComplementares || pedido.observacao || "", status:"gerada" });
  const gerado=gerarXmlNfe({ nfe, empresa }); nfe.xml=gerado.xml; nfe.chaveAcesso=gerado.chaveAcesso; nfe.mensagemSefaz="XML da NF-e gerado. Próxima etapa: assinatura."; await nfe.save(); return nfe;
}

async function assinarNfe(id) {
  const nfe=await Nfe.findById(id); if (!nfe) throw new Error("NF-e não encontrada."); if (!nfe.xml) throw new Error("XML da NF-e não encontrado.");
  nfe.xmlAssinado=assinarXmlNfe(String(nfe.xml).replace(/>\s+</g,"><").trim()); nfe.status="assinada"; nfe.mensagemSefaz="XML da NF-e assinado. Próxima etapa: transmissão."; await nfe.save(); return nfe;
}

async function transmitirNfe(id) {
  let nfe=await Nfe.findById(id); if (!nfe) throw new Error("NF-e não encontrada."); if (["autorizada","cancelada"].includes(nfe.status)) throw new Error(`NF-e já está ${nfe.status}.`);
  if (!nfe.xmlAssinado) nfe=await assinarNfe(id);
  const ret=await transmitirNfeParaSefaz(nfe.xmlAssinado,String(nfe.numero).padStart(15,"0"));
  nfe.cStat=String(ret.cStat || ""); nfe.recibo=ret.nRec || ""; nfe.protocolo=ret.nProt || ""; nfe.mensagemSefaz=ret.xMotivo || "Retorno SEFAZ recebido.";
  if (nfe.cStat === "100") { nfe.status="autorizada"; nfe.dataAutorizacao=ret.dhRecbto ? new Date(ret.dhRecbto) : new Date(); nfe.xmlAutorizado=ret.xmlAutorizado || nfe.xmlAssinado; }
  else if (["103","104","105"].includes(nfe.cStat) || nfe.recibo) nfe.status="processando"; else nfe.status="rejeitada";
  await nfe.save(); return nfe;
}

async function consultarRetornoNfe(id) {
  const nfe=await Nfe.findById(id); if (!nfe) throw new Error("NF-e não encontrada."); if (!nfe.recibo) throw new Error("Recibo da NF-e não encontrado.");
  const ret=await consultarReciboNfe(nfe.recibo); nfe.cStat=String(ret.cStat || ""); nfe.protocolo=ret.nProt || nfe.protocolo; nfe.mensagemSefaz=ret.xMotivo || "Consulta realizada.";
  if (nfe.cStat === "100") { nfe.status="autorizada"; nfe.dataAutorizacao=ret.dhRecbto ? new Date(ret.dhRecbto) : new Date(); nfe.xmlAutorizado=ret.xmlAutorizado || nfe.xmlAssinado; } else if (["103","104","105"].includes(nfe.cStat)) nfe.status="processando"; else nfe.status="rejeitada";
  await nfe.save(); return nfe;
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

module.exports={ prevalidarNfeDoPedido, gerarNfeDoPedido, assinarNfe, transmitirNfe, consultarRetornoNfe, processarNfeDoPedido };
