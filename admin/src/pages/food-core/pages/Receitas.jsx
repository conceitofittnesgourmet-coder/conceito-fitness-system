import { useEffect, useState } from "react";

import api from "../../../services/api";

export default function Receitas() {

    const [receitas, setReceitas] = useState([]);

    async function carregar() {

        const { data } =
            await api.get("/recipes");

        setReceitas(
            data.data || []
        );

    }

    useEffect(() => {

        carregar();

    }, []);

    return (

        <div>

            <h2>

                Receitas

            </h2>

            <p>

                Total:

                {" "}

                {receitas.length}

            </p>

        </div>

    );

}