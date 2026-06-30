function AlergenosProduto({ alergenos, setAlergenos }) {
  function alterar(campo, valor) {
    setAlergenos({
      ...alergenos,
      [campo]: valor,
    });
  }

  return (
    <div className="premium-box">
      <h3>Alérgenos</h3>

      <div className="chips-premium">
        {[
          ["contemLeite", "Contém leite"],
          ["contemOvos", "Contém ovos"],
          ["contemSoja", "Contém soja"],
          ["contemCastanhas", "Contém castanhas"],
          ["contemAmendoim", "Contém amendoim"],
          ["contemGluten", "Contém glúten"],
        ].map(([campo, label]) => (
          <label key={campo}>
            <input
              type="checkbox"
              checked={Boolean(alergenos[campo])}
              onChange={(e) => alterar(campo, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default AlergenosProduto;