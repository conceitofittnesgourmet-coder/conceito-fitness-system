function DadosNutricionaisProduto({ dados, setDados }) {
  function alterar(campo, valor) {
    setDados({
      ...dados,
      [campo]: valor,
    });
  }

  return (
    <div className="premium-box">
      <h3>Informações Nutricionais</h3>

      <div className="mini-grid">
        <div className="field-premium">
          <label>Calorias</label>
          <input value={dados.calorias} onChange={(e) => alterar("calorias", e.target.value)} />
        </div>

        <div className="field-premium">
          <label>Proteínas</label>
          <input value={dados.proteinas} onChange={(e) => alterar("proteinas", e.target.value)} />
        </div>

        <div className="field-premium">
          <label>Carboidratos</label>
          <input value={dados.carboidratos} onChange={(e) => alterar("carboidratos", e.target.value)} />
        </div>

        <div className="field-premium">
          <label>Gorduras</label>
          <input value={dados.gorduras} onChange={(e) => alterar("gorduras", e.target.value)} />
        </div>

        <div className="field-premium">
          <label>Fibras</label>
          <input value={dados.fibras} onChange={(e) => alterar("fibras", e.target.value)} />
        </div>

        <div className="field-premium">
          <label>Sódio</label>
          <input value={dados.sodio} onChange={(e) => alterar("sodio", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

export default DadosNutricionaisProduto;