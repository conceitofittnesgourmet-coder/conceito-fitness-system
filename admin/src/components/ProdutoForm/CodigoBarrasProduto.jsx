function CodigoBarrasProduto({
  codigoBarras,
  setCodigoBarras,
  sku,
  setSku,
}) {
  return (
    <>
      <div className="field-premium">
        <label>Código de Barras</label>
        <input
          placeholder="Ex.: 7891234567890"
          value={codigoBarras}
          onChange={(e) => setCodigoBarras(e.target.value)}
        />
      </div>

      <div className="field-premium">
        <label>SKU / Código Interno</label>
        <input
          placeholder="Ex.: BOLO-CHOC-001"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
        />
      </div>
    </>
  );
}

export default CodigoBarrasProduto;
