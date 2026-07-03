import {
  X,
  Plus,
  Minus,
  ShieldCheck,
  Clock,
  Scale,
  Flame,
  Leaf,
  AlertTriangle,
} from "lucide-react";

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function ProdutoModal({
  produto,
  imagem,
  quantidade,
  setQuantidade,
  onFechar,
  onAdicionar,
}) {
  if (!produto) return null;

  const selos = produto.selos || {};
  const alergenos = produto.alergenos || {};
  const nutri = produto.informacoesNutricionais || {};

  const listaSelos = [
    ["semGluten", "Sem glúten"],
    ["zeroLactose", "Zero lactose"],
    ["zeroAcucar", "Zero açúcar"],
    ["lowCarb", "Low carb"],
    ["vegano", "Vegano"],
    ["fit", "Fit"],
  ].filter(([campo]) => selos[campo]);

  const listaAlergenos = [
    ["contemLeite", "Contém leite"],
    ["contemOvos", "Contém ovos"],
    ["contemSoja", "Contém soja"],
    ["contemCastanhas", "Contém castanhas"],
    ["contemAmendoim", "Contém amendoim"],
    ["contemGluten", "Contém glúten"],
  ].filter(([campo]) => alergenos[campo]);

  return (
    <div className="co-modal-overlay">
      <div className="co-modal">
        <button className="co-modal-close" onClick={onFechar}>
          <X size={22} />
        </button>

        <div className="co-modal-image">
          <img src={imagem} alt={produto.nome} />
        </div>

        <div className="co-modal-content">
          <h2>{produto.nome}</h2>

          <p className="co-modal-desc">
            {produto.descricao || "Produto especial da Conceito Fitness Gourmet."}
          </p>

          <div className="co-modal-price">
            {moeda(produto.preco)}
          </div>

          <div className="co-modal-meta">
            {produto.tempoPreparo && (
              <span>
                <Clock size={15} /> {produto.tempoPreparo} min
              </span>
            )}

            {produto.peso && (
              <span>
                <Scale size={15} /> {produto.peso}
              </span>
            )}

            {produto.restricoes && (
              <span>
                <ShieldCheck size={15} /> {produto.restricoes}
              </span>
            )}
          </div>

          {listaSelos.length > 0 && (
            <div className="co-modal-block">
              <h3>
                <Leaf size={17} /> Selos do produto
              </h3>

              <div className="co-modal-tags">
                {listaSelos.map(([campo, label]) => (
                  <span key={campo}>{label}</span>
                ))}
              </div>
            </div>
          )}

          {listaAlergenos.length > 0 && (
            <div className="co-modal-block">
              <h3>
                <AlertTriangle size={17} /> Alérgenos
              </h3>

              <div className="co-modal-tags danger">
                {listaAlergenos.map(([campo, label]) => (
                  <span key={campo}>{label}</span>
                ))}
              </div>
            </div>
          )}

          <div className="co-modal-block">
            <h3>
              <Flame size={17} /> Informações nutricionais
            </h3>

            <div className="co-nutri-grid">
              <div>
                <span>Calorias</span>
                <strong>{nutri.calorias || 0}</strong>
              </div>

              <div>
                <span>Proteínas</span>
                <strong>{nutri.proteinas || 0}g</strong>
              </div>

              <div>
                <span>Carboidratos</span>
                <strong>{nutri.carboidratos || 0}g</strong>
              </div>

              <div>
                <span>Gorduras</span>
                <strong>{nutri.gorduras || 0}g</strong>
              </div>

              <div>
                <span>Fibras</span>
                <strong>{nutri.fibras || 0}g</strong>
              </div>

              <div>
                <span>Sódio</span>
                <strong>{nutri.sodio || 0}mg</strong>
              </div>
            </div>
          </div>

          <div className="co-modal-footer">
            <div className="co-modal-qty">
              <button onClick={() => setQuantidade(Math.max(1, quantidade - 1))}>
                <Minus size={18} />
              </button>

              <strong>{quantidade}</strong>

              <button onClick={() => setQuantidade(quantidade + 1)}>
                <Plus size={18} />
              </button>
            </div>

            <button className="co-modal-add" onClick={onAdicionar}>
              Adicionar {moeda(Number(produto.preco || 0) * quantidade)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProdutoModal;