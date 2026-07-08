import { calcularPrecoConfigurado } from "./CalculadoraPreco";
import GrupoConfiguracao from "./GrupoConfiguracao";
import ResumoConfiguracao from "./ResumoConfiguracao";

function ConfiguradorEngine({
  produto,
  grupos,
  opcoes,
  escolhas,
  setEscolhas,
}) {
  function selecionarOpcao(grupo, opcao, maximo) {
    const jaSelecionada = escolhas.some(
      (e) => e.grupoId === grupo._id && e.opcaoId === opcao._id
    );

    if (jaSelecionada) {
      setEscolhas(
        escolhas.filter(
          (e) => !(e.grupoId === grupo._id && e.opcaoId === opcao._id)
        )
      );
      return;
    }

    const escolhasGrupo = escolhas.filter((e) => e.grupoId === grupo._id);

    if (escolhasGrupo.length >= maximo) {
      const semPrimeiraDoGrupo = escolhas.filter(
        (e) => e.opcaoId !== escolhasGrupo[0].opcaoId
      );

      setEscolhas([
        ...semPrimeiraDoGrupo,
        {
          grupoId: grupo._id,
          grupo: grupo.nome,
          opcaoId: opcao._id,
          opcao: opcao.nome,
          valor: Number(opcao.precoAdicional || 0),
        },
      ]);

      return;
    }

    setEscolhas([
      ...escolhas,
      {
        grupoId: grupo._id,
        grupo: grupo.nome,
        opcaoId: opcao._id,
        opcao: opcao.nome,
        valor: Number(opcao.precoAdicional || 0),
      },
    ]);
  }

  const preco = calcularPrecoConfigurado(produto, escolhas);

  return (
    <div className="pdv-config-engine">
      <div className="pdv-config-lista">
        {grupos.map((grupo) => {
          const opcoesGrupo = opcoes.filter((opcao) => {
            const grupoId =
              typeof opcao.grupo === "object" ? opcao.grupo?._id : opcao.grupo;

            return String(grupoId) === String(grupo._id);
          });

          return (
            <GrupoConfiguracao
              key={grupo._id}
              grupo={grupo}
              opcoes={opcoesGrupo}
              escolhas={escolhas}
              onSelecionarOpcao={selecionarOpcao}
            />
          );
        })}
      </div>

      <ResumoConfiguracao
        produto={produto}
        escolhas={escolhas}
        precoFinal={preco.precoFinal}
      />
    </div>
  );
}

export default ConfiguradorEngine;