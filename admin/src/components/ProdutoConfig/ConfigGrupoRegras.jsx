function ConfigGrupoRegras({ grupo, config, atualizarConfig }) {
  return (
    <div className="config-section">
      <h5>Regras de escolha</h5>

      <label className="config-switch">
        <span>Obrigatório</span>
        <input
          type="checkbox"
          checked={config.obrigatorio}
          onChange={(e) =>
            atualizarConfig(grupo, "obrigatorio", e.target.checked)
          }
        />
      </label>

      <div className="config-mini-grid">
        <label>
          Mínimo
          <input
            type="number"
            min="0"
            value={config.minimoEscolhas}
            onChange={(e) =>
              atualizarConfig(grupo, "minimoEscolhas", Number(e.target.value))
            }
          />
        </label>

        <label>
          Máximo
          <input
            type="number"
            min="1"
            value={config.maximoEscolhas}
            onChange={(e) =>
              atualizarConfig(grupo, "maximoEscolhas", Number(e.target.value))
            }
          />
        </label>

        <label>
          Ordem
          <input
            type="number"
            value={config.ordem}
            onChange={(e) =>
              atualizarConfig(grupo, "ordem", Number(e.target.value))
            }
          />
        </label>
      </div>
    </div>
  );
}

export default ConfigGrupoRegras;