import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import socket from "../services/socket";

export default function Tracking() {

  const { id } = useParams();

  const [pedido, setPedido] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // ==========================================
  // CARREGAR PEDIDO
  // ==========================================

  async function carregarPedido() {

    try {

      const response =
        await api.get(
          `/pedidos/${id}`
        );

      setPedido(
        response.data.pedido
      );

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);

    }

  }

  // ==========================================
  // SOCKET REALTIME
  // ==========================================

  useEffect(() => {

    carregarPedido();

    socket.on(
      "pedido-atualizado",
      (pedidoAtualizado) => {

        if (
          pedidoAtualizado?._id === id
        ) {

          setPedido(
            pedidoAtualizado
          );

        }

      }
    );

    return () => {

      socket.off(
        "pedido-atualizado"
      );

    };

  }, [id]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div style={styles.center}>

        Carregando pedido...

      </div>

    );

  }

  // ==========================================
  // NÃO ENCONTRADO
  // ==========================================

  if (!pedido) {

    return (

      <div style={styles.center}>

        Pedido não encontrado

      </div>

    );

  }

  // ==========================================
  // STATUS COR
  // ==========================================

  function corStatus() {

    if (
      pedido?.status === "pendente"
    ) {
      return "#facc15";
    }

    if (
      pedido?.status === "producao"
    ) {
      return "#38bdf8";
    }

    if (
      pedido?.status === "pronto"
    ) {
      return "#22c55e";
    }

    if (
      pedido?.status === "entregue"
    ) {
      return "#10b981";
    }

    return "#64748b";

  }

  // ==========================================
  // STATUS TEXTO
  // ==========================================

  function textoStatus() {

    if (
      pedido?.status === "pendente"
    ) {
      return "PENDENTE";
    }

    if (
      pedido?.status === "producao"
    ) {
      return "EM PRODUÇÃO";
    }

    if (
      pedido?.status === "pronto"
    ) {
      return "PRONTO";
    }

    if (
      pedido?.status === "entregue"
    ) {
      return "ENTREGUE";
    }

    return "PROCESSANDO";

  }

  return (

    <div style={styles.page}>

      <h1 style={styles.title}>

        Acompanhar Pedido

      </h1>

      <div style={styles.card}>

        <h2>

          Pedido #

          {
            pedido?._id
              ?.slice(-6)
              ?.toUpperCase()
          }

        </h2>

        {/* CLIENTE */}

        <p style={styles.text}>

          <strong>Cliente:</strong>

          {" "}

          {
            pedido?.cliente ||
            pedido?.nome ||
            "Cliente"
          }

        </p>

        {/* TELEFONE */}

        <p style={styles.text}>

          <strong>Telefone:</strong>

          {" "}

          {
            pedido?.telefone ||
            "Não informado"
          }

        </p>

        {/* ITENS */}

        <h3 style={styles.section}>

          Itens

        </h3>

        {

          (
            pedido?.itens ||
            pedido?.produtos ||
            []
          ).map((item, index) => (

            <div
              key={index}
              style={styles.item}
            >

              <span>

                {
                  item.nome
                }

              </span>

              <strong>

                x
                {
                  item.quantidade
                }

              </strong>

            </div>

          ))

        }

        {/* TOTAL */}

        <div style={styles.total}>

          <span>Total:</span>

          <strong>

            R$

            {
              Number(
                pedido?.total || 0
              ).toFixed(2)
            }

          </strong>

        </div>

        {/* STATUS */}

        <h3 style={styles.section}>

          Status

        </h3>

        <div
          style={{
            ...styles.status,
            background:
              corStatus()
          }}
        >

          {
            textoStatus()
          }

        </div>

      </div>

    </div>

  );

}

// ==========================================
// ESTILOS
// ==========================================

const styles = {

  page: {

    minHeight: "100vh",

    background:
      "linear-gradient(to bottom, #020617, #0f172a)",

    padding: 40,

    color: "#fff",

    fontFamily: "Arial"

  },

  center: {

    minHeight: "100vh",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    background: "#020617",

    color: "#fff",

    fontSize: 28

  },

  title: {

    fontSize: 58,

    marginBottom: 30,

    fontWeight: "bold"

  },

  card: {

    background: "#111827",

    borderRadius: 24,

    padding: 40,

    maxWidth: 900,

    boxShadow:
      "0 20px 60px rgba(0,0,0,0.4)"

  },

  text: {

    marginTop: 10,

    fontSize: 24

  },

  section: {

    marginTop: 40,

    marginBottom: 20,

    fontSize: 32

  },

  item: {

    background: "#1f2937",

    padding: 20,

    borderRadius: 16,

    marginBottom: 14,

    display: "flex",

    justifyContent: "space-between",

    fontSize: 22

  },

  total: {

    marginTop: 30,

    background:
      "rgba(34,197,94,0.15)",

    padding: 24,

    borderRadius: 18,

    display: "flex",

    justifyContent: "space-between",

    fontSize: 30,

    fontWeight: "bold"

  },

  status: {

    marginTop: 20,

    padding: 26,

    borderRadius: 20,

    textAlign: "center",

    fontSize: 32,

    fontWeight: "bold",

    color: "#fff"

  }

};