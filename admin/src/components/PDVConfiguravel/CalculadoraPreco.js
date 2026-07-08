export function calcularPrecoConfigurado(produto, escolhas = []) {
  const precoBase = Number(produto?.preco || 0);

  const adicionais = escolhas.reduce((acc, item) => {
    return acc + Number(item.valor || 0);
  }, 0);

  return {
    precoBase,
    adicionais,
    precoFinal: precoBase + adicionais,
  };
}