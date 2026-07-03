function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function GrupoConfiguracao({ grupo, opcoes, selecionadas, onChange }) {
  const maximo = Number(grupo.maximoEscolhas || 1);
  const obrigatorio = Boolean(grupo.obrigatorio);

  function toggleOpcao(opcao) {
    const jaExiste = selecionadas.some((item) => item._id === opcao._id);

    if (maximo === 1) {
      onChange([opcao]);
      return;
    }

    if (jaExiste) {
      onChange(selecionadas.filter((item) => item._id !== opcao._id));
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
            {obrigatorio ? "Obrigatório" : "Opcional"} · Escolha até {maximo}
          </p>
        </div>
      </div>

      <div className="co-config-options">
        {opcoes.map((opcao) => {
          const ativo = selecionadas.some((item) => item._id === opcao._id);

          return (
            <button
              type="button"
              key={opcao._id}
              className={ativo ? "active" : ""}
              onClick={() => toggleOpcao(opcao)}
            >
              <span>{opcao.nome}</span>

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