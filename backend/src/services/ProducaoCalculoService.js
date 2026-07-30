const FATORES = {
  kg: { base: "massa", fator: 1000 },
  g: { base: "massa", fator: 1 },
  litro: { base: "volume", fator: 1000 },
  l: { base: "volume", fator: 1000 },
  ml: { base: "volume", fator: 1 },
  unidade: { base: "unidade", fator: 1 },
  un: { base: "unidade", fator: 1 },
  pacote: { base: "pacote", fator: 1 },
  caixa: { base: "caixa", fator: 1 },
};

function criarErro(mensagem, statusCode = 400) {
  const error = new Error(mensagem);
  error.statusCode = statusCode;
  return error;
}

function arredondar(valor, casas = 6) {
  const fator = 10 ** casas;
  return Math.round((Number(valor) + Number.EPSILON) * fator) / fator;
}

function converter(quantidade, unidadeOrigem, unidadeDestino) {
  const origem = FATORES[String(unidadeOrigem || "unidade").toLowerCase()];
  const destino = FATORES[String(unidadeDestino || "unidade").toLowerCase()];

  if (!origem || !destino || origem.base !== destino.base) {
    throw criarErro("Conversão incompatível na ficha técnica.");
  }

  return arredondar(Number(quantidade) * origem.fator / destino.fator);
}

module.exports = { FATORES, arredondar, converter, criarErro };
