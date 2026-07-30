const FATORES = {
  kg: { base: "massa", fator: 1000 }, g: { base: "massa", fator: 1 },
  litro: { base: "volume", fator: 1000 }, l: { base: "volume", fator: 1000 }, ml: { base: "volume", fator: 1 },
  unidade: { base: "unidade", fator: 1 }, un: { base: "unidade", fator: 1 },
  pacote: { base: "pacote", fator: 1 }, caixa: { base: "caixa", fator: 1 },
};

function custoItem(item, materias) {
  const materia = materias.find((m) => String(m._id) === String(item.materiaPrima));
  if (!materia) return 0;
  const origem = FATORES[String(item.unidade || materia.unidade).toLowerCase()];
  const destino = FATORES[String(materia.unidade || "unidade").toLowerCase()];
  if (!origem || !destino || origem.base !== destino.base) return 0;
  const quantidadeConvertida = (Number(item.quantidade || 0) * origem.fator) / destino.fator;
  return quantidadeConvertida * Number(materia.custoUnitario || 0);
}

function calcularCustoItens(itens = [], materias = []) {
  return itens.reduce((total, item) => total + custoItem(item, materias), 0);
}

function ResumoCustos({ produto, ingredientesBase = [], variacoes = [], materias = [], rendimento = 1, perdaPercentual = 0 }) {
  const custoBase = calcularCustoItens(ingredientesBase, materias);
  const fatorPerda = 1 - (Number(perdaPercentual || 0) / 100);
  const custoComPerda = fatorPerda > 0 ? custoBase / fatorPerda : custoBase;
  const custoUnitario = custoComPerda / Math.max(Number(rendimento || 1), 0.0001);
  const custosVariacoes = variacoes.map((v) => ({ nome: `${v.nomeGrupo || "Grupo"} — ${v.nomeOpcao || "Opção"}`, custo: calcularCustoItens(v.itens, materias) }));
  const preco = Number(produto?.preco || 0);
  const lucro = preco - custoUnitario;
  const margem = preco > 0 ? (lucro / preco) * 100 : 0;
  const markup = custoUnitario > 0 ? preco / custoUnitario : 0;

  return <aside className="ficha-resumo">
    <span>Resumo financeiro</span>
    <h3>{produto?.nome || "Selecione um produto"}</h3>
    <div className="ficha-resumo-kpi"><p>Custo da receita</p><strong>R$ {custoBase.toFixed(4)}</strong></div>
    <div className="ficha-resumo-kpi"><p>Custo com perda</p><strong>R$ {custoComPerda.toFixed(4)}</strong></div>
    <div className="ficha-resumo-kpi destaque"><p>CMV por unidade</p><strong>R$ {custoUnitario.toFixed(4)}</strong><small>Rendimento: {Number(rendimento || 1)}</small></div>
    <div className="ficha-resumo-kpi"><p>Preço de venda</p><strong>R$ {preco.toFixed(2)}</strong></div>
    <div className="ficha-resumo-kpi destaque"><p>Lucro unitário estimado</p><strong>R$ {lucro.toFixed(2)}</strong><small>Margem: {margem.toFixed(2)}% · Markup: {markup.toFixed(2)}x</small></div>
    {custosVariacoes.length > 0 && <div className="ficha-resumo-variacoes"><h4>Custo por opção</h4>{custosVariacoes.map((item, i) => <div key={`${item.nome}-${i}`}><span>{item.nome}</span><strong>R$ {item.custo.toFixed(4)}</strong></div>)}</div>}
    <p className="ficha-resumo-aviso">Os cálculos consideram conversão entre kg/g e litro/ml. O CMV salvo no produto usa a receita-base, rendimento e perda informados.</p>
  </aside>;
}
export default ResumoCustos;
