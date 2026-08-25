import {
  FaBullhorn,
  FaSearch,
  FaTags,
  FaGlobe,
} from "react-icons/fa";

function ProdutoMarketing({
  marketing,
  setMarketing,
}) {
  const dados = marketing || {};
  const seo = dados.seo || {};

  function alterarSeo(campo, valor) {
    setMarketing((atual) => ({
      ...(atual || {}),

      seo: {
        ...(atual?.seo || {}),
        [campo]: valor,
      },
    }));
  }

  return (
    <div className="produto-aba-card produto-marketing-page">

      <section className="marketing-hero">
        <div className="marketing-hero-icon">
          <FaBullhorn />
        </div>

        <div>
          <span>Visibilidade do produto</span>
          <h2>Marketing e divulgação</h2>

          <p>
            Configure como o produto será apresentado
            no site, cardápio e mecanismos de busca.
          </p>
        </div>
      </section>

      <div className="marketing-grid">

        <section className="premium-box">
          <h3>
            <FaSearch /> SEO do produto
          </h3>

          <div className="field-premium full">
            <label>Título para busca</label>

            <input
              value={seo.titulo || ""}
              maxLength={70}
              placeholder="Ex.: Bolo Low Carb sem açúcar"
              onChange={(e) =>
                alterarSeo("titulo", e.target.value)
              }
            />

            <small>
              Recomendado: até 60–70 caracteres.
            </small>
          </div>

          <div className="field-premium full">
            <label>Descrição para busca</label>

            <textarea
              rows="4"
              maxLength={180}
              value={seo.descricao || ""}
              placeholder="Descreva o produto de forma atrativa..."
              onChange={(e) =>
                alterarSeo("descricao", e.target.value)
              }
            />
          </div>
        </section>

        <section className="premium-box">
          <h3>
            <FaTags /> Palavras-chave
          </h3>

          <div className="field-premium full">
            <label>Palavras-chave</label>

            <input
              value={
                Array.isArray(seo.palavrasChave)
                  ? seo.palavrasChave.join(", ")
                  : ""
              }
              placeholder="low carb, sem açúcar, sem glúten"
              onChange={(e) =>
                alterarSeo(
                  "palavrasChave",
                  e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                )
              }
            />

            <small>
              Separe cada termo por vírgula.
            </small>
          </div>

          <div className="field-premium full">
            <label>Slug / endereço amigável</label>

            <input
              value={seo.slug || ""}
              placeholder="bolo-low-carb"
              onChange={(e) =>
                alterarSeo(
                  "slug",
                  e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, "")
                )
              }
            />
          </div>
        </section>

        <section className="premium-box">
          <h3>
            <FaGlobe /> Indexação
          </h3>

          <label className="premium-switch">
            <div>
              <strong>Permitir indexação</strong>

              <span>
                Permite que mecanismos de busca
                indexem esta página.
              </span>
            </div>

            <input
              type="checkbox"
              checked={seo.indexar !== false}
              onChange={(e) =>
                alterarSeo(
                  "indexar",
                  e.target.checked
                )
              }
            />
          </label>
        </section>

        <section className="premium-box">
          <h3>Prévia</h3>

          <div className="marketing-preview">
            <span>
              conceitofitgourmet.com.br
            </span>

            <strong>
              {seo.titulo ||
                "Título do produto"}
            </strong>

            <p>
              {seo.descricao ||
                "A descrição configurada para o produto aparecerá aqui."}
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}

export default ProdutoMarketing;