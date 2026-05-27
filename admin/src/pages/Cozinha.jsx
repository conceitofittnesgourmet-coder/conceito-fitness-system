import {

  useEffect,

  useState

} from "react";

import socket
from "../services/socket";

import api
from "../services/api";

import {

  FaFire,

  FaCheck

} from "react-icons/fa";

function Cozinha() {

  const [pedidos,
    setPedidos] =
    useState([]);





  async function
  carregarPedidos() {

    try {

      const response =
        await api.get(
          "/pedidos"
        );





      setPedidos(

        response.data.pedidos || []

      );

    } catch (error) {

      console.log(error);

    }

  }





  async function
  atualizarStatus(

    id,

    status

  ) {

    try {

      await api.put(

        `/pedidos/${id}/status`,

        { status }

      );





      carregarPedidos();

    } catch (error) {

      console.log(error);

    }

  }





  useEffect(() => {
  socket.on("novo_pedido", (pedido) => {

    setPedidos((old) => [pedido, ...old]);

    const audio = new Audio("/sounds/novo-pedido.mp3");

    audio.play();
  });

  return () => {
    socket.off("novo_pedido");
  };
}, []);





  return (

    <div className="cozinha">

      <div className="cozinha-header">

        <h1>
          Produção Ao Vivo
        </h1>

      </div>





      <div className="cozinha-grid">

        {

          pedidos

            .filter(

              (pedido) =>

                pedido.status !==
                "entregue"

            )

            .map((pedido) => (

              <div

                key={pedido._id}

               className={`cozinha-card

${pedido.status}

${tempoPedido(
  pedido.createdAt
) > 15
? "atrasado"
: ""}

`}

              >

                <div className="cozinha-top">

                  <h2>

                    {pedido.cliente}

                  </h2>
                  <p className="tempo">

  {tempoPedido(
    pedido.createdAt
  )} min

</p>





                  <span>

                    #

                    {pedido._id.slice(-6)}

                  </span>

                </div>





                <div className="cozinha-produtos">

                  {

                    pedido.produtos?.map(

                      (

                        produto,

                        index

                      ) => (

                        <div
                          key={index}
                        >

                          <strong>

                            {produto.quantidade}x

                          </strong>

                          {" "}

                          {produto.nome}

                        </div>

                      )

                    )

                  }

                </div>





                <div className="cozinha-footer">

                  <button

                    className="btn-fire"

                    onClick={() =>

                      atualizarStatus(

                        pedido._id,

                        "producao"

                      )

                    }

                  >

                    <FaFire />

                    Produção

                  </button>





                  <button

                    className="btn-ready"

                    onClick={() =>

                      atualizarStatus(

                        pedido._id,

                        "pronto"

                      )

                    }

                  >

                    <FaCheck />

                    Pronto

                  </button>

                </div>

              </div>

            ))

        }

      </div>

    </div>

  );

}

function tempoPedido(
  data
) {

  const agora =
    new Date();





  const criado =
    new Date(data);





  const diff = Math.floor(

    (agora - criado)

    / 1000

    / 60

  );





  return diff;

}

export default Cozinha;
