import IngredienteRow from "./IngredienteRow";

function criarIngredienteVazio() {
  return {
    idLocal: crypto.randomUUID(),
    materiaPrima: "",
    quantidade: "",
    unidade: "g",
  };
}

function VariacaoCard({
  variacao,
  indice,
  grupos = [],
  opcoes = [],
  materias = [],
  onChange,
  onRemover,
}) {
  const opcoesDoGrupo = opcoes.filter((opcao) => {
    const grupoId =
      typeof opcao.grupo === "object" ? opcao.grupo?._id : opcao.grupo;

    return String(grupoId) === String(variacao.grupoComponente);
  });

  function atualizarIngrediente(indiceIngrediente, novoItem) {
    onChange({
      ...variacao,
      itens: variacao.itens.map((item, index) =>
        index === indiceIngrediente ? novoItem : item
      ),
    });
  }

  function removerIngrediente(indiceIngrediente) {
    onChange({
      ...variacao,
      itens: variacao.itens.filter(
        (_, index) => index !== indiceIngrediente
      ),
    });
  }

  function adicionarIngrediente() {
    onChange({
      ...variacao,
      itens: [...variacao.itens, criarIngredienteVazio()],
    });
  }

  return (
    <article className="ficha-variacao-card">
      <header className="ficha-variacao-header">
        <div>
          <span>Variação {indice + 1}</span>
          <h3>
            {variacao.nomeGrupo || "Grupo"} —{" "}
            {variacao.nomeOpcao || "Opção"}
          </h3>
        </div>

        <button
          type="button"
          className="ficha-btn-remover-variacao"
          onClick={onRemover}
        >
          Remover variação
        </button>
      </header>

      <div className="ficha-variacao-seletores">
        <div className="ficha-field">
          <label>Grupo do produto</label>

          <select
            value={variacao.grupoComponente || ""}
            onChange={(e) => {
              const grupo = grupos.find(
                (registro) => registro._id === e.target.value
              );

              onChange({
                ...variacao,
                grupoComponente: e.target.value,
                opcaoComponente: "",
                nomeGrupo: grupo?.nome || "",
                nomeOpcao: "",
              });
            }}
          >
            <option value="">Selecione o grupo</option>

            {grupos.map((grupo) => (
              <option key={grupo._id} value={grupo._id}>
                {grupo.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="ficha-field">
          <label>Opção</label>

          <select
            value={variacao.opcaoComponente || ""}
            disabled={!variacao.grupoComponente}
            onChange={(e) => {
              const opcao = opcoes.find(
                (registro) => registro._id === e.target.value
              );

              onChange({
                ...variacao,
                opcaoComponente: e.target.value,
                nomeOpcao: opcao?.nome || "",
              });
            }}
          >
            <option value="">Selecione a opção</option>

            {opcoesDoGrupo.map((opcao) => (
              <option key={opcao._id} value={opcao._id}>
                {opcao.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ficha-subtitulo">
        <div>
          <h4>Ingredientes desta opção</h4>
          <p>
            Estes ingredientes serão baixados somente quando esta opção for
            escolhida no pedido.
          </p>
        </div>

        <button type="button" onClick={adicionarIngrediente}>
          + Adicionar ingrediente
        </button>
      </div>

      <div className="ficha-lista-ingredientes">
        {variacao.itens.length === 0 && (
          <div className="ficha-vazio">
            Nenhum ingrediente adicionado nesta variação.
          </div>
        )}

        {variacao.itens.map((item, indiceIngrediente) => (
          <IngredienteRow
            key={item.idLocal || indiceIngrediente}
            item={item}
            materias={materias}
            onChange={(novoItem) =>
              atualizarIngrediente(indiceIngrediente, novoItem)
            }
            onRemover={() => removerIngrediente(indiceIngrediente)}
          />
        ))}
      </div>
    </article>
  );
}

export default VariacaoCard;