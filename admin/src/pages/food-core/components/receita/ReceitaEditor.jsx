import { useState } from "react";
import useProdutos from "../../hooks/useProdutos";

import ReceitaToolbar from "./ReceitaToolbar";
import IngredientesTable from "./IngredientesTable";
import ResumoReceita from "../resumo/ResumoReceita";
import CMVPreview from "../resumo/CMVPreview";
import NutricaoPreview from "../resumo/NutricaoPreview";
import RotuloPreview from "../resumo/RotuloPreview";

export default function ReceitaEditor() {

    const [ingredientes, setIngredientes] = useState([]);
    const { produtos } = useProdutos();

    return (

        <div className="foodcore-editor">

            <ReceitaToolbar />

            <IngredientesTable
                ingredientes={ingredientes}
                setIngredientes={setIngredientes}
                produtos={produtos}
            />

            <ResumoReceita
                ingredientes={ingredientes}
            />

            <CMVPreview
                ingredientes={ingredientes}
            />

            <NutricaoPreview
                ingredientes={ingredientes}
            />

            <RotuloPreview
                ingredientes={ingredientes}
            />

        </div>

    );

}