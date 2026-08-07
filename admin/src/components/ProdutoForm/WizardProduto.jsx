function WizardProduto({
  tipoWizard,
  setTipoWizard,
  templatesProduto,
  gruposComponentes,
  setGruposSelecionados,
  setUnidadeMedida,
  setVendaPorPeso,
  setPermiteFracionado,
  setTipoProduto,
  setAbaCadastro,
}) {
  const tipos = [
    ["simples", "📦", "Produto simples"],
    ["bolo", "🎂", "Bolo / Naked Cake"],
    ["torta", "🥧", "Torta"],
    ["cafe", "☕", "Café / Bebida"],
    ["combo", "🥪", "Combo"],
    ["kit", "🎁", "Kit"],
    ["cesta", "🧺", "Cesta"],
    ["peso", "⚖️", "Produto por peso"],
  ];

  function selecionarTipo(id) {
    setTipoWizard(id);

    const nomesTemplate = templatesProduto[id] || [];

    const gruposDoTemplate = gruposComponentes
      .filter((grupo) =>
        nomesTemplate.some((nomeTemplate) =>
          grupo.nome?.toLowerCase().includes(nomeTemplate.toLowerCase())
        )
      )
      .map((grupo) => grupo._id);

    setGruposSelecionados(gruposDoTemplate);

    if (id === "peso") {
      setUnidadeMedida("KG");
      setVendaPorPeso(true);
      setPermiteFracionado(true);
      setAbaCadastro("venda");
    }

    if (["bolo", "torta", "combo", "kit", "cesta"].includes(id)) {
      setTipoProduto("producao");
      setAbaCadastro("producao");
    }

    if (id === "cafe") {
      setUnidadeMedida("UN");
      setAbaCadastro("cardapio");
    }

    if (id === "simples") {
      setAbaCadastro("basico");
    }
  }

  return (
    <div className="produto-wizard">
      <div className="produto-wizard-header">
        <div>
          <span>Assistente de Cadastro</span>
          <h3>Que tipo de produto você está cadastrando?</h3>
          <p>O sistema vai organizar os campos conforme o tipo escolhido.</p>
        </div>
      </div>

      <div className="produto-wizard-grid">
        {tipos.map(([id, emoji, label]) => (
          <button
            key={id}
            type="button"
            className={tipoWizard === id ? "active" : ""}
            onClick={() => selecionarTipo(id)}
          >
            <strong>{emoji}</strong>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default WizardProduto;