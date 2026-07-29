const { validarCertificadoA1 } = require("./certificadoservice");

const UFS = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT",
  "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO",
  "RR", "SC", "SP", "SE", "TO",
]);

function somenteNumeros(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function texto(valor) {
  return String(valor ?? "").trim();
}

function numero(valor) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : NaN;
}

function todosIguais(documento) {
  return /^(\d)\1+$/.test(documento);
}

function validarCpf(cpfInformado) {
  const cpf = somenteNumeros(cpfInformado);
  if (cpf.length !== 11 || todosIguais(cpf)) return false;

  for (let posicao = 9; posicao <= 10; posicao += 1) {
    let soma = 0;
    for (let i = 0; i < posicao; i += 1) {
      soma += Number(cpf[i]) * (posicao + 1 - i);
    }
    let digito = (soma * 10) % 11;
    if (digito === 10) digito = 0;
    if (digito !== Number(cpf[posicao])) return false;
  }

  return true;
}

function validarCnpj(cnpjInformado) {
  const cnpj = somenteNumeros(cnpjInformado);
  if (cnpj.length !== 14 || todosIguais(cnpj)) return false;

  const calcularDigito = (base, pesos) => {
    const soma = base
      .split("")
      .reduce((total, digito, indice) => total + Number(digito) * pesos[indice], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiro = calcularDigito(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundo = calcularDigito(`${cnpj.slice(0, 12)}${primeiro}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return cnpj.endsWith(`${primeiro}${segundo}`);
}

function obterEnderecoFiscalEmpresa(empresa = {}) {
  return empresa.enderecoFiscal || empresa.endereco || {};
}

function adicionarErro(erros, campo, mensagem, contexto = "") {
  erros.push({ campo, mensagem, contexto });
}

function validarEndereco(endereco, prefixo, erros, { exigirCep = true } = {}) {
  const end = endereco || {};
  const cep = somenteNumeros(end.cep);
  const codigoIbge = somenteNumeros(end.codigoMunicipioIbge || end.codigoIbge);
  const uf = texto(end.uf || end.estado).toUpperCase();

  if (!texto(end.logradouro || end.rua)) adicionarErro(erros, `${prefixo}.logradouro`, "Logradouro não informado.");
  if (!texto(end.numero)) adicionarErro(erros, `${prefixo}.numero`, "Número não informado. Use 'S/N' quando não existir número.");
  if (!texto(end.bairro)) adicionarErro(erros, `${prefixo}.bairro`, "Bairro não informado.");
  if (!texto(end.cidade || end.municipio)) adicionarErro(erros, `${prefixo}.cidade`, "Cidade não informada.");
  if (codigoIbge.length !== 7) adicionarErro(erros, `${prefixo}.codigoMunicipioIbge`, "Código IBGE do município deve possuir 7 dígitos.");
  if (!UFS.has(uf)) adicionarErro(erros, `${prefixo}.uf`, "UF inválida ou não informada.");
  if (exigirCep && cep.length !== 8) adicionarErro(erros, `${prefixo}.cep`, "CEP deve possuir 8 dígitos.");
}

function validarEmpresa(empresa, erros) {
  if (!empresa) {
    adicionarErro(erros, "empresa", "Empresa emissora não encontrada.");
    return;
  }

  const cnpj = somenteNumeros(empresa.cnpj || empresa.documento);
  const ie = somenteNumeros(empresa.inscricaoEstadual || empresa.ie);
  const crt = Number(empresa.crt || empresa.regimeTributarioCodigo);

  if (!texto(empresa.razaoSocial || empresa.nome)) adicionarErro(erros, "empresa.razaoSocial", "Razão social da empresa não informada.");
  if (!validarCnpj(cnpj)) adicionarErro(erros, "empresa.cnpj", "CNPJ da empresa emissora é inválido.");
  if (!ie) adicionarErro(erros, "empresa.inscricaoEstadual", "Inscrição Estadual da empresa não informada.");
  if (![1, 2, 3, 4].includes(crt)) adicionarErro(erros, "empresa.crt", "CRT deve ser 1, 2, 3 ou 4.");

  validarEndereco(obterEnderecoFiscalEmpresa(empresa), "empresa.enderecoFiscal", erros);
}

function validarDestinatario(destinatario, erros) {
  const dest = destinatario || {};
  const tipo = texto(dest.tipoPessoa).toLowerCase();
  const cpf = somenteNumeros(dest.cpf);
  const cnpj = somenteNumeros(dest.cnpj);
  const indicadorIe = Number(dest.indicadorIe ?? 9);

  if (!texto(dest.nomeRazaoSocial)) adicionarErro(erros, "destinatario.nomeRazaoSocial", "Nome ou razão social do destinatário não informado.");

  if (tipo === "juridica" || cnpj) {
    if (!validarCnpj(cnpj)) adicionarErro(erros, "destinatario.cnpj", "CNPJ do destinatário é inválido.");
  } else {
    if (!validarCpf(cpf)) adicionarErro(erros, "destinatario.cpf", "CPF do destinatário é inválido. Confira os 11 dígitos e os dígitos verificadores.");
  }

  if (![1, 2, 9].includes(indicadorIe)) {
    adicionarErro(erros, "destinatario.indicadorIe", "Indicador de IE deve ser 1 (contribuinte), 2 (isento) ou 9 (não contribuinte).");
  }

  if (indicadorIe === 1 && !somenteNumeros(dest.inscricaoEstadual)) {
    adicionarErro(erros, "destinatario.inscricaoEstadual", "Inscrição Estadual é obrigatória para destinatário contribuinte de ICMS.");
  }

  validarEndereco(dest.endereco, "destinatario.endereco", erros);
}

function validarItens(itens, erros) {
  if (!Array.isArray(itens) || itens.length === 0) {
    adicionarErro(erros, "itens", "A NF-e precisa possuir pelo menos um item.");
    return;
  }

  itens.forEach((item, indice) => {
    const numeroItem = indice + 1;
    const contexto = `Item ${numeroItem}${item?.descricao ? ` - ${item.descricao}` : ""}`;
    const prefixo = `itens.${indice}`;
    const ncm = somenteNumeros(item?.ncm);
    const cfop = somenteNumeros(item?.cfop);
    const cest = somenteNumeros(item?.cest);
    const quantidade = numero(item?.quantidadeComercial);
    const valorUnitario = numero(item?.valorUnitarioComercial);
    const valorProduto = numero(item?.valorProduto);

    if (!texto(item?.descricao)) adicionarErro(erros, `${prefixo}.descricao`, "Descrição do produto não informada.", contexto);
    if (ncm.length !== 8) adicionarErro(erros, `${prefixo}.ncm`, "NCM deve possuir exatamente 8 dígitos.", contexto);
    if (cfop.length !== 4) adicionarErro(erros, `${prefixo}.cfop`, "CFOP deve possuir exatamente 4 dígitos.", contexto);
    if (cest && cest.length !== 7) adicionarErro(erros, `${prefixo}.cest`, "CEST, quando informado, deve possuir 7 dígitos.", contexto);
    if (!texto(item?.unidadeComercial)) adicionarErro(erros, `${prefixo}.unidadeComercial`, "Unidade comercial não informada.", contexto);
    if (!Number.isFinite(quantidade) || quantidade <= 0) adicionarErro(erros, `${prefixo}.quantidadeComercial`, "Quantidade deve ser maior que zero.", contexto);
    if (!Number.isFinite(valorUnitario) || valorUnitario < 0) adicionarErro(erros, `${prefixo}.valorUnitarioComercial`, "Valor unitário inválido.", contexto);
    if (!Number.isFinite(valorProduto) || valorProduto < 0) adicionarErro(erros, `${prefixo}.valorProduto`, "Valor total do item inválido.", contexto);

    const csosn = somenteNumeros(item?.csosn);
    const cstIcms = somenteNumeros(item?.cstIcms);
    if (!csosn && !cstIcms) adicionarErro(erros, `${prefixo}.tributacaoIcms`, "Informe CSOSN ou CST do ICMS.", contexto);
  });
}

function validarTotais(totais, erros) {
  const t = totais || {};
  const produtos = numero(t.valorProdutos);
  const total = numero(t.valorTotal);
  const desconto = numero(t.valorDesconto || 0);

  if (!Number.isFinite(produtos) || produtos <= 0) adicionarErro(erros, "totais.valorProdutos", "Total dos produtos deve ser maior que zero.");
  if (!Number.isFinite(total) || total <= 0) adicionarErro(erros, "totais.valorTotal", "Valor total da NF-e deve ser maior que zero.");
  if (!Number.isFinite(desconto) || desconto < 0) adicionarErro(erros, "totais.valorDesconto", "Desconto não pode ser negativo.");
  if (Number.isFinite(produtos) && Number.isFinite(desconto) && desconto > produtos) adicionarErro(erros, "totais.valorDesconto", "Desconto não pode ser maior que o total dos produtos.");
}

function validarCertificado(erros) {
  const resultado = validarCertificadoA1();
  if (!resultado.valido) {
    adicionarErro(erros, "certificadoA1", resultado.message || "Certificado digital A1 inválido ou não configurado.");
    return;
  }

  const validoAte = resultado.validoAte ? new Date(resultado.validoAte) : null;
  if (validoAte && !Number.isNaN(validoAte.getTime()) && validoAte.getTime() < Date.now()) {
    adicionarErro(erros, "certificadoA1.validade", `Certificado digital expirou em ${validoAte.toLocaleDateString("pt-BR")}.`);
  }
}

function formatarMensagem(erros) {
  const linhas = erros.map((erro, indice) => {
    const contexto = erro.contexto ? `${erro.contexto}: ` : "";
    return `${indice + 1}. ${contexto}${erro.mensagem}`;
  });
  return `Não foi possível gerar a NF-e. Corrija os dados fiscais abaixo:\n${linhas.join("\n")}`;
}

class ErroValidacaoFiscal extends Error {
  constructor(erros) {
    super(formatarMensagem(erros));
    this.name = "ErroValidacaoFiscal";
    this.codigo = "VALIDACAO_FISCAL_FALHOU";
    this.statusCode = 422;
    this.erros = erros;
  }
}

function validarAntesDeGerarNfe({ empresa, destinatario, itens, totais, validarA1 = true }) {
  const erros = [];

  validarEmpresa(empresa, erros);
  validarDestinatario(destinatario, erros);
  validarItens(itens, erros);
  validarTotais(totais, erros);
  if (validarA1) validarCertificado(erros);

  if (erros.length) throw new ErroValidacaoFiscal(erros);

  return {
    valido: true,
    cpf: somenteNumeros(destinatario?.cpf),
    cnpjDestinatario: somenteNumeros(destinatario?.cnpj),
    cnpjEmitente: somenteNumeros(empresa?.cnpj || empresa?.documento),
  };
}

module.exports = {
  ErroValidacaoFiscal,
  somenteNumeros,
  validarCpf,
  validarCnpj,
  obterEnderecoFiscalEmpresa,
  validarAntesDeGerarNfe,
};
