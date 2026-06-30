function UnidadeVendaProduto({
  unidadeMedida,
  setUnidadeMedida,
  vendaPorPeso,
  setVendaPorPeso,
  permiteFracionado,
  setPermiteFracionado,
}) {
  return (
    <>
      <div className="field-premium">
        <label>Unidade de Medida</label>

        <select
          value={unidadeMedida}
          onChange={(e) => setUnidadeMedida(e.target.value)}
        >
          <option value="UN">Unidade</option>
          <option value="KG">Quilo</option>
          <option value="G">Grama</option>
          <option value="L">Litro</option>
          <option value="ML">Mililitro</option>
          <option value="PACOTE">Pacote</option>
          <option value="FARDO">Fardo</option>
          <option value="CAIXA">Caixa</option>
        </select>
      </div>

      <label className="premium-switch">
        <div>
          <strong>Venda por peso</strong>
          <span>Ex.: bolo vendido por kg</span>
        </div>

        <input
          type="checkbox"
          checked={vendaPorPeso}
          onChange={(e) => setVendaPorPeso(e.target.checked)}
        />
      </label>

      <label className="premium-switch">
        <div>
          <strong>Permitir fracionado</strong>
          <span>Ex.: 1,375 kg</span>
        </div>

        <input
          type="checkbox"
          checked={permiteFracionado}
          onChange={(e) => setPermiteFracionado(e.target.checked)}
        />
      </label>
    </>
  );
}

export default UnidadeVendaProduto;
