import DeliveryMap from "../components/DeliveryMap";

import AdminLayout from "../layouts/AdminLayout";

import {
  FaMotorcycle,
  FaMapMarkedAlt,
  FaClock,
  FaRoute,
  FaCheckCircle,
  FaSignal,
  FaStar,
  FaUser,
} from "react-icons/fa";

function Logistica() {

  const entregadores = [

    {
      id: 1,
      nome: "Carlos",
      lat: -25.429,
      lng: -49.271,
      status: "online",
      entregas: 12,
      avaliacao: 4.9,
    },

    {
      id: 2,
      nome: "João",
      lat: -25.435,
      lng: -49.280,
      status: "entrega",
      entregas: 8,
      avaliacao: 4.8,
    },

  ];

  return (

    <AdminLayout
      title="Logística"
      subtitle="Tracking realtime"
    >

      <div className="logistica-premium">

        <div className="logistica-hero">

          <div>

            <span>
              Conceito Fitness Gourmet
            </span>

            <h1>
              Central de Logística
            </h1>

            <p>
              Controle completo das entregas em tempo real
            </p>

          </div>

          <div className="logistica-online">

            <span></span>

            Sistema Online

          </div>

        </div>

        <div className="logistica-kpis">

          <div className="logistica-kpi blue">

            <FaMotorcycle />

            <span>Entregadores</span>

            <strong>
              {entregadores.length}
            </strong>

            <p>Online agora</p>

          </div>

          <div className="logistica-kpi green">

            <FaCheckCircle />

            <span>Entregas Hoje</span>

            <strong>32</strong>

            <p>Finalizadas</p>

          </div>

          <div className="logistica-kpi yellow">

            <FaClock />

            <span>Tempo Médio</span>

            <strong>18min</strong>

            <p>Entrega média</p>

          </div>

          <div className="logistica-kpi purple">

            <FaRoute />

            <span>Rotas Ativas</span>

            <strong>6</strong>

            <p>Em andamento</p>

          </div>

        </div>

        <div className="logistica-grid">

          <div className="map-card-premium">

            <div className="section-header-premium">

              <div>

                <h2>
                  Mapa em Tempo Real
                </h2>

                <p>
                  Rastreamento ao vivo dos entregadores
                </p>

              </div>

              <FaMapMarkedAlt />

            </div>

            <div className="delivery-map-wrapper">

              <DeliveryMap
                entregadores={entregadores}
              />

            </div>

          </div>

          <div className="entregadores-side">

            <div className="section-header-premium">

              <div>

                <h2>
                  Equipe Online
                </h2>

                <p>
                  Status dos entregadores
                </p>

              </div>

              <FaSignal />

            </div>

            <div className="lista-entregadores">

              {

                entregadores.map(

                  (entregador) => (

                    <div
                      key={entregador.id}
                      className="entregador-card-premium"
                    >

                      <div className="entregador-avatar">

                        <FaUser />

                      </div>

                      <div className="entregador-info">

                        <strong>
                          {entregador.nome}
                        </strong>

                        <span>
                          {entregador.entregas} entregas hoje
                        </span>

                        <div className="avaliacao">

                          <FaStar />

                          {entregador.avaliacao}

                        </div>

                      </div>

                      <div className={`status-online ${entregador.status}`}>

                        {

                          entregador.status === "online"

                          ? "ONLINE"

                          : "ENTREGA"

                        }

                      </div>

                    </div>

                  )

                )

              }

            </div>

          </div>

        </div>

      </div>

    </AdminLayout>

  );

}

export default Logistica;