function OpcaoConfiguracao({ opcao, selecionada, onSelecionar }) {
  return (
    <button
      type="button"
      className={`pdv-config-opcao ${selecionada ? "active" : ""}`}
      onClick={() => onSelecionar(opcao)}
    >
      <span>{opcao.nome}</span>

      {Number(opcao.precoAdicional || 0) > 0 && (
        <strong>+ R$ {Number(opcao.precoAdicional || 0).toFixed(2)}</strong>
      )}
    </button>
  );
}

export default OpcaoConfiguracao;