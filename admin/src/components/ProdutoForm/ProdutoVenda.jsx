import { FaInfoCircle } from "react-icons/fa";
import UnidadeVendaProduto from "./UnidadeVendaProduto";
import CodigoBarrasProduto from "./CodigoBarrasProduto";

function ProdutoVenda({
  tipoWizard,
  preco,
  setPreco,
  custo,
  setCusto,
  estoque,
  setEstoque,
  peso,
  setPeso,
  unidadeMedida,
  setUnidadeMedida,
  vendaPorPeso,
  setVendaPorPeso,
  permiteFracionado,
  setPermiteFracionado,
  codigoBarras,
  setCodigoBarras,
  sku,
  setSku,
}) {
  return (
    <div className="produto-aba-card">
      <div className="premium-box">
        <h3>
          <FaInfoCircle />
          Venda, preço e estoque
        </h3>

        <div className="mini-grid">
          <div className="field-premium">
            <label>Preço *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="Ex: 15.90"
              value={preco}
              onChange={(e) => setPreco(e.target.value.replace(",", "."))}
            />
          </div>

          <div className="field-premium">
            <label>Custo Produção</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={custo}
              onChange={(e) => setCusto(e.target.value.replace(",", "."))}
            />
          </div>

          <div className="field-premium">
            <label>Estoque *</label>
            <input
              placeholder="0"
              value={estoque}
              onChange={(e) => setEstoque(e.target.value)}
            />
          </div>

          <div className="field-premium">
            <label>Peso / porção</label>
            <input
              placeholder="Ex.: 120g"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
            />
          </div>
        </div>

        <UnidadeVendaProduto
          unidadeMedida={unidadeMedida}
          setUnidadeMedida={setUnidadeMedida}
          vendaPorPeso={vendaPorPeso}
          setVendaPorPeso={setVendaPorPeso}
          permiteFracionado={permiteFracionado}
          setPermiteFracionado={setPermiteFracionado}
        />

        {tipoWizard === "peso" && (
          <div className="wizard-context-box">
            <strong>⚖️ Produto por peso/fracionado</strong>
            <p>
              Esse produto será vendido por quantidade decimal no PDV, como
              1,250 kg, 0,500 kg ou outra fração.
            </p>
          </div>
        )}

        {["bolo", "torta"].includes(tipoWizard) && (
          <div className="wizard-context-box">
            <strong>🎂 Produto com peso/porção</strong>
            <p>
              Informe o peso comercial, como 250g, 500g, 1kg ou tamanho
              personalizado.
            </p>
          </div>
        )}

        <CodigoBarrasProduto
          codigoBarras={codigoBarras}
          setCodigoBarras={setCodigoBarras}
          sku={sku}
          setSku={setSku}
        />
      </div>
    </div>
  );
}

export default ProdutoVenda;