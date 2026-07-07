import CategoriasProduto from "./CategoriasProduto";

function ProdutoBasico({
  nome,
  setNome,
  categoria,
  setCategoria,
  categorias,
  setCategorias,
  categoriasDisponiveis,
  descricao,
  setDescricao,
}) {
  return (
    <div className="produto-aba-card">
      <div className="form-row-premium">
        <div className="field-premium">
          <label>Nome do produto *</label>
          <input
            placeholder="Ex.: Bolo de Cacau 100%"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
      </div>

      <CategoriasProduto
        categoria={categoria}
        setCategoria={setCategoria}
        categorias={categorias}
        setCategorias={setCategorias}
        categoriasDisponiveis={categoriasDisponiveis}
      />

      <div className="field-premium full">
        <label>Descrição do produto</label>
        <textarea
          placeholder="Descreva os ingredientes, benefícios e diferenciais..."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>
    </div>
  );
}

export default ProdutoBasico;