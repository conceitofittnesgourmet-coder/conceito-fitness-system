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
import ClubeConceito from "./pages/ClubeConceito";
import Orcamentos from "./pages/Orcamentos";

import Financeiro from "./pages/Financeiro";

import Producao from "./pages/Producao";

import OrdensProducao from "./pages/OrdensProducao";

import FichaTecnica from "./pages/FichaTecnica";

import Analise from "./pages/Analise";

import Pdv from "./pages/Pdv";

import GestaoVendas from "./pages/GestaoVendas";

import Caixa from "./pages/Caixa";

import Cupom from "./pages/Cupom";

import Configuracoes from "./pages/Configuracoes";

import Compras from "./pages/Compras";

import Relatorios from "./pages/Relatorios";

import Fiscal from "./pages/Fiscal";

import Empresa from "./pages/Empresa";

import CadastroFiscalProdutos from "./pages/CadastroFiscalProdutos";
import CadastroMestreProdutos from "./pages/CadastroMestreProdutos";
import Ingredientes from "./pages/Ingredientes";

import CardapioOnlineAdmin from "./pages/cardapioonlineadmin";

import Categorias from "./pages/Categorias";

import GruposComponentes from "./pages/GruposComponentes";

import OpcoesComponentes from "./pages/OpcoesComponentes";
import ProdutosPersonalizacoes from "./pages/ProdutosPersonalizacoes";
import IfoodIntegracao from "./pages/IfoodIntegracao";
import FoodCore from "./pages/FoodCore";



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
// DASHBOARD EXECUTIVO
// ==========================================
function Dashboard() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dias, setDias] = useState(30);

  function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  async function carregarDashboard(periodo = dias) {
    setLoading(true);
    try {
      const response = await api.get("/dashboard/executivo", { params: { dias: periodo } });
      setDados(response.data?.dashboard || null);
    } catch (error) {
      console.log("Erro dashboard executivo:", error);
      setDados(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDashboard(dias);
  }, [dias]);

  const kpis = dados?.kpis || {};
  const alertas = dados?.alertas || [];
  const rankingLucro = dados?.rankings?.porLucro || [];
  const rankingQuantidade = dados?.rankings?.porQuantidade || [];

  return (
    <AdminLayout
      title="Dashboard Executivo"
      subtitle={loading ? "Calculando indicadores..." : `Visão consolidada dos últimos ${dias} dias`}
    >
      <div className="dashboard-premium">
        <section className="dashboard-hero">
          <div>
            <span className="hero-label">Conceito Fitness Gourmet</span>
            <h1>Gestão Executiva</h1>
            <p>Vendas, CMV, lucro, produção, estoque e alertas operacionais em dados reais.</p>
          </div>

          <div className="dashboard-actions">
            <select value={dias} onChange={(event) => setDias(Number(event.target.value))}>
              <option value={7}>Últimos 7 dias</option>
              <option value={15}>Últimos 15 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={60}>Últimos 60 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
            <div className="hero-status"><span></span>Sistema Online</div>
          </div>
        </section>

        <section className="kpi-premium-grid executive-kpis">
          <div className="kpi-premium-card">
            <div className="kpi-icon gold"><FaMoneyBillWave /></div>
            <span>Faturamento</span>
            <strong>{moeda(kpis.faturamento)}</strong>
            <p className={Number(kpis.variacaoFaturamento) >= 0 ? "trend-positive" : "trend-negative"}>
              {Number(kpis.variacaoFaturamento || 0).toFixed(1)}% versus período anterior
            </p>
          </div>

          <div className="kpi-premium-card">
            <div className="kpi-icon green"><FaChartLine /></div>
            <span>Lucro bruto</span>
            <strong>{moeda(kpis.lucroBruto)}</strong>
            <p>Margem de {Number(kpis.margemBruta || 0).toFixed(1)}%</p>
          </div>

          <div className="kpi-premium-card">
            <div className="kpi-icon purple"><FaExclamationTriangle /></div>
            <span>CMV vendido</span>
            <strong>{moeda(kpis.cmvVendido)}</strong>
            <p>Custo associado às vendas</p>
          </div>

          <div className="kpi-premium-card">
            <div className="kpi-icon blue"><FaShoppingBag /></div>
            <span>Pedidos</span>
            <strong>{kpis.pedidos || 0}</strong>
            <p>Ticket médio de {moeda(kpis.ticketMedio)}</p>
          </div>

          <div className="kpi-premium-card compact">
            <span>Produção concluída</span>
            <strong>{Number(kpis.unidadesProduzidas || 0).toLocaleString("pt-BR")}</strong>
            <p>{moeda(kpis.custoProduzido)} em custo produzido</p>
          </div>

          <div className="kpi-premium-card compact">
            <span>Ordens ativas</span>
            <strong>{kpis.ordensAtivas || 0}</strong>
            <p>Abertas ou em produção</p>
          </div>

          <div className="kpi-premium-card compact">
            <span>Produtos</span>
            <strong>{kpis.totalProdutos || 0}</strong>
            <p>Itens cadastrados</p>
          </div>

          <div className="kpi-premium-card compact">
            <span>Clientes</span>
            <strong>{kpis.totalClientes || 0}</strong>
            <p>Cadastros na base</p>
          </div>
        </section>

        <section className="dashboard-panel dashboard-chart-full">
          <div className="panel-header">
            <div>
              <h2>Evolução financeira e comercial</h2>
              <p>Dados consolidados por dia no período selecionado</p>
            </div>
            <FaChartLine />
          </div>
          <DashboardCharts vendas={dados?.series?.vendas || []} pedidos={dados?.series?.pedidosPorHora || []} />
        </section>

        <section className="dashboard-premium-grid executive-panels">
          <div className="dashboard-panel">
            <div className="panel-header">
              <div><h2>Produtos por lucro</h2><p>Rentabilidade bruta no período</p></div>
              <FaMoneyBillWave />
            </div>
            <div className="status-list-premium ranking-list">
              {rankingLucro.slice(0, 7).map((item, index) => (
                <div key={`${item.produtoId || item.nome}-lucro`}>
                  <span>{index + 1}. {item.nome}<small>{Number(item.margem || 0).toFixed(1)}% de margem</small></span>
                  <strong>{moeda(item.lucro)}</strong>
                </div>
              ))}
              {!rankingLucro.length && <div><span>Sem vendas no período</span><strong>—</strong></div>}
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="panel-header">
              <div><h2>Produtos mais vendidos</h2><p>Ranking por quantidade</p></div>
              <FaBoxOpen />
            </div>
            <div className="status-list-premium ranking-list">
              {rankingQuantidade.slice(0, 7).map((item, index) => (
                <div key={`${item.produtoId || item.nome}-quantidade`}>
                  <span>{index + 1}. {item.nome}<small>{moeda(item.faturamento)} faturados</small></span>
                  <strong>{Number(item.quantidade || 0).toLocaleString("pt-BR")}</strong>
                </div>
              ))}
              {!rankingQuantidade.length && <div><span>Sem vendas no período</span><strong>—</strong></div>}
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="panel-header">
              <div><h2>Alertas operacionais</h2><p>Pontos que precisam de atenção</p></div>
              <FaExclamationTriangle />
            </div>
            <div className="executive-alerts">
              {alertas.map((alerta, index) => (
                <div className={`executive-alert ${alerta.nivel}`} key={`${alerta.tipo}-${index}`}>
                  <FaExclamationTriangle />
                  <span>{alerta.mensagem}</span>
                </div>
              ))}
              {!alertas.length && (
                <div className="executive-alert ok"><FaCheckCircle /><span>Nenhum alerta operacional no momento.</span></div>
              )}
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="panel-header">
              <div><h2>Estoque crítico</h2><p>Produtos no mínimo ou abaixo dele</p></div>
              <FaBoxOpen />
            </div>
            <div className="status-list-premium ranking-list">
              {(dados?.estoqueBaixo || []).slice(0, 7).map((item) => (
                <div key={item.id}>
                  <span>{item.nome}<small>Mínimo: {item.estoqueMinimo}</small></span>
                  <strong>{item.estoque}</strong>
                </div>
              ))}
              {!(dados?.estoqueBaixo || []).length && <div><span>Estoques dentro do mínimo</span><strong>OK</strong></div>}
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

<Route
  path="/gestao-vendas"
  element={
    <PrivateRoute>
      <GestaoVendas />
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


        <Route path="/cardapio-online-admin" element={<CardapioOnlineAdmin />} />



      {/* PRODUTOS */}

      <Route

        path="/produtos"

        element={

          <PrivateRoute>

            <Produtos />

          </PrivateRoute>

        }

      />

<Route
    path="/foodcore"
    element={
        <PrivateRoute>
            <FoodCore />
        </PrivateRoute>
    }
/>

<Route
  path="/ingredientes"
  element={
    <PrivateRoute>
      <Ingredientes />
    </PrivateRoute>
  }
/>

<Route
  path="/produtos/cadastro-mestre"
  element={
    <PrivateRoute>
      <CadastroMestreProdutos />
    </PrivateRoute>
  }
/>

<Route
  path="/categorias"
  element={
    <PrivateRoute>
      <Categorias />
    </PrivateRoute>
  }
/>


<Route
  path="/produtos/personalizacoes"
  element={
    <PrivateRoute>
      <ProdutosPersonalizacoes />
    </PrivateRoute>
  }
/>

<Route
  path="/integracoes/ifood"
  element={
    <PrivateRoute>
      <IfoodIntegracao />
    </PrivateRoute>
  }
/>

<Route
  path="/admin/grupos-componentes"
  element={
    <PrivateRoute>
      <GruposComponentes />
    </PrivateRoute>
  }
/>

<Route
  path="/admin/opcoes-componentes"
  element={
    <PrivateRoute>
      <OpcoesComponentes />
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





      {/* CLUBE CONCEITO */}
      <Route path="/clube-conceito" element={<PrivateRoute><ClubeConceito /></PrivateRoute>} />
      <Route path="/orcamentos" element={<PrivateRoute><Orcamentos /></PrivateRoute>} />


      {/* CLIENTES */}

      <Route

        path="/clientes"

        element={

          <PrivateRoute>

            <Clientes />

          </PrivateRoute>

        }

      />






<Route
  path="/fiscal/produtos"
  element={
    <PrivateRoute>
      <CadastroFiscalProdutos />
    </PrivateRoute>
  }
/>

<Route
  path="/empresa"
  element={
    <PrivateRoute>
      <Empresa />
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


<Route
  path="/producao/ordens"
  element={
    <PrivateRoute>
      <OrdensProducao />
    </PrivateRoute>
  }
/>

<Route
  path="/producao"
  element={
    <PrivateRoute>
      <Producao />
    </PrivateRoute>
  }
/>

<Route
  path="/ficha-tecnica"
  element={
    <PrivateRoute>
      <FichaTecnica />
    </PrivateRoute>
  }
/>


<Route
  path="/compras"
  element={
    <PrivateRoute>
      <Compras />
    </PrivateRoute>
  }
/>

      {/* RELATÓRIOS */}
<Route
  path="/relatorios"
  element={
    <PrivateRoute>
      <Relatorios />
    </PrivateRoute>
  }
/>


<Route
  path="/fiscal"
  element={
    <PrivateRoute>
      <Fiscal />
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

      {/* CONFIGURAÇÕES */ }

      <Route
  path="/configuracoes"
  element={
    <PrivateRoute>
      <Configuracoes />
    </PrivateRoute>
  }
/>


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
