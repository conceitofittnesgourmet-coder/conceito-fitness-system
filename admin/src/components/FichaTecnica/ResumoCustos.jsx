function calcularCustoItens(itens = [], materias = []) {
  return itens.reduce((total, item) => {
    const materia = materias.find(
      (registro) =>
        String(registro._id) === String(item.materiaPrima)
    );

    return (
      total +
      Number(item.quantidade || 0) *
        Number(materia?.custoUnitario || 0)
    );
  }, 0);
}

function ResumoCustos({
  produto,
  ingredientesBase = [],
  variacoes = [],
  materias = [],
}) {
  const custoBase = calcularCustoItens(
    ingredientesBase,
    materias
  );

  const custosVariacoes = variacoes.map((variacao) => ({
    nome:
      `${variacao.nomeGrupo || "Grupo"} — ${
        variacao.nomeOpcao || "Opção"
      }`,
    custo: calcularCustoItens(variacao.itens, materias),
  }));

  const custoVariacoes = custosVariacoes.reduce(
    (total, item) => total + item.custo,
    0
  );

  const precoProduto = Number(produto?.preco || 0);
  const lucroBase = precoProduto - custoBase;

  const margemBase =
    precoProduto > 0
      ? (lucroBase / precoProduto) * 100
      : 0;

  return (
    <aside className="ficha-resumo">
      <span>Resumo financeiro</span>
      <h3>{produto?.nome || "Selecione um produto"}</h3>

      <div className="ficha-resumo-kpi">
        <p>Custo dos ingredientes-base</p>
        <strong>R$ {custoBase.toFixed(4)}</strong>
      </div>

      <div className="ficha-resumo-kpi">
        <p>Soma das variações cadastradas</p>
        <strong>R$ {custoVariacoes.toFixed(4)}</strong>
      </div>

      <div className="ficha-resumo-kpi">
        <p>Preço atual do produto</p>
        <strong>R$ {precoProduto.toFixed(2)}</strong>
      </div>

      <div className="ficha-resumo-kpi destaque">
        <p>Lucro estimado apenas com custo-base</p>
        <strong>R$ {lucroBase.toFixed(2)}</strong>
        <small>Margem estimada: {margemBase.toFixed(2)}%</small>
      </div>

      {custosVariacoes.length > 0 && (
        <div className="ficha-resumo-variacoes">
          <h4>Custos por opção</h4>

          {custosVariacoes.map((item, index) => (
            <div key={`${item.nome}-${index}`}>
              <span>{item.nome}</span>
              <strong>R$ {item.custo.toFixed(4)}</strong>
            </div>
          ))}
        </div>
      )}

      <p className="ficha-resumo-aviso">
        O CMV real do pedido será calculado usando o custo-base mais apenas as
        opções escolhidas pelo cliente.
      </p>
    </aside>
  );
}

export default ResumoCustos;