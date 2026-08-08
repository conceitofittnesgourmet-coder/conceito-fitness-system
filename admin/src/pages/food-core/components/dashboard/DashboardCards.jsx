import { useEffect, useState } from "react";
import api from "../../../../services/api";

export default function DashboardCards() {

    const [dados, setDados] = useState({

        totalProdutos: 0,

        totalReceitas: 0,

        produtosSemReceita: 0,

        cmvMedio: 0,

        custoTotal: 0,

        alertas: []

    });

    useEffect(() => {

        carregar();

    }, []);

    async function carregar() {

        try {

            const response =
                await api.get("/foodcore/resumo");

            setDados(response.data);

        } catch (err) {

            console.error(err);

        }

    }

    return (

        <div className="foodcore-dashboard-cards">

            <div className="foodcore-card">

                <h3>Produtos</h3>

                <h1>{dados.totalProdutos}</h1>

            </div>

            <div className="foodcore-card">

                <h3>Receitas</h3>

                <h1>{dados.totalReceitas}</h1>

            </div>

            <div className="foodcore-card">

                <h3>Sem Receita</h3>

                <h1>{dados.produtosSemReceita}</h1>

            </div>

            <div className="foodcore-card">

                <h3>CMV Médio</h3>

                <h1>{dados.cmvMedio}%</h1>

            </div>

            <div className="foodcore-card">

                <h3>Custo Total</h3>

                <h1>R$ {dados.custoTotal}</h1>

            </div>

            <div className="foodcore-card">

                <h3>Alertas</h3>

                <h1>{dados.alertas.length}</h1>

            </div>

        </div>

    );

}