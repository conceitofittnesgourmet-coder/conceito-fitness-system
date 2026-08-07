import React from "react";

export default function FoodCoreTab() {
    return (

        <div className="produto-aba-card">

            <h2>🍳 FoodCore</h2>

            <p>

                Central inteligente de produção.

            </p>

            <div className="foodcore-grid">

                <div className="foodcore-card">

                    <h3>Receita</h3>

                    <p>

                        Cadastro dos ingredientes.

                    </p>

                </div>

                <div className="foodcore-card">

                    <h3>CMV</h3>

                    <p>

                        Calculado automaticamente.

                    </p>

                </div>

                <div className="foodcore-card">

                    <h3>Tabela Nutricional</h3>

                    <p>

                        Calculada automaticamente.

                    </p>

                </div>

                <div className="foodcore-card">

                    <h3>Produção</h3>

                    <p>

                        Peso, rendimento e perdas.

                    </p>

                </div>

                <div className="foodcore-card">

                    <h3>Ficha Técnica</h3>

                    <p>

                        Gerada automaticamente.

                    </p>

                </div>

                <div className="foodcore-card">

                    <h3>Rótulos</h3>

                    <p>

                        Impressão pronta.

                    </p>

                </div>

            </div>

        </div>

    );
}