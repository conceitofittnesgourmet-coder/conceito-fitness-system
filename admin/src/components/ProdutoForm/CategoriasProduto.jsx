function CategoriasProduto({
  categoria,
  setCategoria,
  categorias,
  setCategorias,
  categoriasDisponiveis,
}) {
  return (
    <div className="form-row-premium">
      <div className="field-premium">
        <label>Categoria *</label>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Selecione a categoria principal</option>

          {categoriasDisponiveis.map((cat) => (
            <option key={cat._id} value={cat.nome}>
              {cat.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="field-premium">
        <label>Categorias extras</label>

        <div className="chips-premium">
          {categoriasDisponiveis.map((cat) => (
            <label key={cat._id}>
              <input
                type="checkbox"
                checked={categorias
                  .split(",")
                  .map((c) => c.trim())
                  .includes(cat.nome)}
                onChange={(e) => {
                  const atuais = categorias
                    .split(",")
                    .map((c) => c.trim())
                    .filter(Boolean);

                  const novas = e.target.checked
                    ? [...atuais, cat.nome]
                    : atuais.filter((c) => c !== cat.nome);

                  setCategorias(novas.join(", "));
                }}
              />

              {cat.nome}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CategoriasProduto;
