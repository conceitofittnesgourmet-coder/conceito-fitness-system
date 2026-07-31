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
  configuracoesAgrupadas,
  imprimirComandaPedido,
  resumoOpcao,
} from "../utils/personalizacaoPedido";

import {

  FaCheck,

  FaFire,

  FaTruck,

  FaClock,

  FaPrint

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

  function imprimirCupom(pedido) {
    try {
      imprimirComandaPedido(pedido, { titulo: "COMANDA DE PEDIDO" });
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Não foi possível abrir a impressão");
    }
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

  async function atualizarStatus(id, status) {
  try {
    await api.put(
      `/pedidos/${id}/status`,
      { status }
    );

    toast.success("Status atualizado");

    carregarPedidos();

  } catch (error) {
    console.log(error);

    toast.error(
      "Erro ao atualizar status"
    );
  }
}



async function cancelarPedido(id) {

  const confirmar = window.confirm(
    "Deseja realmente cancelar esta venda?"
  );

  if (!confirmar) return;

  try {

    await api.put(
      `/pedidos/${id}/cancelar`
    );

    toast.success(
      "Venda cancelada com sucesso"
    );

    carregarPedidos();

  } catch (error) {

    console.log(error);

    toast.error(
      "Erro ao cancelar venda"
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
                        className="produto-pedido produto-pedido-personalizado"
                      >
                        <div className="produto-pedido-linha">
                          <span>{produto.nome}</span>
                          <strong>x{produto.quantidade}</strong>
                        </div>

                        {configuracoesAgrupadas(produto).length > 0 && (
                          <div className="pedido-personalizacoes">
                            {configuracoesAgrupadas(produto).map(({ grupo, opcoes }) => (
                              <div key={`${grupo}-${index}`} className="pedido-personalizacao-grupo">
                                <b>{grupo}:</b>
                                <span>{opcoes.map(resumoOpcao).join(", ")}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {produto.observacaoItem && (
                          <div className="pedido-observacao-item">
                            <strong>OBS DO ITEM:</strong> {produto.observacaoItem}
                          </div>
                        )}
                      </div>

                    )

                  )

                }

              </div>





              {/* BOTÕES */}

              <div className="pedido-actions pedido-actions-premium">
  <button
    className="btn-imprimir-comanda"
    onClick={() => imprimirCupom(pedido)}
    title="Imprimir comanda com personalizações"
  >
    <FaPrint />
    Comanda
  </button>

  {pedido.status !== "cancelado" && (
    <>
      <button
        className="btn-producao"
        onClick={() => atualizarStatus(pedido._id, "producao")}
      >
        <FaFire />
        Produção
      </button>

      <button
        className="btn-pronto"
        onClick={() => atualizarStatus(pedido._id, "pronto")}
      >
        <FaCheck />
        Pronto
      </button>

      <button
        className="btn-entregue"
        onClick={() => atualizarStatus(pedido._id, "entregue")}
      >
        <FaTruck />
        Entregue
      </button>

      <button
        className="btn-cancelar"
        onClick={() => cancelarPedido(pedido._id)}
      >
        ❌ Cancelar
      </button>
    </>
  )}

  {pedido.status === "cancelado" && (
    <button
      className="btn-cancelado"
      disabled
    >
      Venda cancelada
    </button>
  )}

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
