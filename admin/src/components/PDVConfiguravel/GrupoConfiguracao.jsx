import OpcaoConfiguracao from "./OpcaoConfiguracao";

function GrupoConfiguracao({
  grupo,
  opcoes,
  escolhas,
  onSelecionarOpcao,
}) {
  const config = grupo.config || {};
  const maximo = Number(config.maximoEscolhas || grupo.maximoEscolhas || 1);
  const obrigatorio = Boolean(config.obrigatorio ?? grupo.obrigatorio);

  return (
    <div className="pdv-config-grupo">
      <div className="pdv-config-grupo-header">
        <div>
          <h3>{grupo.nome}</h3>
          <p>
            {obrigatorio ? "Obrigatório" : "Opcional"} · escolha até {maximo}
          </p>
        </div>
      </div>

      <div className="pdv-config-opcoes">
        {opcoes.map((opcao) => {
          const selecionada = escolhas.some(
            (e) => e.opcaoId === opcao._id
          );

          return (
            <OpcaoConfiguracao
              key={opcao._id}
              opcao={opcao}
              selecionada={selecionada}
              onSelecionar={() =>
                onSelecionarOpcao(grupo, opcao, maximo)
              }
            />
          );
        })}

        {opcoes.length === 0 && (
          <div className="pdv-config-empty">
            Nenhuma opção cadastrada para este grupo.
          </div>
        )}
      </div>
    </div>
  );
}

export default GrupoConfiguracao;