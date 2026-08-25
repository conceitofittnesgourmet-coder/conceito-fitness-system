import React from "react";

import ReceitaEditor from "./ReceitaEditor";
import IngredientesGrid from "./IngredientesGrid";
import NutricaoResumo from "./NutricaoResumo";
import CMVResumo from "./CMVResumo";
import ProducaoResumo from "./ProducaoResumo";
import RotuloPreview from "./RotuloPreview";

export default function FoodCoreTab() {
  return (
    <div className="foodcore-page">

      <section className="foodcore-hero">
        <div className="foodcore-hero-icon">
          🍳
        </div>

        <div>
          <span>Produção inteligente</span>

          <h2>FoodCore</h2>

          <p>
            Central de receitas, ingredientes, custos,
            rendimento, produção e rotulagem nutricional.
          </p>
        </div>
      </section>

      <div className="foodcore-grid foodcore-grid-top">
        <section className="foodcore-module foodcore-receita">
          <div className="foodcore-module-title">
            <span>01</span>

            <div>
              <h3>Receita</h3>
              <p>
                Estrutura e ficha técnica do produto.
              </p>
            </div>
          </div>

          <ReceitaEditor />
        </section>

        <section className="foodcore-module foodcore-ingredientes">
          <div className="foodcore-module-title">
            <span>02</span>

            <div>
              <h3>Ingredientes</h3>
              <p>
                Composição, quantidades e insumos.
              </p>
            </div>
          </div>

          <IngredientesGrid />
        </section>
      </div>

      <div className="foodcore-grid">
        <section className="foodcore-module">
          <div className="foodcore-module-title">
            <span>03</span>

            <div>
              <h3>Nutrição</h3>
              <p>
                Resumo nutricional calculado.
              </p>
            </div>
          </div>

          <NutricaoResumo />
        </section>

        <section className="foodcore-module">
          <div className="foodcore-module-title">
            <span>04</span>

            <div>
              <h3>CMV</h3>
              <p>
                Custos e margem da receita.
              </p>
            </div>
          </div>

          <CMVResumo />
        </section>

        <section className="foodcore-module">
          <div className="foodcore-module-title">
            <span>05</span>

            <div>
              <h3>Produção</h3>
              <p>
                Peso final, rendimento e perdas.
              </p>
            </div>
          </div>

          <ProducaoResumo />
        </section>

        <section className="foodcore-module">
          <div className="foodcore-module-title">
            <span>06</span>

            <div>
              <h3>Rótulo ANVISA</h3>
              <p>
                Visualização da rotulagem nutricional.
              </p>
            </div>
          </div>

          <RotuloPreview />
        </section>
      </div>

    </div>
  );
}