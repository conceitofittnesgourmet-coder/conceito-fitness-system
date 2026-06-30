function ConstrutorUniversalProduto({
  gruposComponentes,
  gruposSelecionados,
  setGruposSelecionados,
}) {
  return (
    <div className="premium-box">
      <h3>Construtor Universal</h3>

      <p>Este produto utiliza quais grupos de componentes?</p>

      <div className="chips-premium">
        {gruposComponentes.map((grupo) => (
          <label key={grupo._id}>
            <input
              type="checkbox"
              checked={gruposSelecionados.includes(grupo._id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setGruposSelecionados([...gruposSelecionados, grupo._id]);
                } else {
                  setGruposSelecionados(
                    gruposSelecionados.filter((id) => id !== grupo._id)
                  );
                }
              }}
            />

            {grupo.nome}
          </label>
        ))}
      </div>
    </div>
  );
}

export default ConstrutorUniversalProduto;
