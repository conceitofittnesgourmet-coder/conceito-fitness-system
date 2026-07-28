const {
  somenteNumeros,
  numeroComZeros,
  gerarChaveAcesso,
  getTpAmb,
  textoFiscal,
} = require("./documentoFiscalUtils");

const MODELO_NFE = "55";
const MODELO_NFCE = "65";
const AMBIENTE_HOMOLOGACAO = "homologacao";
const AMBIENTE_PRODUCAO = "producao";

function normalizarAmbiente(ambiente = AMBIENTE_HOMOLOGACAO) {
  return String(ambiente).trim().toLowerCase() === AMBIENTE_PRODUCAO
    ? AMBIENTE_PRODUCAO
    : AMBIENTE_HOMOLOGACAO;
}

function normalizarModelo(modelo) {
  const modeloNormalizado = numeroComZeros(somenteNumeros(modelo), 2);

  if (![MODELO_NFE, MODELO_NFCE].includes(modeloNormalizado)) {
    throw new Error(
      `Modelo fiscal ${modeloNormalizado || "não informado"} não suportado.`
    );
  }

  return modeloNormalizado;
}

function validarNumeracaoFiscal({ numero, serie }) {
  const numeroNormalizado = Number(numero);
  const serieNormalizada = Number(serie);

  if (!Number.isInteger(numeroNormalizado) || numeroNormalizado <= 0) {
    throw new Error("Número do documento fiscal inválido.");
  }

  if (!Number.isInteger(serieNormalizada) || serieNormalizada <= 0) {
    throw new Error("Série do documento fiscal inválida.");
  }

  if (numeroNormalizado > 999999999) {
    throw new Error("O número do documento fiscal excede nove dígitos.");
  }

  if (serieNormalizada > 999) {
    throw new Error("A série do documento fiscal excede três dígitos.");
  }

  return {
    numero: numeroNormalizado,
    serie: serieNormalizada,
  };
}

function validarEmitenteFiscal(empresa = {}) {
  const cnpj = somenteNumeros(
    empresa.cnpj || empresa.cpfCnpj || empresa.documento || ""
  );

  const codigoUf = somenteNumeros(
    empresa.codigoUf || empresa.cUF || empresa.ufCodigo || ""
  );

  if (cnpj.length !== 14) {
    throw new Error("CNPJ do emitente inválido ou não informado.");
  }

  if (codigoUf.length !== 2) {
    throw new Error("Código da UF do emitente inválido ou não informado.");
  }

  return {
    ...empresa,
    cnpj,
    codigoUf,
    razaoSocial: textoFiscal(
      empresa.razaoSocial || empresa.nomeEmpresarial || empresa.nome,
      "EMITENTE NÃO INFORMADO"
    ),
    nomeFantasia: textoFiscal(
      empresa.nomeFantasia || empresa.fantasia || empresa.nome,
      ""
    ),
    inscricaoEstadual: somenteNumeros(
      empresa.inscricaoEstadual || empresa.ie || ""
    ),
  };
}

function criarIdentificacaoDocumentoFiscal({
  empresa,
  modelo,
  numero,
  serie,
  ambiente = AMBIENTE_HOMOLOGACAO,
  tipoEmissao = 1,
  codigoNumerico,
  dataEmissao = new Date(),
}) {
  const emitente = validarEmitenteFiscal(empresa);
  const modeloNormalizado = normalizarModelo(modelo);
  const numeracao = validarNumeracaoFiscal({ numero, serie });
  const ambienteNormalizado = normalizarAmbiente(ambiente);

  const chaveDados = gerarChaveAcesso({
    codigoUf: emitente.codigoUf,
    cnpj: emitente.cnpj,
    modelo: modeloNormalizado,
    serie: numeracao.serie,
    numero: numeracao.numero,
    tipoEmissao,
    codigoNumerico,
    dataEmissao,
  });

  return {
    modelo: modeloNormalizado,
    numero: numeracao.numero,
    serie: numeracao.serie,
    ambiente: ambienteNormalizado,
    tpAmb: getTpAmb(ambienteNormalizado),
    tipoEmissao: Number(tipoEmissao),
    dataEmissao,
    emitente,
    chaveDados,
    chaveAcesso: chaveDados.chave,
    idDocumento: `NFe${chaveDados.chave}`,
  };
}

function criarIdentificacaoNfce(dados = {}) {
  return criarIdentificacaoDocumentoFiscal({
    ...dados,
    modelo: MODELO_NFCE,
  });
}

function criarIdentificacaoNfe(dados = {}) {
  return criarIdentificacaoDocumentoFiscal({
    ...dados,
    modelo: MODELO_NFE,
  });
}

module.exports = {
  MODELO_NFE,
  MODELO_NFCE,
  AMBIENTE_HOMOLOGACAO,
  AMBIENTE_PRODUCAO,
  normalizarAmbiente,
  normalizarModelo,
  validarNumeracaoFiscal,
  validarEmitenteFiscal,
  criarIdentificacaoDocumentoFiscal,
  criarIdentificacaoNfce,
  criarIdentificacaoNfe,
};
 