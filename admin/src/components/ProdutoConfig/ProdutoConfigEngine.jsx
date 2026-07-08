import ConfigGrupoCard from "./ConfigGrupoCard";
import ConfigGrupoPreview from "./ConfigGrupoPreview";

function criarConfigPadrao(grupo) {
  return {
    grupoId: grupo._id,
    nome: grupo.nome,
    tipo: grupo.tipo || "personalizado",
    obrigatorio: Boolean(grupo.obrigatorio),
    minimoEscolhas: Number(grupo.minimoEscolhas || 0),
    maximoEscolhas: Number(grupo.maximoEscolhas || 1),
    ordem: Number(grupo.ordem || 0),
    mostrarPDV: true,
    mostrarCardapio: true,
    mostrarPWA: true,
    regraPreco: "sem_alteracao",
    valorPreco: 0,
  };
}

function ProdutoConfigEngine({
  gruposComponentes = [],
  gruposSelecionados = [],
  configuracaoGrupos = [],
  setConfiguracaoGrupos,
}) {
  const gruposAtivos = gruposComponentes.filter((g) =>
    gruposSelecionados.includes(g._id)
  );

  function obterConfig(grupo) {
    return (
      configuracaoGrupos.find((c) => c.grupoId === grupo._id) ||
      criarConfigPadrao(grupo)
    );
  }

  function atualizarConfig(grupo, campo, valor) {
    const configAtual = obterConfig(grupo);

    const novaConfig = {
      ...configAtual,
      [campo]: valor,
    };

    const existe = configuracaoGrupos.some((c) => c.grupoId === grupo._id);

    if (existe) {
      setConfiguracaoGrupos(
        configuracaoGrupos.map((c) =>
          c.grupoId === grupo._id ? novaConfig : c
        )
      );
    } else {
      setConfiguracaoGrupos([...configuracaoGrupos, novaConfig]);
    }
  }

  return (
    <div className="produto-config-engine">
      <div className="config-engine-header">
        <div>
          <span>Motor Enterprise</span>
          <h3>Configuração avançada dos grupos</h3>
          <p>
            Defina regras de escolha, preço e visibilidade para PDV,
            Cardápio Online e PWA.
          </p>
        </div>

        <strong>{gruposAtivos.length} grupo(s)</strong>
      </div>

      {gruposAtivos.length === 0 && (
        <div className="config-empty">
          Selecione grupos no Construtor Universal para configurar regras.
        </div>
      )}

      <div className="config-engine-grid">
        <div className="config-list">
          {gruposAtivos.map((grupo) => (
            <ConfigGrupoCard
              key={grupo._id}
              grupo={grupo}
              config={obterConfig(grupo)}
              atualizarConfig={atualizarConfig}
            />
          ))}
        </div>

        <ConfigGrupoPreview
          grupos={gruposAtivos}
          configuracaoGrupos={configuracaoGrupos}
        />
      </div>
    </div>
  );
}

export default ProdutoConfigEngine;