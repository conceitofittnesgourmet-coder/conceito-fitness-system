function ConfigGrupoPreview({ grupos = [], configuracaoGrupos = [] }) {
  const configsOrdenadas = grupos
    .map((grupo) => {
      const config = configuracaoGrupos.find((c) => c.grupoId === grupo._id);

      return {
        grupo,
        config: config || {
          obrigatorio: grupo.obrigatorio,
          minimoEscolhas: grupo.minimoEscolhas || 0,
          maximoEscolhas: grupo.maximoEscolhas || 1,
          ordem: grupo.ordem || 0,
          mostrarCardapio: true,
        },
      };
    })
    .sort((a, b) => Number(a.config.ordem || 0) - Number(b.config.ordem || 0));

  return (
    <div className="config-preview">
      <h4>Prévia do cliente</h4>

      {configsOrdenadas.length === 0 && (
        <p>Nenhum grupo configurado ainda.</p>
      )}

      {configsOrdenadas.map(({ grupo, config }, index) => (
        <div className="config-preview-step" key={grupo._id}>
          <b>{index + 1}</b>

          <div>
            <strong>{grupo.nome}</strong>
            <span>{config.obrigatorio ? "Obrigatório" : "Opcional"}</span>
            <small>
              Escolha de {config.minimoEscolhas || 0} até{" "}
              {config.maximoEscolhas || 1}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ConfigGrupoPreview;