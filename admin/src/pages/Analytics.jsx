import {

  useEffect,

  useState

} from "react";

import api
from "../services/api";

import AdminLayout
from "../layouts/AdminLayout";

function Analytics() {

  const [dados,
    setDados] =
    useState(null);





  async function
  carregarAnalytics() {

    try {

      const response =
        await api.get(
          "/analytics"
        );





      setDados(
        response.data
      );

    } catch (error) {

      console.log(error);

    }

  }





  useEffect(() => {

    carregarAnalytics();

  }, []);





  if (!dados) {

    return (

      <AdminLayout
        title="Analytics"
        subtitle="Carregando..."
      >

        <div className="card">

          <div className="loading-spinner" />

        </div>

      </AdminLayout>

    );

  }





  return (

    <AdminLayout

      title="Analytics IA"

      subtitle="Business Intelligence"

    >

      <section className="cards">

        <div className="card">

          <h3>
            Faturamento
          </h3>

          <strong>

            R$
            {dados.faturamento}

          </strong>

        </div>





        <div className="card">

          <h3>
            Pedidos
          </h3>

          <strong>

            {dados.totalPedidos}

          </strong>

        </div>





        <div className="card">

          <h3>
            Ticket Médio
          </h3>

          <strong>

            R$
            {dados.ticketMedio
              ?.toFixed(2)}

          </strong>

        </div>





        <div className="card">

          <h3>
            Produtos
          </h3>

          <strong>

            {dados.totalProdutos}

          </strong>

        </div>

      </section>





      <div
        className="card"
        style={{
          marginTop:"30px"
        }}
      >

        <h2>
          Top Produtos
        </h2>





        {

          dados.topProdutos?.map(

            (produto,index) => (

              <div
                key={index}
                style={{
                  marginTop:"12px"
                }}
              >

                <strong>

                  {produto[0]}

                </strong>

                {" - "}

                {produto[1]}
                vendas

              </div>

            )

          )

        }

        <div
  className="card"
  style={{
    marginTop:"30px"
  }}
>

  <h2>
    IA Analytics
  </h2>





  {

    dados.ia?.insights?.map(

      (

        insight,

        index

      ) => (

        <div

          key={index}

          style={{
            marginTop:"14px"
          }}
        >

          🔥 {insight}

        </div>

      )

    )

  }

</div>

      </div>

    </AdminLayout>

  );

}

export default Analytics;