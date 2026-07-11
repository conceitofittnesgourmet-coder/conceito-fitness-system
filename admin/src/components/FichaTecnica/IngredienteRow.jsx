function IngredienteRow({
  item,
  materias = [],
  onChange,
  onRemover,
}) {
  const materiaSelecionada = materias.find(
    (materia) => String(materia._id) === String(item.materiaPrima)
  );

  const quantidade = Number(item.quantidade || 0);
  const custoUnitario = Number(materiaSelecionada?.custoUnitario || 0);
  const custoEstimado = quantidade * custoUnitario;

  return (
    <div className="ficha-ingrediente-row">
      <div className="ficha-field">
        <label>Matéria-prima</label>

        <select
          value={item.materiaPrima || ""}
          onChange={(e) => {
            const materia = materias.find(
              (registro) => registro._id === e.target.value
            );

            onChange({
              ...item,
              materiaPrima: e.target.value,
              unidade: materia?.unidade || "unidade",
            });
          }}
        >
          <option value="">Selecione o ingrediente</option>

          {materias.map((materia) => (
            <option key={materia._id} value={materia._id}>
              {materia.nome} — R$ {Number(materia.custoUnitario || 0).toFixed(4)}{" "}
              / {materia.unidade}
            </option>
          ))}
        </select>
      </div>

      <div className="ficha-field ficha-field-menor">
        <label>Quantidade</label>

        <input
          type="number"
          min="0"
          step="0.001"
          value={item.quantidade}
          onChange={(e) =>
            onChange({
              ...item,
              quantidade: e.target.value,
            })
          }
        />
      </div>

      <div className="ficha-field ficha-field-menor">
        <label>Unidade</label>

        <select
          value={item.unidade || "unidade"}
          onChange={(e) =>
            onChange({
              ...item,
              unidade: e.target.value,
            })
          }
        >
          <option value="g">g</option>
          <option value="kg">kg</option>
          <option value="ml">ml</option>
          <option value="litro">litro</option>
          <option value="unidade">unidade</option>
        </select>
      </div>

      <div className="ficha-custo-item">
        <span>Custo estimado</span>
        <strong>R$ {custoEstimado.toFixed(4)}</strong>
      </div>

      <button
        type="button"
        className="ficha-btn-remover"
        onClick={onRemover}
        title="Remover ingrediente"
      >
        ×
      </button>
    </div>
  );
}

export default IngredienteRow;