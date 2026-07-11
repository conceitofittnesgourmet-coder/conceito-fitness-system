import { useEffect, useMemo, useState } from "react";
import {
  FaCheck,
  FaClock,
  FaFire,
  FaPrint,
  FaSyncAlt,
  FaUtensils,
} from "react-icons/fa";

import AdminLayout from "../layouts/AdminLayout";
import socket from "../services/socket";
import api from "../services/api";
import "../styles/cozinha.css";

const COLUNAS = [
  {
    id: "pendente",
    titulo: "Aguardando",
    descricao: "Pedidos aguardando início",
  },
  {
    id: "producao",
    titulo: "Em produção",
    descricao: "Pedidos sendo preparados",
  },
  {
    id: "pronto",
    titulo: "Prontos",
    descricao: "Aguardando retirada ou entrega",
  },
];

function Cozinha() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agora, setAgora] = useState(Date.now());
  const [atualizandoId, setAtualizandoId] = useState(null);

  async function carregarPedidos({ silencioso = false } = {}) {
    try {
      if (!silencioso) {
        setLoading(true);
      }

      const response = await api.get("/pedidos");
      setPedidos(response.data.pedidos || []);
    } catch (error) {
      console.log("Erro ao carregar pedidos da cozinha:", error);

      if (!silencioso) {
        alert("Não foi possível carregar os pedidos da cozinha.");
      }
    } finally {
      if (!silencioso) {
        setLoading(false);
      }
    }
  }

  async function atualizarStatus(id, status) {
    try {
      setAtualizandoId(id);

      await api.put(`/pedidos/${id}/status`, {
        status,
      });

      setPedidos((listaAtual) =>
        listaAtual.map((pedido) =>
          pedido._id === id
            ? {
                ...pedido,
                status,
              }
            : pedido
        )
      );
    } catch (error) {
      console.log("Erro ao atualizar status do pedido:", error);

      alert(
        error.response?.data?.message ||
          "Não foi possível atualizar o status do pedido."
      );
    } finally {
      setAtualizandoId(null);
    }
  }

  useEffect(() => {
    carregarPedidos();

    function receberNovoPedido(pedido) {
      setPedidos((listaAtual) => {
        const jaExiste = listaAtual.some((item) => item._id === pedido._id);

        if (jaExiste) {
          return listaAtual;
        }

        return [pedido, ...listaAtual];
      });

      try {
        const audio = new Audio("/sounds/novo-pedido.mp3");
        audio.play().catch(() => {});
      } catch (error) {
        console.log("Não foi possível tocar o alerta:", error);
      }
    }

    function atualizarPedidoSocket(pedidoAtualizado) {
      if (!pedidoAtualizado?._id) {
        carregarPedidos({ silencioso: true });
        return;
      }

      setPedidos((listaAtual) => {
        const existe = listaAtual.some(
          (pedido) => pedido._id === pedidoAtualizado._id
        );

        if (!existe) {
          return [pedidoAtualizado, ...listaAtual];
        }

        return listaAtual.map((pedido) =>
          pedido._id === pedidoAtualizado._id
            ? {
                ...pedido,
                ...pedidoAtualizado,
              }
            : pedido
        );
      });
    }

    socket.on("novo_pedido", receberNovoPedido);
    socket.on("novo-pedido", receberNovoPedido);
    socket.on("pedido-atualizado", atualizarPedidoSocket);

    return () => {
      socket.off("novo_pedido", receberNovoPedido);
      socket.off("novo-pedido", receberNovoPedido);
      socket.off("pedido-atualizado", atualizarPedidoSocket);
    };
  }, []);

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setAgora(Date.now());
    }, 30000);

    return () => window.clearInterval(intervalo);
  }, []);

  const pedidosAtivos = useMemo(() => {
    return pedidos
      .filter(
        (pedido) =>
          pedido.status !== "entregue" && pedido.status !== "cancelado"
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [pedidos]);

  function pedidosDaColuna(status) {
    return pedidosAtivos.filter((pedido) => {
      const statusPedido = pedido.status || "pendente";

      if (status === "pendente") {
        return statusPedido === "pendente";
      }

      return statusPedido === status;
    });
  }

  function tempoPedido(data) {
    if (!data) return 0;

    const criado = new Date(data).getTime();

    if (Number.isNaN(criado)) return 0;

    return Math.max(0, Math.floor((agora - criado) / 60000));
  }

  function imprimirPedido(pedido) {
    const configuracoesProdutos = (pedido.produtos || [])
      .map((produto) => {
        const configuracoes = (produto.configuracoes || [])
          .map(
            (config) =>
              `<li><strong>${config.grupo || "Opção"}:</strong> ${
                config.opcao || "-"
              }</li>`
          )
          .join("");

        return `
          <section class="produto">
            <h3>${Number(produto.quantidade || 1)}x ${produto.nome || "Produto"}</h3>

            ${
              configuracoes
                ? `<ul>${configuracoes}</ul>`
                : "<p>Sem configurações adicionais.</p>"
            }
          </section>
        `;
      })
      .join("");

    const janela = window.open("", "_blank", "width=720,height=900");

    if (!janela) {
      alert("O navegador bloqueou a janela de impressão.");
      return;
    }

    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Produção - Pedido ${pedido.numeroPedido || ""}</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #111;
            }

            h1, h2, h3, p {
              margin: 0;
            }

            .cabecalho {
              border-bottom: 2px solid #111;
              padding-bottom: 14px;
              margin-bottom: 20px;
            }

            .cabecalho h1 {
              font-size: 26px;
            }

            .cabecalho p {
              margin-top: 6px;
            }

            .produto {
              border-bottom: 1px dashed #777;
              padding: 16px 0;
            }

            .produto h3 {
              font-size: 20px;
              margin-bottom: 10px;
            }

            ul {
              margin: 0;
              padding-left: 22px;
            }

            li {
              margin-bottom: 6px;
            }

            .observacao {
              margin-top: 20px;
              padding: 14px;
              border: 2px solid #111;
            }

            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          <div class="cabecalho">
            <h1>Pedido #${
              pedido.numeroPedido || pedido._id?.slice(-6) || "-"
            }</h1>

            <p><strong>Cliente:</strong> ${pedido.cliente || "Cliente"}</p>
            <p><strong>Tipo:</strong> ${pedido.tipo || "Balcão"}</p>
            <p><strong>Mesa:</strong> ${pedido.mesa || "-"}</p>
          </div>

          ${configuracoesProdutos}

          ${
            pedido.observacao
              ? `<div class="observacao"><strong>Observação:</strong><br />${pedido.observacao}</div>`
              : ""
          }

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    janela.document.close();
  }

  function proximaAcao(pedido) {
    if (pedido.status === "pendente") {
      return {
        label: "Iniciar produção",
        status: "producao",
        icon: <FaFire />,
      };
    }

    if (pedido.status === "producao") {
      return {
        label: "Marcar como pronto",
        status: "pronto",
        icon: <FaCheck />,
      };
    }

    if (pedido.status === "pronto") {
      return {
        label: "Entregar pedido",
        status: "entregue",
        icon: <FaCheck />,
      };
    }

    return null;
  }

  return (
    <AdminLayout
      title="Cozinha"
      subtitle="Pedidos e produção em tempo real"
    >
      <div className="cozinha-page">
        <section className="cozinha-hero">
          <div>
            <span>Central da cozinha</span>
            <h1>Produção ao vivo</h1>
            <p>
              Acompanhe pedidos, configurações, tempo de preparo e andamento da
              operação.
            </p>
          </div>

          <div className="cozinha-hero-actions">
            <div className="cozinha-resumo">
              <strong>{pedidosAtivos.length}</strong>
              <span>pedidos ativos</span>
            </div>

            <button
              type="button"
              onClick={() => carregarPedidos()}
              disabled={loading}
            >
              <FaSyncAlt className={loading ? "girando" : ""} />
              Atualizar
            </button>
          </div>
        </section>

        {loading ? (
          <div className="cozinha-loading">
            Carregando pedidos da cozinha...
          </div>
        ) : (
          <div className="cozinha-kanban">
            {COLUNAS.map((coluna) => {
              const pedidosColuna = pedidosDaColuna(coluna.id);

              return (
                <section className="cozinha-coluna" key={coluna.id}>
                  <header className="cozinha-coluna-header">
                    <div>
                      <h2>{coluna.titulo}</h2>
                      <p>{coluna.descricao}</p>
                    </div>

                    <strong>{pedidosColuna.length}</strong>
                  </header>

                  <div className="cozinha-coluna-lista">
                    {pedidosColuna.length === 0 && (
                      <div className="cozinha-coluna-vazia">
                        <FaUtensils />
                        <span>Nenhum pedido nesta etapa.</span>
                      </div>
                    )}

                    {pedidosColuna.map((pedido) => {
                      const minutos = tempoPedido(pedido.createdAt);
                      const tempoPrevisto = Number(
                        pedido.tempoPrevisto || 18
                      );
                      const atrasado = minutos > tempoPrevisto;
                      const acao = proximaAcao(pedido);

                      return (
                        <article
                          className={`cozinha-pedido-card ${
                            atrasado ? "atrasado" : ""
                          }`}
                          key={pedido._id}
                        >
                          <div className="cozinha-pedido-top">
                            <div>
                              <span>
                                Pedido #
                                {pedido.numeroPedido ||
                                  pedido._id?.slice(-6)}
                              </span>

                              <h3>{pedido.cliente || "Cliente"}</h3>

                              <small>
                                {pedido.tipo || "balcao"}
                                {pedido.mesa ? ` · Mesa ${pedido.mesa}` : ""}
                              </small>
                            </div>

                            <div
                              className={`cozinha-tempo ${
                                atrasado ? "atrasado" : ""
                              }`}
                            >
                              <FaClock />
                              <strong>{minutos} min</strong>
                              <span>Previsto: {tempoPrevisto} min</span>
                            </div>
                          </div>

                          <div className="cozinha-produtos">
                            {(pedido.produtos || []).map(
                              (produto, produtoIndex) => (
                                <div
                                  className="cozinha-produto"
                                  key={`${pedido._id}-${produtoIndex}`}
                                >
                                  <strong>
                                    {Number(produto.quantidade || 1)}x{" "}
                                    {produto.nome}
                                  </strong>

                                  {produto.configuracoes?.length > 0 && (
                                    <div className="cozinha-configuracoes">
                                      {produto.configuracoes.map(
                                        (config, configIndex) => (
                                          <div
                                            key={`${produtoIndex}-${configIndex}`}
                                          >
                                            <span>
                                              {config.grupo || "Opção"}
                                            </span>

                                            <strong>
                                              {config.opcao || "-"}
                                            </strong>

                                            {Number(config.valor || 0) > 0 && (
                                              <small>
                                                + R${" "}
                                                {Number(
                                                  config.valor
                                                ).toFixed(2)}
                                              </small>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>

                          {pedido.observacao && (
                            <div className="cozinha-observacao">
                              <strong>Observação</strong>
                              <p>{pedido.observacao}</p>
                            </div>
                          )}

                          <div className="cozinha-pedido-actions">
                            {acao && (
                              <button
                                type="button"
                                className="acao-principal"
                                disabled={atualizandoId === pedido._id}
                                onClick={() =>
                                  atualizarStatus(
                                    pedido._id,
                                    acao.status
                                  )
                                }
                              >
                                {acao.icon}

                                {atualizandoId === pedido._id
                                  ? "Atualizando..."
                                  : acao.label}
                              </button>
                            )}

                            <button
                              type="button"
                              className="acao-imprimir"
                              onClick={() => imprimirPedido(pedido)}
                            >
                              <FaPrint />
                              Imprimir
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Cozinha;