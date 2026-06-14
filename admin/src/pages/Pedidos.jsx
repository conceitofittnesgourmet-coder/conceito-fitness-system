import {

  showNotification

} from "../services/notification";

import {

  useEffect,

  useState,

  useRef

} from "react";

import toast from "react-hot-toast";


import socket from "../services/socket";

import api from "../services/api";

import AdminLayout
from "../layouts/AdminLayout";

import {

  FaCheck,

  FaFire,

  FaTruck,

  FaClock

} from "react-icons/fa";


function Pedidos() {

  // ==========================================
  // STATES
  // ==========================================

  const [pedidos, setPedidos] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [ultimoPedido,
    setUltimoPedido] =
    useState(null);

  const [pedidoPrint,
    setPedidoPrint] =
    useState(null);





  // ==========================================
  // REFS
  // ==========================================

  const cupomRef =
    useRef();





  // ==========================================
  // IMPRESSÃO
  // ==========================================

  function imprimirCupom(
  pedido
) {

  const janela =
    window.open(
      "",
      "_blank",
      "width=400,height=600"
    );





  janela.document.write(`

    <html>

      <head>

        <title>
          Pedido
        </title>

        <style>

          body{

            font-family:
              monospace;

            padding:20px;

          }

          h2,h3,p{

            margin:8px 0;

          }

          hr{

            margin:12px 0;

          }

        </style>

      </head>

      <body>

        <h2>
          CONCEITO FITNESS
        </h2>

        <hr />

        <p>

          Pedido:
          ${pedido._id?.slice(-6)}

        </p>

        <p>

          Cliente:
          ${pedido.cliente}

        </p>

        <p>

          Telefone:
          ${pedido.telefone}

        </p>

        <hr />

        <h3>
          ITENS
        </h3>

        ${pedido.produtos

          ?.map(

            (produto) => `

              <p>

                ${produto.nome}

                x${produto.quantidade}

              </p>

            `

          )

          .join("")}

        <hr />

        <h2>

          TOTAL:
          R$ ${pedido.total}

        </h2>

      </body>

    </html>

  `);





  janela.document.close();





  janela.print();

}




  // ==========================================
  // ÁUDIO
  // ==========================================

  const audio = new Audio(
    "/sounds/notification.mp3"
  );





  // ==========================================
  // CARREGAR PEDIDOS
  // ==========================================

  async function carregarPedidos() {

    try {

      const response =
        await api.get("/pedidos");





      setPedidos(
        response.data.pedidos || []
      );

    } catch (error) {

      console.log(error);





      toast.error(
        "Erro ao carregar pedidos"
      );

    } finally {

      setLoading(false);

    }

  }





  // ==========================================
  // STATUS
  // ==========================================

  async function atualizarStatus(

    id,

    status

  ) {

    try {

      await api.put(

        `/pedidos/${id}/status`,

        { status }

      );





      toast.success(
        "Status atualizado"
      );

    
      async function cancelarPedido(id) {
  const confirmar = window.confirm(
    "Deseja realmente cancelar esta venda?"
  );

  if (!confirmar) return;

  try {
    await api.put(`/pedidos/${id}/cancelar`);

    toast.success("Venda cancelada com sucesso");

    carregarPedidos();
  } catch (error) {
    console.log(error);

    toast.error("Erro ao cancelar venda");
  }
}



      carregarPedidos();

    } catch (error) {

      console.log(error);





      toast.error(
        "Erro ao atualizar status"
      );

    }

  }





  // ==========================================
  // SOCKET.IO
  // ==========================================

  useEffect(() => {

    carregarPedidos();





    socket.on(

      "novo-pedido",

      (pedido) => {

        carregarPedidos();





        setUltimoPedido(
          pedido._id
        );





        setPedidoPrint(
          pedido
        );





        audio.play();





        toast.success

          showNotification(

  "Novo Pedido",

  pedido.cliente

);





        setTimeout(() => {

          imprimirCupom(
  pedido
);

        }, 500);

      }

    );





    socket.on(

      "pedido-atualizado",

      () => {

        carregarPedidos();

      }

    );





    return () => {

      socket.off(
        "novo-pedido"
      );

      socket.off(
        "pedido-atualizado"
      );

    };

  }, []);





  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <AdminLayout
        title="Pedidos"
        subtitle="Carregando..."
      >

        <div className="card">

          <div className="loading-spinner" />

        </div>

      </AdminLayout>

    );

  }





  // ==========================================
  // MÉTRICAS
  // ==========================================

  const pendentes =
    pedidos.filter(

      (p) =>
        p.status ===
        "pendente"

    ).length;





  const producao =
    pedidos.filter(

      (p) =>
        p.status ===
        "producao"

    ).length;





  const prontos =
    pedidos.filter(

      (p) =>
        p.status ===
        "pronto"

    ).length;





  const entregues =
    pedidos.filter(

      (p) =>
        p.status ===
        "entregue"

    ).length;





  // ==========================================
  // RETURN
  // ==========================================

  return (

    <AdminLayout

      title="Pedidos"

      subtitle="Painel operacional realtime"

    >

<div className="pedidos-hero-premium">
  <div>
    <span>Conceito Fitness Gourmet</span>
    <h1>Central de Pedidos</h1>
    <p>
      Controle completo dos pedidos, produção, entrega e acompanhamento em tempo real.
    </p>
  </div>

  <div className="pedidos-online-premium">
    <span></span>
    Sistema Online
  </div>
</div>

      {/* CARDS */}

     <section className="pedidos-kpi-premium">

        <div className="pedido-kpi">
          <h3>
            Pendentes
          </h3>

          <strong>
            {pendentes}
          </strong>

        </div>





        <div className="pedido-kpi">

          <h3>
            Produção
          </h3>

          <strong>
            {producao}
          </strong>

        </div>





        <div className="pedido-kpi">

          <h3>
            Prontos
          </h3>

          <strong>
            {prontos}
          </strong>

        </div>





        <div className="pedido-kpi">

          <h3>
            Entregues
          </h3>

          <strong>
            {entregues}
          </strong>

        </div>

      </section>





      {/* GRID */}

      <div className="pedidos-grid-premium">

        {

          pedidos.map((pedido) => (

            <div

              key={pedido._id}

              className={`pedido-card pedido-card-premium ${
                ultimoPedido ===
                pedido._id
                  ? "pedido-novo"
                  : ""
              }`}

            >

<div className="pedido-qrcode-premium">

  <img

    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=http://localhost:5173/tracking/${pedido._id}`}

    alt="QR Code"

    className="qr-image"

  />





  <p>

    Acompanhar Pedido

  </p>

</div>

              {/* HEADER */}

              <div className="pedido-header pedido-card-header-premium">
                <div>

                  <h2>
                    {pedido.cliente}
                  </h2>





                  <p>

                    #{pedido._id.slice(-6)}

                  </p>

                </div>


                  {
  pedido.status === "cancelado" && (
    <span>❌</span>
  )
}


                <span

                    className={`status ${pedido.status}`}
                >

                  {

                    pedido.status ===
                    "pendente" && (

                      <FaClock />

                    )

                  }

                  {

                    pedido.status ===
                    "producao" && (

                      <FaFire />

                    )

                  }

                  {

                    pedido.status ===
                    "pronto" && (

                      <FaCheck />

                    )

                  }

                  {

                    pedido.status ===
                    "entregue" && (

                      <FaTruck />

                    )

                  }

                  {pedido.status}

                </span>

              </div>





              {/* INFO */}

              <div className="pedido-info pedido-info-premium">
              
                <p>

                  <strong>
                    Total:
                  </strong>

                  {" "}

                  R$
                  {pedido.total}

                </p>





                <p>

                  <strong>
                    Telefone:
                  </strong>

                  {" "}

                  {pedido.telefone}

                </p>

              </div>





              {/* PRODUTOS */}

              <div className="pedido-produtos pedido-produtos-premium">

                {

                  pedido.produtos?.map(

                    (

                      produto,

                      index

                    ) => (

                      <div

                        key={index}

                        className="produto-pedido"

                      >

                        <span>
                          {produto.nome}
                        </span>





                        <strong>

                          x
                          {produto.quantidade}

                        </strong>

                      </div>

                    )

                  )

                }

              </div>





              {/* BOTÕES */}

              <div className="pedido-actions pedido-actions-premium">

                <button

                  className="btn-producao"

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

                  className="btn-pronto"

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





                <button

                  className="btn-entregue"

                  onClick={() =>

                    atualizarStatus(

                      pedido._id,

                      "entregue"

                    )

                  }
                >
                  <button
  className="btn-cancelar"
  disabled={pedido.status === "entregue"}
  onClick={() =>
    cancelarPedido(pedido._id)
  }
>
  ❌ Cancelar
</button>

                

                  <FaTruck />

                  Entregue

                </button>

              </div>

            </div>

          ))

        }

      </div>





      {/* IMPRESSÃO */}

      

    </AdminLayout>

  );

}

export default Pedidos;
