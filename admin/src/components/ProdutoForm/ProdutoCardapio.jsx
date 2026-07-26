import { FaStar } from "react-icons/fa";
import ConstrutorUniversalProduto from "./ConstrutorUniversalProduto";
import ProdutoConfigEngine from "../ProdutoConfig/ProdutoConfigEngine";
import PublicacaoOnlineProduto from "./PublicacaoOnlineProduto";

function ProdutoCardapio({
  tipoWizard,
  publicacao,
  setPublicacao,
  preco,
  tipoProduto,
  setTipoProduto,
  tempoPreparo,
  setTempoPreparo,
  restricoes,
  setRestricoes,
  gruposComponentes,
  gruposSelecionados,
  setGruposSelecionados,
  configuracaoGrupos,
  setConfiguracaoGrupos,
}) {
  return (
    <div className="produto-aba-card">
      <div className="premium-box">
        <h3>
          <FaStar />
          Cardápio Online e Montagem
        </h3>

        <PublicacaoOnlineProduto
  publicacao={publicacao}
  setPublicacao={setPublicacao}
  preco={preco}
/>

        <div className="field-premium">
          <label>Tipo Produto</label>
          <select
            value={tipoProduto}
            onChange={(e) => setTipoProduto(e.target.value)}
          >
            <option value="producao">Produção Própria</option>
            <option value="revenda">Revenda</option>
            <option value="insumo">Insumo</option>
          </select>
        </div>

        <div className="field-premium">
          <label>Tempo de preparo</label>
          <input
            placeholder="0 min"
            value={tempoPreparo}
            onChange={(e) => setTempoPreparo(e.target.value)}
          />
        </div>

        <div className="field-premium full">
          <label>Restrições</label>
          <input
            placeholder="Ex.: Sem glúten, Sem lactose"
            value={restricoes}
            onChange={(e) => setRestricoes(e.target.value)}
          />
        </div>

        <div className="wizard-context-box">
          <strong>
            {tipoWizard === "bolo" && "🎂 Configuração recomendada para bolos"}
            {tipoWizard === "torta" && "🥧 Configuração recomendada para tortas"}
            {tipoWizard === "cafe" &&
              "☕ Configuração recomendada para cafés e bebidas"}
            {tipoWizard === "combo" && "🥪 Configuração recomendada para combos"}
            {tipoWizard === "kit" && "🎁 Configuração recomendada para kits"}
            {tipoWizard === "cesta" && "🧺 Configuração recomendada para cestas"}
            {tipoWizard === "peso" &&
              "⚖️ Configuração recomendada para produto por peso"}
            {tipoWizard === "simples" && "📦 Produto simples"}
          </strong>

          <p>
            {["bolo", "torta"].includes(tipoWizard) &&
              "Use grupos como massa, recheio, cobertura, decoração, tamanho e adicionais."}

            {tipoWizard === "cafe" &&
              "Use grupos como tamanho, tipo de leite, temperatura, caldas, chantilly e adicionais."}

            {["combo", "kit", "cesta"].includes(tipoWizard) &&
              "Use grupos para selecionar itens, embalagens, cartões, adicionais e personalizações."}

            {tipoWizard === "peso" &&
              "Configure unidade em KG, venda fracionada e peso mínimo/máximo quando necessário."}

            {tipoWizard === "simples" &&
              "Este produto pode ser vendido diretamente, sem montagem obrigatória."}
          </p>
        </div>

        <ConstrutorUniversalProduto
          gruposComponentes={gruposComponentes}
          gruposSelecionados={gruposSelecionados}
          setGruposSelecionados={setGruposSelecionados}
        />
        <ProdutoConfigEngine
  gruposComponentes={gruposComponentes}
  gruposSelecionados={gruposSelecionados}
  configuracaoGrupos={configuracaoGrupos}
  setConfiguracaoGrupos={setConfiguracaoGrupos}
/>
      </div>
    </div>
  );
}

export default ProdutoCardapio;