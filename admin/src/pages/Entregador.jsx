import { useEffect, useState } from "react";
import api from "../services/api";
import socket from "../services/socket";
import { NavLink } from "react-router-dom";

import {
  FaMotorcycle,
  FaShoppingBag,
  FaClock,
  FaStar,
  FaDollarSign,
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
  FaCheck,
  FaExclamationTriangle,
  FaRoute,
  FaList,
} from "react-icons/fa";

function Entregador() {
  const [pedidos, setPedidos] = useState([]);
  const [entregaAtiva, setEntregaAtiva] = useState(null);

  async function carregarPedidos() {
    try {
      const response = await api.get("/pedidos");

      const todos = response.data.pedidos || [];

      setPedidos(
        todos.filter(
          (pedido) =>
            pedido.status === "pronto" ||
            pedido.status === "entregando"
        )
      );

      const ativa = todos.find(
        (pedido) => pedido.status === "entregando"
      );

      setEntregaAtiva(ativa || null);
    } catch (error) {
      console.log(error);
    }
  }

  async function aceitarEntrega(id) {
    try {
      await api.put(`/pedidos/${id}/status`, {
        status: "entregando",
      });

      carregarPedidos();
    } catch (error) {
      console.log(error);
    }
  }

  async function finalizarEntrega(id) {
    try {
      await api.put(`/pedidos/${id}/status`, {
        status: "entregue",
      });

      carregarPedidos();
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    carregarPedidos();

    socket.on("pedido-atualizado", carregarPedidos);
    socket.on("novo-pedido", carregarPedidos);

    return () => {
      socket.off("pedido-atualizado", carregarPedidos);
      socket.off("novo-pedido", carregarPedidos);
    };
  }, []);

  const disponiveis = pedidos.filter(
    (pedido) => pedido.status === "pronto"
  );

  const totalHoje = pedidos.length;

  const ganhoHoje = pedidos.reduce(
    (acc, pedido) =>
      acc + Number(pedido.total || 0) * 0.12,
    0
  );

  const pedidoDestaque =
    entregaAtiva || disponiveis[0];

  return (
    <div className="entregador-premium-page">
      <aside className="entregador-side">
        <div className="entregador-brand">
          <div className="brand-bike">
            <FaMotorcycle />
          </div>

          <div>
            <h2>Conceito</h2>
            <strong>Fitness Gourmet</strong>
          </div>
        </div>

        <nav className="entregador-nav">
  <span>NAVEGAÇÃO</span>

  <NavLink to="/dashboard">
    Painel
  </NavLink>

  <NavLink to="/pedidos">
    Pedidos
  </NavLink>

  <NavLink to="/cardapio">
    Cardápio
  </NavLink>

  <NavLink to="/entregador">
    Entregas
  </NavLink>

  <NavLink to="/historico">
    Histórico
  </NavLink>

  <NavLink to="/avaliacoes">
    Avaliações
  </NavLink>

  <NavLink to="/configuracoes">
    Configurações
  </NavLink>
</nav>

        <div className="entregador-profile">
          <div className="avatar-entregador">
            <FaMotorcycle />
          </div>

          <div>
            <span>Entregador</span>
            <strong>Equipe Conceito</strong>
            <small>Online</small>
          </div>
        </div>

        <button className="offline-btn">
          Ficar Offline
        </button>
      </aside>

      <main className="entregador-main">
        <header className="entregador-header">
          <div className="header-left">
            <div className="header-icon-entrega">
              <FaMotorcycle />
            </div>

            <div>
              <h1>Entregas</h1>

              <p>
                Gerencie suas entregas em tempo real
              </p>
            </div>
          </div>

          <div className="entregador-online">
            <span></span>

            <div>
              <strong>Online</strong>

              <small>
                Disponível para entregas
              </small>
            </div>
          </div>
        </header>

        <section className="entregador-kpis">
          <div className="entrega-kpi green">
            <FaShoppingBag />

            <span>Disponíveis</span>

            <strong>
              {disponiveis.length}
            </strong>

            <p>Novos pedidos</p>
          </div>

          <div className="entrega-kpi blue">
            <FaMotorcycle />

            <span>Em andamento</span>

            <strong>
              {entregaAtiva ? 1 : 0}
            </strong>

            <p>Entrega ativa</p>
          </div>

          <div className="entrega-kpi yellow">
            <FaClock />

            <span>Hoje</span>

            <strong>{totalHoje}</strong>

            <p>Entregas realizadas</p>
          </div>

          <div className="entrega-kpi purple">
            <FaStar />

            <span>Avaliação</span>

            <strong>4.9</strong>

            <p>★★★★★</p>
          </div>

          <div className="entrega-kpi green">
            <FaDollarSign />

            <span>Ganhos hoje</span>

            <strong>
              R$ {ganhoHoje.toFixed(2)}
            </strong>

            <p>+18% vs ontem</p>
          </div>
        </section>

        <section className="entregador-content">
          <div className="pedidos-disponiveis">
            <div className="section-title">
              <h2>
                Pedidos disponíveis
              </h2>

              <span>
                {disponiveis.length}
              </span>
            </div>

            <div className="lista-pedidos-entrega">
              {disponiveis.map((pedido) => (
                <div
                  key={pedido._id}
                  className="pedido-disponivel-card"
                >
                  <div className="pedido-top">
                    <strong>
                      #PED-
                      {pedido._id.slice(-4)}
                    </strong>

                    <small>Agora</small>
                  </div>

                  <div className="pedido-user">
                    <FaUser />

                    <span>
                      {pedido.cliente ||
                        "Cliente"}
                    </span>
                  </div>

                  <div className="pedido-user">
                    <FaMapMarkerAlt />

                    <span>
                      {pedido.endereco ||
                        "Endereço não informado"}
                    </span>
                  </div>

                  <div className="pedido-bottom">
                    <div>
                      <strong>
                        R$
                        {Number(
                          pedido.total || 0
                        ).toFixed(2)}
                      </strong>

                      <small>2.1 km</small>
                    </div>

                    <button
                      onClick={() =>
                        aceitarEntrega(
                          pedido._id
                        )
                      }
                    >
                      Aceitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="entrega-ativa-panel">
            <div className="section-title">
              <h2>
                Entrega em andamento
              </h2>

              <span>
                {entregaAtiva ? 1 : 0}
              </span>
            </div>

            {pedidoDestaque ? (
              <>
                <div className="entrega-info">
                  <div className="entrega-dados">
                    <div className="pedido-status">
                      <strong>
                        #PED-
                        {pedidoDestaque._id.slice(
                          -4
                        )}
                      </strong>

                      <span>
                        Em andamento
                      </span>
                    </div>

                    <div className="pedido-user">
                      <FaUser />

                      <span>
                        {pedidoDestaque.cliente ||
                          "Cliente"}
                      </span>
                    </div>

                    <div className="pedido-user">
                      <FaPhone />

                      <span>
                        {pedidoDestaque.telefone ||
                          "(44) 99999-9999"}
                      </span>
                    </div>

                    <div className="pedido-user">
                      <FaMapMarkerAlt />

                      <span>
                        {pedidoDestaque.endereco ||
                          "Endereço não informado"}
                      </span>
                    </div>

                    <div className="pedido-itens">
                      <h4>
                        Itens do pedido
                      </h4>

                      {pedidoDestaque.itens?.map(
                        (item, index) => (
                          <p key={index}>
                            •{" "}
                            {item.nome ||
                              "Produto"}{" "}
                            x
                            {item.quantidade ||
                              1}
                          </p>
                        )
                      )}
                    </div>
                  </div>

                  <div className="mapa-entrega">
                    <div className="map-overlay">
                      <FaRoute />

                      <span>
                        Rota em tempo real
                      </span>
                    </div>
                  </div>
                </div>

                <div className="entrega-actions-premium">
                  <button className="btn-cheguei">
                    <FaMapMarkerAlt />
                    Cheguei no local
                  </button>

                  <button
                    className="btn-entregue"
                    onClick={() =>
                      finalizarEntrega(
                        pedidoDestaque._id
                      )
                    }
                  >
                    <FaCheck />
                    Pedido Entregue
                  </button>

                  <button className="btn-problema">
                    <FaExclamationTriangle />
                    Problema na entrega
                  </button>
                </div>
              </>
            ) : (
              <div className="sem-entrega">
                <FaList />

                <h3>
                  Nenhuma entrega ativa
                </h3>

                <p>
                  Aceite um pedido para iniciar
                  uma entrega.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="footer-stats-entrega">
          <div>
            <span>Taxa de aceitação</span>
            <strong>92%</strong>
          </div>

          <div>
            <span>Entregas completas</span>
            <strong>156</strong>
          </div>

          <div>
            <span>Avaliação média</span>
            <strong>4.9 ★</strong>
          </div>

          <div>
            <span>Cancelamentos</span>
            <strong>2%</strong>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Entregador;