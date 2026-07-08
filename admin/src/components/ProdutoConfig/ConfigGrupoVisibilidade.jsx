function ConfigGrupoVisibilidade({ grupo, config, atualizarConfig }) {
  return (
    <div className="config-section">
      <h5>Visibilidade</h5>

      <label className="config-switch">
        <span>Mostrar no PDV</span>
        <input
          type="checkbox"
          checked={config.mostrarPDV}
          onChange={(e) =>
            atualizarConfig(grupo, "mostrarPDV", e.target.checked)
          }
        />
      </label>

      <label className="config-switch">
        <span>Mostrar no Cardápio Online</span>
        <input
          type="checkbox"
          checked={config.mostrarCardapio}
          onChange={(e) =>
            atualizarConfig(grupo, "mostrarCardapio", e.target.checked)
          }
        />
      </label>

      <label className="config-switch">
        <span>Mostrar no PWA</span>
        <input
          type="checkbox"
          checked={config.mostrarPWA}
          onChange={(e) =>
            atualizarConfig(grupo, "mostrarPWA", e.target.checked)
          }
        />
      </label>
    </div>
  );
}

export default ConfigGrupoVisibilidade;