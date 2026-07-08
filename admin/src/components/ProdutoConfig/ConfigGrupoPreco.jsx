function ConfigGrupoPreco({ grupo, config, atualizarConfig }) {
  return (
    <div className="config-section">
      <h5>Preço</h5>

      <label>
        Regra de preço
        <select
          value={config.regraPreco}
          onChange={(e) =>
            atualizarConfig(grupo, "regraPreco", e.target.value)
          }
        >
          <option value="sem_alteracao">Sem alteração</option>
          <option value="somar">Somar valor</option>
          <option value="substituir">Substituir preço</option>
          <option value="percentual">Percentual</option>
        </select>
      </label>

      <label>
        Valor
        <input
          type="number"
          step="0.01"
          value={config.valorPreco}
          onChange={(e) =>
            atualizarConfig(grupo, "valorPreco", Number(e.target.value))
          }
        />
      </label>
    </div>
  );
}

export default ConfigGrupoPreco;