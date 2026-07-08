function ResumoConfiguracao({ produto, escolhas, precoFinal }) {
  return (
    <div className="pdv-config-resumo">
      <h3>Resumo</h3>

      <strong>{produto?.nome}</strong>

      <div className="pdv-config-escolhas">
        {escolhas.length === 0 && <p>Nenhuma escolha feita ainda.</p>}

        {escolhas.map((item) => (
          <div key={`${item.grupoId}-${item.opcaoId}`}>
            <span>
              {item.grupo}: {item.opcao}
            </span>

            {Number(item.valor || 0) > 0 && (
              <b>+ R$ {Number(item.valor || 0).toFixed(2)}</b>
            )}
          </div>
        ))}
      </div>

      <div className="pdv-config-total">
        <span>Total</span>
        <strong>R$ {Number(precoFinal || 0).toFixed(2)}</strong>
      </div>
    </div>
  );
}

export default ResumoConfiguracao;