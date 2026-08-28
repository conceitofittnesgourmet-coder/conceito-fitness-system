const {
  somenteNumeros,
  escapeXml,
  textoFiscal,
  numeroFiscal,
  validarGtin,
} = require("../documentoFiscalUtils");

const { montarXmlImpostosItem } = require("./impostosBuilder");

function getProdutoNomeFiscal(nome, index, ambiente) {
  if (ambiente !== "producao" && index === 0) {
    return "NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL";
  }

  return String(nome || "Produto").trim() || "Produto";
}

function obterDadosFiscaisItem(item = {}) {
  const fiscal = item.dadosFiscais || {};

  return {
    ncm: somenteNumeros(fiscal.ncm || item.ncm || ""),
    cest: somenteNumeros(fiscal.cest || item.cest || ""),
    origem: textoFiscal(
      fiscal.origemMercadoria || fiscal.origem || item.origem || "0",
      "0"
    ),
    cfop: somenteNumeros(fiscal.cfopInterno || fiscal.cfop || item.cfop || ""),
    csosn: somenteNumeros(fiscal.csosn || item.csosn || ""),
    cstIcms: somenteNumeros(
      fiscal.cstIcms || fiscal.cst || item.cstIcms || ""
    ),
    codigoBeneficioFiscal: textoFiscal(
      fiscal.codigoBeneficioFiscal || fiscal.cBenef || ""
    ),
    gtin: somenteNumeros(
      fiscal.gtin || item.codigoBarras || item.gtin || ""
    ),
    gtinTributavel: somenteNumeros(
      fiscal.gtinTributavel ||
        fiscal.gtinTrib ||
        fiscal.gtin ||
        item.codigoBarras ||
        ""
    ),
    unidadeComercial: textoFiscal(
      fiscal.unidadeComercial || item.unidadeMedida || item.unidade || "UN",
      "UN"
    ).toUpperCase(),
    unidadeTributavel: textoFiscal(
      fiscal.unidadeTributavel ||
        fiscal.unidadeComercial ||
        item.unidadeMedida ||
        item.unidade ||
        "UN",
      "UN"
    ).toUpperCase(),
    cstPis: somenteNumeros(
      fiscal.cstPis || fiscal.pis?.cst || item.cstPis || "99"
    ),
    aliquotaPis: numeroFiscal(
      fiscal.aliquotaPis ?? fiscal.pis?.aliquota,
      0
    ),
    cstCofins: somenteNumeros(
      fiscal.cstCofins || fiscal.cofins?.cst || item.cstCofins || "99"
    ),
    aliquotaCofins: numeroFiscal(
      fiscal.aliquotaCofins ?? fiscal.cofins?.aliquota,
      0
    ),
    produtoTributavel: fiscal.produtoTributavel !== false,
    emitirNfce: fiscal.emitirNfce !== false,
  };
}

function validarDadosFiscaisItem(fiscal, item, index) {
  const nomeProduto = item.nome || `Item ${index + 1}`;

  if (!fiscal.emitirNfce) {
    throw new Error(`O produto "${nomeProduto}" está marcado para não emitir NFC-e.`);
  }

  if (!fiscal.produtoTributavel) {
    throw new Error(`O produto "${nomeProduto}" não está configurado como tributável.`);
  }

  if (fiscal.ncm.length !== 8) {
    throw new Error(`NCM inválido ou não informado no produto "${nomeProduto}".`);
  }

  if (fiscal.cfop.length !== 4) {
    throw new Error(`CFOP inválido ou não informado no produto "${nomeProduto}".`);
  }

  if (!fiscal.csosn) {
    throw new Error(`CSOSN não informado no produto "${nomeProduto}".`);
  }

  const csosnSuportados = ["102"];

  if (!csosnSuportados.includes(fiscal.csosn)) {
    throw new Error(
      `O CSOSN ${fiscal.csosn} do produto "${nomeProduto}" ainda não possui grupo XML implementado.`
    );
  }
}

function montarItensXml(
  produtos = [],
  ambiente,
  valorFreteTotal = 0
) {
  if (!Array.isArray(produtos) || produtos.length === 0) {
    throw new Error(
      "Pedido sem produtos para emissão da NFC-e."
    );
  }

  const freteTotal = Math.max(
    0,
    Number(valorFreteTotal || 0)
  );

  /*
   * Primeiro calculamos o valor total dos produtos
   * para fazer o rateio proporcional do frete.
   */
  const valoresProdutos = produtos.map((item) => {
    const quantidade =
      Number(item.quantidade || 1);

    const precoUnitario = Number(
      item.precoUnitario ||
      item.preco ||
      item.valorUnitario ||
      0
    );

    return item.subtotal !== undefined
      ? Number(item.subtotal || 0)
      : quantidade * precoUnitario;
  });

  const totalProdutos = valoresProdutos.reduce(
    (soma, valor) =>
      soma + Number(valor || 0),
    0
  );

  let freteDistribuido = 0;

  return produtos
    .map((item, index) => {
      const fiscal =
        obterDadosFiscaisItem(item);

      validarDadosFiscaisItem(
        fiscal,
        item,
        index
      );

      const quantidade =
        Number(item.quantidade || 1);

      const precoUnitario = Number(
        item.precoUnitario ||
        item.preco ||
        item.valorUnitario ||
        0
      );

      const valorProduto =
        valoresProdutos[index];

      if (
        !Number.isFinite(quantidade) ||
        quantidade <= 0
      ) {
        throw new Error(
          `Quantidade inválida no item ${index + 1}.`
        );
      }

      if (
        !Number.isFinite(precoUnitario) ||
        precoUnitario <= 0
      ) {
        throw new Error(
          `Preço inválido no item ${index + 1}.`
        );
      }

      if (
        !Number.isFinite(valorProduto) ||
        valorProduto <= 0
      ) {
        throw new Error(
          `Subtotal inválido no item ${index + 1}.`
        );
      }

      /*
       * Rateio proporcional do frete.
       *
       * O último item recebe o resíduo dos
       * arredondamentos para garantir que:
       *
       * soma(vFrete dos itens) === vFrete total.
       */
      let valorFreteItem = 0;

      if (
        freteTotal > 0 &&
        totalProdutos > 0
      ) {
        const ultimoItem =
          index === produtos.length - 1;

        if (ultimoItem) {
          valorFreteItem =
            Number(
              (
                freteTotal -
                freteDistribuido
              ).toFixed(2)
            );
        } else {
          valorFreteItem =
            Number(
              (
                freteTotal *
                (
                  valorProduto /
                  totalProdutos
                )
              ).toFixed(2)
            );

          freteDistribuido +=
            valorFreteItem;
        }
      }

      const codigoProduto =
        item.sku ||
        item.codigoBarras ||
        item.produtoId ||
        item._id ||
        index + 1;

      const cEAN =
        validarGtin(fiscal.gtin);

      const cEANTrib =
        validarGtin(
          fiscal.gtinTributavel
        );

      const cestXml =
        fiscal.cest
          ? `<CEST>${escapeXml(
              fiscal.cest
            )}</CEST>`
          : "";

      const beneficioXml =
        fiscal.codigoBeneficioFiscal
          ? `<cBenef>${escapeXml(
              fiscal.codigoBeneficioFiscal
            )}</cBenef>`
          : "";

      const freteXml =
        valorFreteItem > 0
          ? `<vFrete>${valorFreteItem.toFixed(
              2
            )}</vFrete>`
          : "";

      return `
      <det nItem="${index + 1}">
        <prod>
          <cProd>${escapeXml(
            codigoProduto
          )}</cProd>

          <cEAN>${cEAN}</cEAN>

          <xProd>${escapeXml(
            getProdutoNomeFiscal(
              item.nome,
              index,
              ambiente
            )
          )}</xProd>

          <NCM>${escapeXml(
            fiscal.ncm
          )}</NCM>

          ${cestXml}
          ${beneficioXml}

          <CFOP>${escapeXml(
            fiscal.cfop
          )}</CFOP>

          <uCom>${escapeXml(
            fiscal.unidadeComercial
          )}</uCom>

          <qCom>${quantidade.toFixed(
            4
          )}</qCom>

          <vUnCom>${precoUnitario.toFixed(
            10
          )}</vUnCom>

          <vProd>${valorProduto.toFixed(
            2
          )}</vProd>

          ${freteXml}

          <cEANTrib>${cEANTrib}</cEANTrib>

          <uTrib>${escapeXml(
            fiscal.unidadeTributavel
          )}</uTrib>

          <qTrib>${quantidade.toFixed(
            4
          )}</qTrib>

          <vUnTrib>${precoUnitario.toFixed(
            10
          )}</vUnTrib>

          <indTot>1</indTot>
        </prod>

        <imposto>
          ${montarXmlImpostosItem(
            fiscal,
            valorProduto
          )}
        </imposto>
      </det>`;
    })
    .join("");
}

module.exports = {
  getProdutoNomeFiscal,
  obterDadosFiscaisItem,
  validarDadosFiscaisItem,
  montarItensXml,
};
