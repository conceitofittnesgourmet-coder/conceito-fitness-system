const { escapeXml } = require("../documentoFiscalUtils");

function montarXmlIcms(fiscal) {
  return `
    <ICMS>
      <ICMSSN102>
        <orig>${escapeXml(fiscal.origem)}</orig>
        <CSOSN>${escapeXml(fiscal.csosn)}</CSOSN>
      </ICMSSN102>
    </ICMS>`;
}

function montarXmlPis(fiscal, valorProduto) {
  const cst = fiscal.cstPis || "99";
  const aliquota = Number(fiscal.aliquotaPis || 0);
  const valorPis = valorProduto * (aliquota / 100);

  if (["04", "05", "06", "07", "08", "09"].includes(cst)) {
    return `
      <PIS>
        <PISNT>
          <CST>${cst}</CST>
        </PISNT>
      </PIS>`;
  }

  if (["01", "02"].includes(cst)) {
    return `
      <PIS>
        <PISAliq>
          <CST>${cst}</CST>
          <vBC>${valorProduto.toFixed(2)}</vBC>
          <pPIS>${aliquota.toFixed(4)}</pPIS>
          <vPIS>${valorPis.toFixed(2)}</vPIS>
        </PISAliq>
      </PIS>`;
  }

  return `
    <PIS>
      <PISOutr>
        <CST>${cst}</CST>
        <vBC>${valorProduto.toFixed(2)}</vBC>
        <pPIS>${aliquota.toFixed(4)}</pPIS>
        <vPIS>${valorPis.toFixed(2)}</vPIS>
      </PISOutr>
    </PIS>`;
}

function montarXmlCofins(fiscal, valorProduto) {
  const cst = fiscal.cstCofins || "99";
  const aliquota = Number(fiscal.aliquotaCofins || 0);
  const valorCofins = valorProduto * (aliquota / 100);

  if (["04", "05", "06", "07", "08", "09"].includes(cst)) {
    return `
      <COFINS>
        <COFINSNT>
          <CST>${cst}</CST>
        </COFINSNT>
      </COFINS>`;
  }

  if (["01", "02"].includes(cst)) {
    return `
      <COFINS>
        <COFINSAliq>
          <CST>${cst}</CST>
          <vBC>${valorProduto.toFixed(2)}</vBC>
          <pCOFINS>${aliquota.toFixed(4)}</pCOFINS>
          <vCOFINS>${valorCofins.toFixed(2)}</vCOFINS>
        </COFINSAliq>
      </COFINS>`;
  }

  return `
    <COFINS>
      <COFINSOutr>
        <CST>${cst}</CST>
        <vBC>${valorProduto.toFixed(2)}</vBC>
        <pCOFINS>${aliquota.toFixed(4)}</pCOFINS>
        <vCOFINS>${valorCofins.toFixed(2)}</vCOFINS>
      </COFINSOutr>
    </COFINS>`;
}

function montarXmlImpostosItem(fiscal, valorProduto) {
  return `${montarXmlIcms(fiscal)}${montarXmlPis(
    fiscal,
    valorProduto
  )}${montarXmlCofins(fiscal, valorProduto)}`;
}

module.exports = {
  montarXmlIcms,
  montarXmlPis,
  montarXmlCofins,
  montarXmlImpostosItem,
};
