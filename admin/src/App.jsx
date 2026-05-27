import {
  FaShoppingBag,
  FaBoxOpen,
  FaUsers,
  FaMoneyBillWave,
  FaChartLine,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";

import {
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import api from "./services/api";

import Produtos from "./pages/Produtos";

import Pedidos from "./pages/Pedidos";

import Login from "./pages/Login";

import PrivateRoute from "./components/PrivateRoute";

import AdminLayout from "./layouts/AdminLayout";

import DashboardCharts from "./components/charts/DashboardCharts";

import Cozinha
from "./pages/Cozinha";

import Tracking
from "./pages/Tracking";

import Analytics
from "./pages/Analytics";

import Logistica
from "./pages/Logistica";

import Entregador
from "./pages/Entregador";

import Cardapio
from "./pages/Cardapio";

import CardapioOnline from "./pages/CardapioOnline";

import Carrinho
from "./pages/Carrinho";

import Pagamento
from "./pages/Pagamento";

import MasterDashboard
from "./pages/MasterDashboard";

import Clientes from "./pages/Clientes";

import Financeiro from "./pages/Financeiro";

import Analise from "./pages/Analise";

import Pdv from "./pages/Pdv";

import Caixa from "./pages/Caixa";

import Cupom from "./pages/Cupom";




// ==========================================
// COMPONENTE EM CONSTRUÇÃO
// ==========================================

function EmConstrucao({ titulo }) {

  return (

    <AdminLayout
      title={titulo}
      subtitle="Página em desenvolvimento"
    >

      <div className="card">

        <h2>
          🚧 {titulo}
        </h2>

        <p>
          Esta área está sendo construída.
        </p>

      </div>

    </AdminLayout>

  );

}





// ==========================================
// DASHBOARD
// ==========================================

function Dashboard() {
  const [dados, setDados] = useState({
    totalPedidos: 0,
    totalProdutos: 0,
    totalClientes: 0,
    faturamento: 0,
  });

  const [loading, setLoading] = useState(true);

  const vendas = [
    { dia: "Seg", valor: 1200 },
    { dia: "Ter", valor: 1800 },
    { dia: "Qua", valor: 900 },
    { dia: "Qui", valor: 2400 },
    { dia: "Sex", valor: 3200 },
    { dia: "Sab", valor: 4500 },
    { dia: "Dom", valor: 2800 },
  ];

  const pedidosGrafico = [
    { hora: "10h", total: 4 },
    { hora: "12h", total: 12 },
    { hora: "14h", total: 8 },
    { hora: "16h", total: 3 },
    { hora: "18h", total: 15 },
    { hora: "20h", total: 22 },
  ];

  async function carregarDashboard() {
    try {
      const response = await api.get("/dashboard");

      if (response.data?.dashboard) {
        setDados(response.data.dashboard);
      }
    } catch (error) {
      console.log("Erro dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  return (
    <AdminLayout
      title="Painel Administrativo"
      subtitle={loading ? "Carregando o painel..." : "Controle total da operação gourmet"}
    >
      <div className="dashboard-premium">
        <section className="dashboard-hero">
          <div>
            <span className="hero-label">Conceito Fitness Gourmet</span>
            <h1>Gestão Premium</h1>
            <p>Visão inteligente da operação, vendas, produtos e performance em tempo real.</p>
          </div>

          <div className="hero-status">
            <span></span>
            Sistema Online
          </div>
        </section>

        <section className="kpi-premium-grid">
          <div className="kpi-premium-card">
            <div className="kpi-icon green"><FaShoppingBag /></div>
            <span>Pedidos Hoje</span>
            <strong>{dados.totalPedidos || 0}</strong>
            <p>Pedidos registrados</p>
          </div>

          <div className="kpi-premium-card">
            <div className="kpi-icon blue"><FaBoxOpen /></div>
            <span>Produtos Ativos</span>
            <strong>{dados.totalProdutos || 0}</strong>
            <p>Cardápio online</p>
          </div>

          <div className="kpi-premium-card">
            <div className="kpi-icon gold"><FaMoneyBillWave /></div>
            <span>Faturamento</span>
            <strong>R$ {dados.faturamento || 0}</strong>
            <p>Últimas 24h</p>
          </div>

          <div className="kpi-premium-card">
            <div className="kpi-icon purple"><FaUsers /></div>
            <span>Clientes</span>
            <strong>{dados.totalClientes || 0}</strong>
            <p>Clientes ativos</p>
          </div>
        </section>

        <section className="dashboard-premium-grid">
          <div className="dashboard-panel large">
            <div className="panel-header">
              <div>
                <h2>Performance de Vendas</h2>
                <p>Acompanhe o movimento da semana</p>
              </div>
              <FaChartLine />
            </div>

            <DashboardCharts vendas={vendas} pedidos={pedidosGrafico} />
          </div>

          <div className="dashboard-panel">
            <div className="panel-header">
              <div>
                <h2>Status Operacional</h2>
                <p>Saúde do sistema</p>
              </div>
              <FaCheckCircle />
            </div>

            <div className="status-list-premium">
              <div><span>Servidor</span><strong>Online</strong></div>
              <div><span>Banco de Dados</span><strong>Conectado</strong></div>
              <div><span>Pedidos em tempo real</span><strong>Ativo</strong></div>
              <div><span>Cozinha</span><strong>Operando</strong></div>
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="panel-header">
              <div>
                <h2>Resumo Inteligente</h2>
                <p>Indicadores rápidos</p>
              </div>
              <FaClock />
            </div>

            <div className="mini-insights">
              <div>
                <FaClock />
                <span>Tempo médio estimado</span>
                <strong>18 min</strong>
              </div>

              <div>
                <FaExclamationTriangle />
                <span>Alertas críticos</span>
                <strong>0</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}





// ==========================================
// APP
// ==========================================

function App() {

  return (

    <Routes>

      {/* LOGIN */}

      <Route
        path="/login"
        element={<Login />}
      />

<Route
  path="/caixa"
  element={
    <PrivateRoute>
      <Caixa />
    </PrivateRoute>
  }
/>
    
      {/* PDV */}

    <Route
  path="/pdv"
  element={
    <PrivateRoute>
      <Pdv />
    </PrivateRoute>
  }
/>



      {/* DASHBOARD */}

      <Route

        path="/"

        element={

          <PrivateRoute>

            <Dashboard />

          </PrivateRoute>

        }

      />





      {/* PRODUTOS */}

      <Route

        path="/produtos"

        element={

          <PrivateRoute>

            <Produtos />

          </PrivateRoute>

        }

      />





      {/* PEDIDOS */}

      <Route

        path="/pedidos"

        element={

          <PrivateRoute>

            <Pedidos />

          </PrivateRoute>

        }

      />

      



      {/* CLIENTES */}

      <Route

        path="/clientes"

        element={

          <PrivateRoute>

            <Clientes />

          </PrivateRoute>

        }

      />





      {/* FINANCEIRO */}

      <Route
  path="/financeiro"
  element={
    <PrivateRoute>
      <Financeiro />
    </PrivateRoute>
  }
/>





      {/* ANALYTICS */}

      <Route
  path="/analytics"
  element={
    <PrivateRoute>
      <Analise />
    </PrivateRoute>
  }
/>

        <Route

        path="/logistica"

        element={

          <PrivateRoute>

            <Logistica />

          </PrivateRoute>

        }

      />

        <Route

        path="/entregador"

        element={<Entregador />}

      /> 

      <Route
  path="/cardapio"
  element={<Cardapio />}
/>

<Route
  path="/cardapio-online"
  element={<CardapioOnline />}
/>




<Route

  path="/carrinho"

  element={<Carrinho />}

/> 

<Route

  path="/pagamento"

  element={<Pagamento />}

/>

<Route

  path="/master"

  element={

    <PrivateRoute>

      <MasterDashboard />

    </PrivateRoute>

  }

/>

      {/* ADMIN */}

      <Route

        path="/admin"

        element={

          <PrivateRoute>

            <EmConstrucao
              titulo="Administração"
            />

          </PrivateRoute>

        }

      />

      {/* CUPOM DE VENDAS */ }

      <Route path="/cupom/:id" element={<Cupom />} />


      {/* FALLBACK */}

      <Route

  path="/cozinha"

  element={

    <PrivateRoute>

      <Cozinha />

    </PrivateRoute>

  }

/>

<Route

  path="/tracking/:id"

  element={<Tracking />}

/>

<Route
        path="*"
        element={<Navigate to="/" />}
      />
      
    </Routes>

  );

}

export default App;