import { useMemo, useState } from "react";
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
import GrupoConfiguracao from "./GrupoConfiguracao";
import {
  obterGruposDoProduto,
  calcularAdicionais,
  validarGruposObrigatorios,
} from "../ConfiguradorUniversal/configuradorUtils";

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
  grupos = [],
  opcoes = [],
  onFechar,
  onAdicionar,
}) {
  const [selecoes, setSelecoes] = useState({});
  const [observacaoItem, setObservacaoItem] = useState("");

  if (!produto) return null;

  const imagensProduto = [
    imagem,
    ...(produto.imagens || [])
      .map((img) => img?.url || img?.secure_url || img?.path || img)
      .filter(Boolean),
  ].filter(Boolean);

  const imagensUnicas = [...new Set(imagensProduto)];
  const [imagemAtiva, setImagemAtiva] = useState(imagensUnicas[0] || imagem);

  const selos = produto.selos || {};
  const alergenos = produto.alergenos || {};
  const nutri = produto.informacoesNutricionais || {};

  const gruposDoProduto = obterGruposDoProduto(produto, grupos).filter(
  (grupo) => grupo.mostrarCardapio
);

  const adicionais = useMemo(() => {
  return calcularAdicionais(selecoes);
}, [selecoes]);

  const precoFinal = (Number(produto.preco || 0) + adicionais) * quantidade;

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

  function confirmar() {
  const validacao = validarGruposObrigatorios(
    gruposDoProduto,
    selecoes
  );

  if (!validacao.valido) {
    alert(validacao.mensagem);
    return;
  }

  onAdicionar({
    selecoes,
    adicionais,
    precoUnitario: Number(produto.preco || 0) + adicionais,
    observacaoItem: observacaoItem.trim(),
  });
}

  return (
    <div className="co-modal-overlay">
      <div className="co-modal">
        <button className="co-modal-close" onClick={onFechar}>
          <X size={22} />
        </button>

        <div className="co-modal-image">
          <img src={imagemAtiva} alt={produto.nome} />

          {imagensUnicas.length > 1 && (
            <div className="co-modal-thumbs">
              {imagensUnicas.map((img, index) => (
                <button
                  key={index}
                  className={imagemAtiva === img ? "active" : ""}
                  onClick={() => setImagemAtiva(img)}
                >
                  <img src={img} alt={`${produto.nome} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="co-modal-content">
          <h2>{produto.nome}</h2>

          <p className="co-modal-desc">
            {produto.descricao ||
              "Produto especial da Conceito Fitness Gourmet."}
          </p>

          <div className="co-modal-price">{moeda(produto.preco)}</div>

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

          {gruposDoProduto.map((grupo) => {
            const opcoesGrupo = opcoes.filter((opcao) => {
              const grupoOpcao = opcao.grupo?._id || opcao.grupo;
              return String(grupoOpcao) === String(grupo._id);
            });

            if (opcoesGrupo.length === 0) return null;

            return (
              <GrupoConfiguracao
                key={grupo._id}
                grupo={grupo}
                opcoes={opcoesGrupo}
                selecionadas={selecoes[grupo._id] || []}
                onChange={(novas) =>
                  setSelecoes({
                    ...selecoes,
                    [grupo._id]: novas,
                  })
                }
              />
            );
          })}

          <div className="co-modal-block">
            <h3>Observação do item</h3>
            <textarea
              className="co-modal-note"
              placeholder="Ex.: sem canela, pouco gelo, aquecer antes de entregar..."
              value={observacaoItem}
              maxLength={180}
              onChange={(e) => setObservacaoItem(e.target.value)}
            />
            <small className="co-note-counter">{observacaoItem.length}/180</small>
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

            <button className="co-modal-add" onClick={confirmar}>
              Adicionar {moeda(precoFinal)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProdutoModal;