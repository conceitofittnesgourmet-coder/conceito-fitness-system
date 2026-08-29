const Empresa = require("../models/empresa");
const ConfiguracaoFiscal = require("../models/configuracaofiscal");
const Produto = require("../models/produto");
const { validarCertificadoA1 } = require("./certificadoservice");

function somenteNumeros(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function campo(ok, nome, mensagem, categoria) {
  const actionUrl = ["empresa", "endereco"].includes(categoria) ? "/empresa" : null;
  return { ok: Boolean(ok), nome, mensagem, categoria, actionUrl };
}

async function diagnosticarFiscal(empresaId = null) {
  const empresa = empresaId
    ? await Empresa.findById(empresaId).lean()
    : await Empresa.findOne().lean();

  const config = empresa?._id
    ? await ConfiguracaoFiscal.findOne({ empresa: empresa._id }).lean()
    : await ConfiguracaoFiscal.findOne().lean();

  const endereco = empresa?.enderecoFiscal || {};
  const certificado = validarCertificadoA1();

  const verificacoes = [
    campo(Boolean(empresa), "Empresa emissora", "Cadastre a empresa emissora.", "empresa"),
    campo(somenteNumeros(empresa?.cnpj).length === 14, "CNPJ do emitente", "Informe um CNPJ válido com 14 dígitos.", "empresa"),
    campo(Boolean(empresa?.razaoSocial), "Razão social", "Informe a razão social da empresa.", "empresa"),
    campo(Boolean(empresa?.inscricaoEstadual), "Inscrição estadual", "Informe a inscrição estadual.", "empresa"),
    campo([1, 2, 3, 4].includes(Number(empresa?.crt)), "Regime tributário (CRT)", "Selecione um CRT válido.", "empresa"),
    campo(somenteNumeros(endereco?.cep).length === 8, "CEP fiscal", "Informe o CEP fiscal com 8 dígitos.", "endereco"),
    campo(Boolean(endereco?.logradouro), "Logradouro fiscal", "Informe o logradouro fiscal.", "endereco"),
    campo(Boolean(endereco?.numero), "Número fiscal", "Informe o número do endereço fiscal.", "endereco"),
    campo(Boolean(endereco?.bairro), "Bairro fiscal", "Informe o bairro fiscal.", "endereco"),
    campo(Boolean(endereco?.cidade), "Cidade fiscal", "Informe a cidade fiscal.", "endereco"),
    campo(somenteNumeros(endereco?.codigoMunicipioIbge).length === 7, "Código IBGE do município", "Informe o código IBGE de 7 dígitos.", "endereco"),
    campo(String(endereco?.uf || "").length === 2, "UF fiscal", "Informe a UF fiscal.", "endereco"),
    campo(Boolean(config), "Configuração fiscal", "Salve a configuração fiscal.", "configuracao"),
    campo(Number(config?.serieNfe) > 0, "Série da NF-e", "Informe a série da NF-e.", "configuracao"),
    campo(Number(config?.proximoNumeroNfe) > 0, "Próximo número da NF-e", "Informe o próximo número da NF-e.", "configuracao"),
    campo(
  Number(config?.serieNfeProducao) > 0,
  "Série da NF-e em produção",
  "Informe a série da NF-e em produção.",
  "configuracao"
),

campo(
  Number(config?.proximoNumeroNfeProducao) > 0,
  "Próximo número da NF-e em produção",
  "Informe o próximo número da NF-e em produção.",
  "configuracao"
),
    campo(Boolean(config?.credenciadoNfe), "Credenciamento NF-e", "Confirme o credenciamento para NF-e modelo 55.", "configuracao"),
    campo(Boolean(certificado?.valido), "Certificado digital A1", certificado?.message || "Configure um certificado A1 válido.", "certificado"),
  ];

  const produtosDaEmpresa = empresa?._id
    ? await Produto.countDocuments({ empresa: empresa._id })
    : 0;
  // Bases antigas podem ter produtos sem o campo empresa. Nesse caso,
  // o diagnóstico considera o catálogo inteiro para não ocultar pendências.
  const filtroProdutos = produtosDaEmpresa > 0 ? { empresa: empresa._id } : {};
  const [totalProdutos, semNcm, semCfop, semTributacao] = await Promise.all([
    Produto.countDocuments(filtroProdutos),
    Produto.countDocuments({ ...filtroProdutos, "dadosFiscais.produtoTributavel": { $ne: false }, $or: [{ "dadosFiscais.ncm": "" }, { "dadosFiscais.ncm": { $exists: false } }] }),
    Produto.countDocuments({ ...filtroProdutos, "dadosFiscais.produtoTributavel": { $ne: false }, $or: [{ "dadosFiscais.cfopInterno": "" }, { "dadosFiscais.cfopInterno": { $exists: false } }] }),
    Produto.countDocuments({ ...filtroProdutos, "dadosFiscais.produtoTributavel": { $ne: false }, $and: [{ $or: [{ "dadosFiscais.csosn": "" }, { "dadosFiscais.csosn": { $exists: false } }] }, { $or: [{ "dadosFiscais.cstIcms": "" }, { "dadosFiscais.cstIcms": { $exists: false } }] }] }),
  ]);

  verificacoes.push(
    campo(semNcm === 0, "NCM dos produtos", `${semNcm} produto(s) tributável(is) sem NCM.`, "produtos"),
    campo(semCfop === 0, "CFOP dos produtos", `${semCfop} produto(s) tributável(is) sem CFOP interno.`, "produtos"),
    campo(semTributacao === 0, "Tributação ICMS", `${semTributacao} produto(s) sem CSOSN/CST.`, "produtos")
  );

  const pendencias = verificacoes.filter((item) => !item.ok);

  return {
    pronto: pendencias.length === 0,
    ambiente: config?.ambiente || "homologacao",
    empresa: empresa ? { _id: empresa._id, nomeFantasia: empresa.nomeFantasia, razaoSocial: empresa.razaoSocial, cnpj: empresa.cnpj } : null,
    configuracao: config || null,
    certificado,
    produtos: { total: totalProdutos, semNcm, semCfop, semTributacao },
    verificacoes,
    pendencias,
  };
}

module.exports = { diagnosticarFiscal };
