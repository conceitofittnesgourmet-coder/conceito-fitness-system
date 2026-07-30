const FATORES = {
  kg: { base: "massa", fator: 1000 }, g: { base: "massa", fator: 1 },
  litro: { base: "volume", fator: 1000 }, l: { base: "volume", fator: 1000 }, ml: { base: "volume", fator: 1 },
  unidade: { base: "unidade", fator: 1 }, un: { base: "unidade", fator: 1 },
  pacote: { base: "pacote", fator: 1 }, caixa: { base: "caixa", fator: 1 },
};
function IngredienteRow({ item, materias = [], onChange, onRemover }) {
  const materia = materias.find((m) => String(m._id) === String(item.materiaPrima));
  const origem = FATORES[String(item.unidade || materia?.unidade || "unidade").toLowerCase()];
  const destino = FATORES[String(materia?.unidade || "unidade").toLowerCase()];
  const compativel = !materia || (origem && destino && origem.base === destino.base);
  const qtdConvertida = compativel && materia ? (Number(item.quantidade || 0) * origem.fator) / destino.fator : 0;
  const custo = qtdConvertida * Number(materia?.custoUnitario || 0);
  return <div className="ficha-ingrediente-row">
    <div className="ficha-field"><label>Ingrediente</label><select value={item.materiaPrima || ""} onChange={(e) => { const m = materias.find((x) => x._id === e.target.value); onChange({ ...item, materiaPrima: e.target.value, unidade: m?.unidade || "unidade" }); }}><option value="">Selecione</option>{materias.filter((m) => m.ativo !== false).map((m) => <option key={m._id} value={m._id}>{m.nome} — R$ {Number(m.custoUnitario || 0).toFixed(4)} / {m.unidade}</option>)}</select></div>
    <div className="ficha-field ficha-field-menor"><label>Quantidade</label><input type="number" min="0" step="0.001" value={item.quantidade} onChange={(e) => onChange({ ...item, quantidade: e.target.value })}/></div>
    <div className="ficha-field ficha-field-menor"><label>Unidade usada</label><select value={item.unidade || "unidade"} onChange={(e) => onChange({ ...item, unidade: e.target.value })}><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="litro">litro</option><option value="unidade">unidade</option><option value="pacote">pacote</option><option value="caixa">caixa</option></select></div>
    <div className="ficha-custo-item"><span>{compativel ? "Custo estimado" : "Unidades incompatíveis"}</span><strong>{compativel ? `R$ ${custo.toFixed(4)}` : "Corrija"}</strong></div>
    <button type="button" className="ficha-btn-remover" onClick={onRemover} title="Remover ingrediente">×</button>
  </div>;
}
export default IngredienteRow;
