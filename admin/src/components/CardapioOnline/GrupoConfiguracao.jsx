function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function GrupoConfiguracao({ grupo, opcoes, selecionadas, onChange }) {
  const minimo = Number(
    grupo.obrigatorio
      ? Math.max(1, grupo.minimoEscolhas || 0)
      : grupo.minimoEscolhas || 0
  );
  const maximo = Math.max(minimo, Number(grupo.maximoEscolhas || 1));
  const obrigatorio = Boolean(grupo.obrigatorio || minimo > 0);

  function toggleOpcao(opcao) {
    if (opcao.indisponivel) return;

    const jaExiste = selecionadas.some(
      (item) => String(item._id) === String(opcao._id)
    );

    if (maximo === 1) {
      onChange(jaExiste && !obrigatorio ? [] : [opcao]);
      return;
    }

    if (jaExiste) {
      onChange(
        selecionadas.filter(
          (item) => String(item._id) !== String(opcao._id)
        )
      );
      return;
    }

    if (selecionadas.length >= maximo) {
      alert(`Você pode escolher no máximo ${maximo} opção(ões).`);
      return;
    }

    onChange([...selecionadas, opcao]);
  }

  return (
    <div className="co-config-group">
      <div className="co-config-title">
        <div>
          <h3>{grupo.nome}</h3>
          <p>
            {obrigatorio ? "Obrigatório" : "Opcional"}
            {minimo > 0 ? ` · mínimo ${minimo}` : ""}
            {` · máximo ${maximo}`}
          </p>
        </div>
      </div>

      <div className="co-config-options">
        {opcoes.map((opcao) => {
          const ativo = selecionadas.some(
            (item) => String(item._id) === String(opcao._id)
          );

          return (
            <button
              type="button"
              key={opcao._id}
              className={`${ativo ? "active" : ""} ${
                opcao.indisponivel ? "disabled" : ""
              }`.trim()}
              disabled={opcao.indisponivel}
              title={opcao.motivoIndisponibilidade || ""}
              onClick={() => toggleOpcao(opcao)}
            >
              <span>
                {opcao.nome}
                {opcao.indisponivel && (
                  <small>
                    {opcao.motivoIndisponibilidade || "Indisponível"}
                  </small>
                )}
              </span>

              {Number(opcao.precoAdicional || 0) > 0 && (
                <strong>+ {moeda(opcao.precoAdicional)}</strong>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default GrupoConfiguracao;
