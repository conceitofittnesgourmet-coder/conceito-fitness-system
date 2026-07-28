const crypto = require("crypto");

/**
 * Mantém somente os caracteres numéricos.
 */
function somenteNumeros(valor = "") {
  return String(valor || "").replace(/\D/g, "");
}

/**
 * Completa um valor numérico com zeros à esquerda.
 */
function numeroComZeros(numero, tamanho) {
  return String(numero ?? "").padStart(tamanho, "0");
}

/**
 * Escapa caracteres reservados para utilização segura no XML.
 */
function escapeXml(valor = "") {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Remove declaração XML, BOM e espaços desnecessários entre tags.
 */
function limparXmlParaSefaz(xml = "") {
  return String(xml || "")
    .replace(/^\uFEFF/, "")
    .replace(/<\?xml[^>]*\?>/gi, "")
    .replace(/>\s+</g, "><")
    .trim();
}

/**
 * Extrai o conteúdo da primeira ocorrência de uma tag XML.
 *
 * Esta função é adequada para campos simples, como DigestValue,
 * dhEmi, cStat e nProt. Não substitui um parser XML completo.
 */
function extrairTagXml(xml = "", tag = "") {
  if (!tag) {
    return "";
  }

  const tagEscapada = String(tag).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const expressao = new RegExp(
    `<${tagEscapada}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagEscapada}>`,
    "i"
  );

  const resultado = String(xml || "").match(expressao);

  return resultado ? resultado[1] : "";
}

/**
 * Formata a data atual no padrão esperado pela SEFAZ:
 *
 * AAAA-MM-DDTHH:mm:ss-03:00
 */
function formatarDataHoraSaoPaulo(data = new Date()) {
  const dataValida = data instanceof Date ? data : new Date(data);

  if (Number.isNaN(dataValida.getTime())) {
    throw new Error("Data inválida para geração do documento fiscal.");
  }

  return (
    dataValida
      .toLocaleString("sv-SE", {
        timeZone: "America/Sao_Paulo",
        hour12: false,
      })
      .replace(" ", "T") + "-03:00"
  );
}

/**
 * Calcula o dígito verificador da chave de acesso.
 *
 * Recebe os primeiros 43 dígitos da chave.
 */
function calcularDV(chave43) {
  const chave = somenteNumeros(chave43);

  if (chave.length !== 43) {
    throw new Error(
      `A chave-base deve possuir 43 dígitos. Foram recebidos ${chave.length}.`
    );
  }

  const pesos = [2, 3, 4, 5, 6, 7, 8, 9];

  let soma = 0;
  let indicePeso = 0;

  for (let indice = chave.length - 1; indice >= 0; indice -= 1) {
    soma += Number(chave[indice]) * pesos[indicePeso];

    indicePeso =
      indicePeso + 1 >= pesos.length
        ? 0
        : indicePeso + 1;
  }

  const resto = soma % 11;
  const digito = 11 - resto;

  return digito === 10 || digito === 11
    ? 0
    : digito;
}

/**
 * Gera o código numérico de oito dígitos da NF-e/NFC-e.
 *
 * Usa crypto.randomInt para evitar a previsibilidade do Math.random.
 */
function gerarCodigoNumerico() {
  return String(
    crypto.randomInt(10000000, 100000000)
  );
}

/**
 * Gera a chave de acesso para NF-e modelo 55 ou NFC-e modelo 65.
 *
 * Estrutura:
 *
 * cUF + AAMM + CNPJ + modelo + série + número +
 * tipo de emissão + código numérico + DV
 */
function gerarChaveAcesso({
  codigoUf,
  cnpj,
  modelo,
  serie,
  numero,
  tipoEmissao = 1,
  codigoNumerico,
  dataEmissao = new Date(),
}) {
  const cUfNormalizado = numeroComZeros(
    somenteNumeros(codigoUf),
    2
  );

  const cnpjNormalizado = numeroComZeros(
    somenteNumeros(cnpj),
    14
  );

  const modeloNormalizado = numeroComZeros(
    somenteNumeros(modelo),
    2
  );

  const serieNormalizada = numeroComZeros(
    somenteNumeros(serie),
    3
  );

  const numeroNormalizado = numeroComZeros(
    somenteNumeros(numero),
    9
  );

  const tipoEmissaoNormalizado = somenteNumeros(
    tipoEmissao
  );

  const data = dataEmissao instanceof Date
    ? dataEmissao
    : new Date(dataEmissao);

  if (Number.isNaN(data.getTime())) {
    throw new Error(
      "Data de emissão inválida para geração da chave de acesso."
    );
  }

  if (cUfNormalizado.length !== 2) {
    throw new Error("Código da UF inválido.");
  }

  if (cnpjNormalizado.length !== 14) {
    throw new Error("CNPJ do emitente inválido.");
  }

  if (!["55", "65"].includes(modeloNormalizado)) {
    throw new Error(
      `Modelo fiscal ${modeloNormalizado} não suportado.`
    );
  }

  if (tipoEmissaoNormalizado.length !== 1) {
    throw new Error("Tipo de emissão inválido.");
  }

  const ano = String(data.getFullYear()).slice(-2);
  const mes = numeroComZeros(data.getMonth() + 1, 2);
  const aamm = `${ano}${mes}`;

  const cNF = numeroComZeros(
    somenteNumeros(
      codigoNumerico || gerarCodigoNumerico()
    ),
    8
  );

  if (cNF.length !== 8) {
    throw new Error(
      "O código numérico da chave deve possuir oito dígitos."
    );
  }

  const chave43 =
    cUfNormalizado +
    aamm +
    cnpjNormalizado +
    modeloNormalizado +
    serieNormalizada +
    numeroNormalizado +
    tipoEmissaoNormalizado +
    cNF;

  const dv = calcularDV(chave43);

  return {
    chave: `${chave43}${dv}`,
    chave43,
    cUF: cUfNormalizado,
    aamm,
    cNF,
    dv,
    modelo: modeloNormalizado,
    serie: Number(serie),
    numero: Number(numero),
    tipoEmissao: Number(tipoEmissao),
  };
}

/**
 * Retorna o código numérico do ambiente fiscal.
 *
 * 1 = produção
 * 2 = homologação
 */
function getTpAmb(ambiente = "homologacao") {
  return String(ambiente).toLowerCase() === "producao"
    ? "1"
    : "2";
}

/**
 * Normaliza um campo textual fiscal.
 */
function textoFiscal(valor, padrao = "") {
  const texto = String(valor ?? "").trim();

  return texto || padrao;
}

/**
 * Converte um campo fiscal para número.
 *
 * Aceita valores como:
 *
 * 10
 * "10"
 * "10,50"
 * "1.250,50"
 */
function numeroFiscal(valor, padrao = 0) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return padrao;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor)
      ? valor
      : padrao;
  }

  const texto = String(valor).trim();

  let normalizado = texto;

  if (
    texto.includes(".") &&
    texto.includes(",")
  ) {
    normalizado = texto
      .replace(/\./g, "")
      .replace(",", ".");
  } else if (texto.includes(",")) {
    normalizado = texto.replace(",", ".");
  }

  const numero = Number(normalizado);

  return Number.isFinite(numero)
    ? numero
    : padrao;
}

/**
 * Valida o código GTIN utilizado no XML.
 *
 * Quando não houver um GTIN válido, retorna SEM GTIN.
 */
function validarGtin(gtin = "") {
  const codigo = somenteNumeros(gtin);

  if (![8, 12, 13, 14].includes(codigo.length)) {
    return "SEM GTIN";
  }

  return codigo;
}

/**
 * Converte uma data retornada pela SEFAZ para Date.
 *
 * Retorna undefined quando o valor estiver vazio ou inválido.
 */
function converterDataSefaz(valor) {
  if (!valor) {
    return undefined;
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return undefined;
  }

  return data;
}

module.exports = {
  somenteNumeros,
  numeroComZeros,
  escapeXml,
  limparXmlParaSefaz,
  extrairTagXml,
  formatarDataHoraSaoPaulo,
  calcularDV,
  gerarCodigoNumerico,
  gerarChaveAcesso,
  getTpAmb,
  textoFiscal,
  numeroFiscal,
  validarGtin,
  converterDataSefaz,
};