function ConstrutorUniversalProduto({
  gruposComponentes = [],
  gruposSelecionados = [],
  setGruposSelecionados,
}) {
  const gruposAtivos = gruposComponentes
    .filter((grupo) => grupo.ativo !== false)
    .sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0));

  const selecionados = gruposAtivos.filter((grupo) =>
    gruposSelecionados.includes(grupo._id)
  );

  function alternarGrupo(grupoId, marcado) {
    if (marcado) {
      setGruposSelecionados([...gruposSelecionados, grupoId]);
      return;
    }

    setGruposSelecionados(
      gruposSelecionados.filter((id) => id !== grupoId)
    );
  }

  return (
    <div className="produto-construtor-enterprise">
      <div className="construtor-header">
        <div>
          <h3>Construtor Universal</h3>
          <p>
            Monte produtos configuráveis com tamanhos, sabores, recheios,
            coberturas, adicionais, kits, combos e cestas.
          </p>
        </div>

        <strong>{selecionados.length} grupo(s)</strong>
      </div>

      <div className="construtor-grid">
        <div className="construtor-lista">
          {gruposAtivos.map((grupo) => {
            const ativo = gruposSelecionados.includes(grupo._id);

            return (
              <label
                key={grupo._id}
                className={`grupo-config-card ${ativo ? "active" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => alternarGrupo(grupo._id, e.target.checked)}
                />

                <div>
                  <strong>{grupo.nome}</strong>

                  <span>
                    {grupo.tipo || "personalizado"} ·{" "}
                    {grupo.obrigatorio ? "Obrigatório" : "Opcional"}
                  </span>

                  <small>
                    Mín: {grupo.minimoEscolhas || 0} · Máx:{" "}
                    {grupo.maximoEscolhas || 1} · Ordem: {grupo.ordem || 0}
                  </small>

                  {grupo.descricao && <p>{grupo.descricao}</p>}
                </div>
              </label>
            );
          })}

          {gruposAtivos.length === 0 && (
            <div className="construtor-vazio">
              Nenhum grupo de componentes cadastrado ainda.
            </div>
          )}
        </div>

        <div className="construtor-preview">
          <h4>Prévia da montagem</h4>

          {selecionados.length === 0 && (
            <p className="preview-empty">
              Selecione grupos para visualizar como o cliente montará o produto.
            </p>
          )}

          {selecionados.map((grupo, index) => (
            <div className="preview-step" key={grupo._id}>
              <b>{index + 1}</b>

              <div>
                <strong>{grupo.nome}</strong>
                <span>
                  {grupo.obrigatorio ? "Escolha obrigatória" : "Escolha opcional"}
                </span>
                <small>
                  Escolha de {grupo.minimoEscolhas || 0} até{" "}
                  {grupo.maximoEscolhas || 1}
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ConstrutorUniversalProduto;