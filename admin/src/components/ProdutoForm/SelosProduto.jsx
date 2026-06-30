function SelosProduto({ selos, setSelos }) {
  function alterar(campo, valor) {
    setSelos({
      ...selos,
      [campo]: valor,
    });
  }

  return (
    <div className="premium-box">
      <h3>Selos do Produto</h3>

      <div className="chips-premium">
        {[
          ["semGluten", "Sem Glúten"],
          ["zeroLactose", "Zero Lactose"],
          ["zeroAcucar", "Zero Açúcar"],
          ["lowCarb", "Low Carb"],
          ["vegano", "Vegano"],
          ["fit", "Fit"],
        ].map(([campo, label]) => (
          <label key={campo}>
            <input
              type="checkbox"
              checked={Boolean(selos[campo])}
              onChange={(e) => alterar(campo, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default SelosProduto;