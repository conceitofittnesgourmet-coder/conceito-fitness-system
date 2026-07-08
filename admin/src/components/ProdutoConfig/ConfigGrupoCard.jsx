import ConfigGrupoRegras from "./ConfigGrupoRegras";
import ConfigGrupoPreco from "./ConfigGrupoPreco";
import ConfigGrupoVisibilidade from "./ConfigGrupoVisibilidade";

function ConfigGrupoCard({ grupo, config, atualizarConfig }) {
  return (
    <div className="config-grupo-card">
      <div className="config-grupo-top">
        <div>
          <h4>{grupo.nome}</h4>
          <span>{grupo.tipo || "personalizado"}</span>
        </div>

        <strong>{config.obrigatorio ? "Obrigatório" : "Opcional"}</strong>
      </div>

      {grupo.descricao && <p className="config-descricao">{grupo.descricao}</p>}

      <ConfigGrupoRegras
        grupo={grupo}
        config={config}
        atualizarConfig={atualizarConfig}
      />

      <ConfigGrupoPreco
        grupo={grupo}
        config={config}
        atualizarConfig={atualizarConfig}
      />

      <ConfigGrupoVisibilidade
        grupo={grupo}
        config={config}
        atualizarConfig={atualizarConfig}
      />
    </div>
  );
}

export default ConfigGrupoCard;