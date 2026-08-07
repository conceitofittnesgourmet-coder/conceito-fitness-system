import React from "react";

import ReceitaEditor from "./ReceitaEditor";
import IngredientesGrid from "./IngredientesGrid";
import NutricaoResumo from "./NutricaoResumo";
import CMVResumo from "./CMVResumo";
import ProducaoResumo from "./ProducaoResumo";
import RotuloPreview from "./RotuloPreview";

export default function FoodCoreTab() {

    return (

        <div className="space-y-6">

            <div className="rounded-lg border bg-white p-6 shadow-sm">

                <h2 className="text-2xl font-bold">

                    🍳 FoodCore

                </h2>

                <p className="mt-2 text-gray-600">

                    Central inteligente de receitas, produção,
                    CMV, ficha técnica e rotulagem.

                </p>

            </div>

            <ReceitaEditor />

            <IngredientesGrid />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                <NutricaoResumo />

                <CMVResumo />

            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                <ProducaoResumo />

                <RotuloPreview />

            </div>

        </div>

    );

}