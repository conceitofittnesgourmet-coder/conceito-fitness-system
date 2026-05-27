import {
  useEffect,
  useState
} from "react";

import {
  ShoppingCart,
  Store,
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  Clock3,
  AlertTriangle
} from "lucide-react";

import api from "../services/api";
import AdminLayout from "../layouts/AdminLayout";

function MasterDashboard() {

  const [dados, setDados] = useState(null);

  async function carregar() {

    try {

      const response =
        await api.get(
          "/master/dashboard"
        );

      setDados(response.data);

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
        title="Master SaaS"
        subtitle="Carregando painel..."
      >

        <div className="premium-loading">

          <div className="loader"></div>

          <h2>Carregando dashboard...</h2>

        </div>

      </AdminLayout>

    );

  }

  return (

    <AdminLayout
      title="Painel Administrativo"
      subtitle="Controle total da operação gourmet"
    >

      <div className="dashboard-header">

        <div>

          <h1>
            Dashboard Premium
          </h1>

          <p>
            Gestão completa da plataforma
          </p>

        </div>

        <div className="online-status">

          <span className="dot"></span>

          Sistema Online

        </div>

      </div>

      <section className="stats-grid">

        <div className="premium-card">

          <div className="card-icon green">

            <Store size={24} />

          </div>

          <div>

            <span>Empresas</span>

            <strong>
              {dados.empresas || 0}
            </strong>

          </div>

        </div>

        <div className="premium-card">

          <div className="card-icon blue">

            <ShoppingCart size={24} />

          </div>

          <div>

            <span>Pedidos</span>

            <strong>
              {dados.pedidos || 0}
            </strong>

          </div>

        </div>

        <div className="premium-card">

          <div className="card-icon purple">

            <Users size={24} />

          </div>

          <div>

            <span>Empresas Ativas</span>

            <strong>
              {dados.empresasAtivas || 0}
            </strong>

          </div>

        </div>

        <div className="premium-card">

          <div className="card-icon gold">

            <DollarSign size={24} />

          </div>

          <div>

            <span>Faturamento</span>

            <strong>
              R$ {dados.faturamento || 0}
            </strong>

          </div>

        </div>

      </section>

      <section className="dashboard-grid">

        <div className="big-card">

          <div className="card-top">

            <h2>
              Performance Hoje
            </h2>

            <TrendingUp size={20} />

          </div>

          <div className="performance-grid">

            <div className="mini-card">

              <Activity size={18} />

              <span>Pedidos Hoje</span>

              <strong>
                {dados.pedidosHoje || 0}
              </strong>

            </div>

            <div className="mini-card">

              <Clock3 size={18} />

              <span>Tempo Médio</span>

              <strong>
                18 min
              </strong>

            </div>

            <div className="mini-card">

              <AlertTriangle size={18} />

              <span>Alertas</span>

              <strong>
                0
              </strong>

            </div>

          </div>

        </div>

        <div className="big-card">

          <div className="card-top">

            <h2>
              Status do Sistema
            </h2>

          </div>

          <div className="system-status">

            <div className="status-item">

              <span>Servidor</span>

              <strong className="success">
                Online
              </strong>

            </div>

            <div className="status-item">

              <span>API</span>

              <strong className="success">
                Funcionando
              </strong>

            </div>

            <div className="status-item">

              <span>Banco de Dados</span>

              <strong className="success">
                Conectado
              </strong>

            </div>

            <div className="status-item">

              <span>Realtime</span>

              <strong className="success">
                Ativo
              </strong>

            </div>

          </div>

        </div>

      </section>

      <style jsx>{`

        .dashboard-header {

          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;

        }

        .dashboard-header h1 {

          color: white;
          font-size: 38px;
          font-weight: 800;

        }

        .dashboard-header p {

          color: #94a3b8;
          margin-top: 5px;

        }

        .online-status {

          display: flex;
          align-items: center;
          gap: 10px;
          color: #22c55e;
          font-weight: 700;

        }

        .dot {

          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #22c55e;

        }

        .stats-grid {

          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 30px;

        }

        .premium-card {

          background:
          linear-gradient(
            145deg,
            rgba(15,23,42,0.98),
            rgba(30,41,59,0.95)
          );

          border: 1px solid rgba(255,255,255,0.05);

          border-radius: 24px;

          padding: 24px;

          display: flex;
          align-items: center;
          gap: 20px;

          backdrop-filter: blur(18px);

          box-shadow:
          0 10px 30px rgba(0,0,0,0.25);

        }

        .card-icon {

          width: 60px;
          height: 60px;
          border-radius: 18px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: white;

        }

        .green {

          background: linear-gradient(
            135deg,
            #22c55e,
            #16a34a
          );

        }

        .blue {

          background: linear-gradient(
            135deg,
            #3b82f6,
            #2563eb
          );

        }

        .purple {

          background: linear-gradient(
            135deg,
            #8b5cf6,
            #7c3aed
          );

        }

        .gold {

          background: linear-gradient(
            135deg,
            #f59e0b,
            #d97706
          );

        }

        .premium-card span {

          color: #94a3b8;
          font-size: 14px;

        }

        .premium-card strong {

          display: block;
          color: white;
          font-size: 34px;
          margin-top: 5px;

        }

        .dashboard-grid {

          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;

        }

        .big-card {

          background:
          linear-gradient(
            145deg,
            rgba(15,23,42,0.98),
            rgba(30,41,59,0.95)
          );

          border-radius: 28px;

          padding: 28px;

          border: 1px solid rgba(255,255,255,0.05);

          box-shadow:
          0 10px 30px rgba(0,0,0,0.25);

        }

        .card-top {

          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;

        }

        .card-top h2 {

          color: white;
          font-size: 24px;

        }

        .performance-grid {

          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 18px;

        }

        .mini-card {

          background:
          rgba(255,255,255,0.03);

          border-radius: 18px;

          padding: 20px;

          color: white;

          display: flex;
          flex-direction: column;
          gap: 10px;

        }

        .mini-card span {

          color: #94a3b8;

        }

        .mini-card strong {

          font-size: 28px;

        }

        .system-status {

          display: flex;
          flex-direction: column;
          gap: 18px;

        }

        .status-item {

          display: flex;
          justify-content: space-between;
          align-items: center;

          background:
          rgba(255,255,255,0.03);

          padding: 18px;

          border-radius: 16px;

          color: white;

        }

        .success {

          color: #22c55e;

        }

        .premium-loading {

          min-height: 60vh;

          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          gap: 20px;

          color: white;

        }

        .loader {

          width: 70px;
          height: 70px;

          border-radius: 50%;

          border:
          5px solid rgba(255,255,255,0.08);

          border-top:
          5px solid #22c55e;

          animation:
          spin 1s linear infinite;

        }

        @keyframes spin {

          to {

            transform: rotate(360deg);

          }

        }

        @media(max-width: 1000px){

          .dashboard-grid {

            grid-template-columns: 1fr;

          }

          .performance-grid {

            grid-template-columns: 1fr;

          }

        }

      `}</style>

    </AdminLayout>

  );

}

export default MasterDashboard;