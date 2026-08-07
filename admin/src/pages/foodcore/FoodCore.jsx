import { useState } from "react";

import Receitas from "./Receitas";

export default function FoodCore() {

    const [aba, setAba] = useState("receitas");

    return (

        <div className="foodcore-page">

            <header className="foodcore-header">

                <h1>🍳 FoodCore Enterprise</h1>

                <p>

                    Inteligência de Produção

                </p>

            </header>

            <div className="foodcore-menu">

                <button
                    onClick={() => setAba("receitas")}
                >
                    Receitas
                </button>

                <button
                    onClick={() => setAba("ingredientes")}
                >
                    Ingredientes
                </button>

                <button
                    onClick={() => setAba("dashboard")}
                >
                    Dashboard
                </button>

            </div>

            {

                aba === "receitas" &&

                <Receitas />

            }

        </div>

    );

}