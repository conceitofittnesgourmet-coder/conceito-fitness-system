import {

  useEffect,

  useState

} from "react";

import api
from "../services/api";

import AdminLayout
from "../layouts/AdminLayout";

function Estoque() {

  const [dados,
    setDados] =
    useState(null);





  async function
  carregar() {

    try {

      const response =
        await api.get(
          "/estoque"
        );





      setDados(
        response.data
      );

    } catch (error) {

      console.log(error);

    }

  }





  useEffect(() => {

    carregar();

  }, []);





  if (!dados) {

    return (

      <AdminLayout
        title="Estoque"
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

      title="Estoque Inteligente"

      subtitle="IA operacional"

    >

      {

        dados.alertas.length > 0 && (

          <div
            className="card"
            style={{
              border:
                "2px solid #ef4444"
            }}
          >

            <h2>
              Alertas IA
            </h2>





            {

              dados.alertas.map(

                (item) => (

                  <div
                    key={item._id}
                  >

                    🔥 {item.nome}
                    baixo estoque

                  </div>

                )

              )

            }

          </div>

        )

      }





      <section className="cards">

        {

          dados.itens.map(

            (item) => (

              <div
                key={item._id}
                className="card"
              >

                <h3>

                  {item.nome}

                </h3>





                <strong>

                  {item.quantidade}

                  {" "}

                  {item.unidade}

                </strong>

              </div>

            )

          )

        }

      </section>

    </AdminLayout>

  );

}

export default Estoque;