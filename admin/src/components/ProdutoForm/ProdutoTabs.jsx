function ProdutoTabs({ abaCadastro, setAbaCadastro }) {
  const abas = [
    ["basico", "1. Básico"],
    ["venda", "2. Venda"],
    ["cardapio", "3. Cardápio"],
    ["nutricional", "4. Nutricional"],
    ["imagem", "5. Imagem"],
  ];

  return (
    <div className="produto-tabs">
      {abas.map(([id, label]) => (
        <button
          key={id}
          className={abaCadastro === id ? "active" : ""}
          onClick={() => setAbaCadastro(id)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default ProdutoTabs;