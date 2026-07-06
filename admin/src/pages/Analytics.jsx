import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import "../styles/analytics.css";

import {
  FaBrain,
  FaChartLine,
  FaClock,
  FaCreditCard,
  FaDollarSign,
  FaFire,
  FaMoneyBillWave,
  FaPercent,
  FaQrcode,
  FaShoppingBag,
  FaStar,
  FaTags,
  FaTrophy,
  FaUsers,
  FaWallet,
  FaBoxOpen,
} from "react-icons/fa";

function dinheiro(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function percentual(valor) {
  return `${Number(valor || 0).toFixed(2)}%`;
}

function maiorValorObjeto(obj = {}) {
  const valores = Object.values(obj).map((v) => Number(v || 0));
  return Math.max(...valores, 1);
}

function Analytics() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  async function carregarAnalytics() {
    try {
      setLoading(true);
      const response = await api.get("/analytics");
      setDados(response.data);
    } catch (error) {
      console.log("Erro ao carregar Analytics:", error);
      alert("Erro ao carregar Analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarAnalytics();
  }, []);

  const maiorHora = useMemo(
    () => maiorValorObjeto(dados?.vendasPorHora),
    [dados]
  );

  const maiorDia = useMemo(
    () => maiorValorObjeto(dados?.vendasPorDiaSemana),
    [dados]
  );

  if (loading || !dados) {
    return (
      <AdminLayout title="Analytics Premium" subtitle="Carregando BI...">
        <div className="analytics-loading">
          <div className="loading-spinner" />
          <strong>Carregando inteligência do negócio...</strong>
        </div>
      </AdminLayout>
    );
  }

  const pagamentos = dados.pagamentos || {};
  const totalPagamentos =
    Number(pagamentos.pix || 0) +
    Number(pagamentos.credito || 0) +
    Number(pagamentos.debito || 0) +
    Number(pagamentos.dinheiro || 0) +
    Number(pagamentos.outros || 0);

  return (
    <AdminLayout
      title="Analytics Premium"
      subtitle="Business Intelligence da Conceito Fitness Gourmet"
    >
      <div className="analytics-premium-page">
        <section className="analytics-hero">
          <div>
            <span>Business Intelligence</span>
            <h1>Analytics Premium</h1>
            <p>
              Indicadores estratégicos de vendas, clientes, produtos, pagamentos,
              margem e oportunidades de crescimento.
            </p>
          </div>

          <div className="analytics-online">
            <i />
            Sistema sincronizado
          </div>
        </section>

        <section className="analytics-kpis">
          <Kpi icon={<FaDollarSign />} titulo="Hoje" valor={dinheiro(dados.faturamentoHoje)} texto="Faturamento do dia" tipo="green" />
          <Kpi icon={<FaChartLine />} titulo="Semana" valor={dinheiro(dados.faturamentoSemana)} texto="Últimos 7 dias" tipo="blue" />
          <Kpi icon={<FaMoneyBillWave />} titulo="Mês" valor={dinheiro(dados.faturamentoMes)} texto="Mês atual" tipo="purple" />
          <Kpi icon={<FaShoppingBag />} titulo="Pedidos" valor={dados.totalPedidos || 0} texto="Pedidos registrados" tipo="gold" />
          <Kpi icon={<FaWallet />} titulo="Ticket Médio" valor={dinheiro(dados.ticketMedio)} texto="Média por pedido" tipo="green" />
          <Kpi icon={<FaFire />} titulo="Maior Venda" valor={dinheiro(dados.maiorVenda)} texto="Melhor venda registrada" tipo="red" />
          <Kpi icon={<FaUsers />} titulo="Clientes" valor={dados.totalClientes || 0} texto="Base de clientes" tipo="blue" />
          <Kpi icon={<FaPercent />} titulo="Margem" valor={percentual(dados.margemLucro)} texto="Margem estimada" tipo="purple" />
        </section>

        <section className="analytics-grid">
          <div className="analytics-panel large">
            <PanelHeader
              icon={<FaChartLine />}
              titulo="Vendas por Horário"
              texto="Identifique os horários de maior movimento"
            />

            <div className="bar-list">
              {Object.entries(dados.vendasPorHora || {}).map(([hora, valor]) => (
                <Barra
                  key={hora}
                  label={hora}
                  valor={dinheiro(valor)}
                  width={(Number(valor || 0) / maiorHora) * 100}
                />
              ))}

              {Object.keys(dados.vendasPorHora || {}).length === 0 && (
                <Empty texto="Nenhuma venda por horário ainda." />
              )}
            </div>
          </div>

          <div className="analytics-panel">
            <PanelHeader
              icon={<FaCreditCard />}
              titulo="Formas de Pagamento"
              texto="Inclui vendas com multipagamento"
            />

            <div className="payment-list">
              <Pagamento icon={<FaQrcode />} label="PIX" valor={pagamentos.pix} total={totalPagamentos} />
              <Pagamento icon={<FaCreditCard />} label="Crédito" valor={pagamentos.credito} total={totalPagamentos} />
              <Pagamento icon={<FaCreditCard />} label="Débito" valor={pagamentos.debito} total={totalPagamentos} />
              <Pagamento icon={<FaWallet />} label="Dinheiro" valor={pagamentos.dinheiro} total={totalPagamentos} />
            </div>
          </div>

          <div className="analytics-panel">
            <PanelHeader
              icon={<FaClock />}
              titulo="Dias da Semana"
              texto="Performance por dia"
            />

            <div className="bar-list compact">
              {Object.entries(dados.vendasPorDiaSemana || {}).map(([dia, valor]) => (
                <Barra
                  key={dia}
                  label={dia}
                  valor={dinheiro(valor)}
                  width={(Number(valor || 0) / maiorDia) * 100}
                />
              ))}
            </div>
          </div>

          <div className="analytics-panel">
            <PanelHeader
              icon={<FaBrain />}
              titulo="IA Gerencial"
              texto="Insights automáticos do ERP"
            />

            <div className="insights-list">
              {(dados.ia?.insights || []).map((insight, index) => (
                <div key={index}>
                  <FaBrain />
                  <span>{insight}</span>
                </div>
              ))}

              {(dados.ia?.insights || []).length === 0 && (
                <Empty texto="Ainda não há insights suficientes." />
              )}
            </div>
          </div>

          <div className="analytics-panel">
            <PanelHeader
              icon={<FaTrophy />}
              titulo="Produtos Mais Vendidos"
              texto="Ranking por quantidade"
            />

            <Ranking
              itens={(dados.topProdutos || []).slice(0, 10)}
              valorKey="quantidade"
              tipo="qtd"
            />
          </div>

          <div className="analytics-panel">
            <PanelHeader
              icon={<FaStar />}
              titulo="Produtos Mais Lucrativos"
              texto="Ranking por lucro estimado"
            />

            <Ranking
              itens={(dados.topProdutosLucrativos || []).slice(0, 10)}
              valorKey="lucro"
              tipo="money"
            />
          </div>

          <div className="analytics-panel">
            <PanelHeader
              icon={<FaTags />}
              titulo="Categorias"
              texto="Categorias com maior faturamento"
            />

            <Ranking
              itens={(dados.topCategorias || []).slice(0, 10)}
              valorKey="valor"
              tipo="money"
            />
          </div>

          <div className="analytics-panel">
            <PanelHeader
              icon={<FaUsers />}
              titulo="Top Clientes"
              texto="Clientes com maior gasto"
            />

            <div className="clientes-list">
              {(dados.topClientes || []).slice(0, 10).map((cliente, index) => (
                <div key={cliente.telefone || cliente.nome || index}>
                  <strong>{index + 1}</strong>
                  <span>
                    {cliente.nome || "Cliente"}
                    <small>{cliente.telefone || "Sem telefone"}</small>
                  </span>
                  <b>{dinheiro(cliente.gasto)}</b>
                </div>
              ))}

              {(dados.topClientes || []).length === 0 && (
                <Empty texto="Nenhum cliente ranqueado ainda." />
              )}
            </div>
          </div>
        </section>

        <section className="analytics-financeiro">
          <div>
            <FaMoneyBillWave />
            <span>Faturamento Total</span>
            <strong>{dinheiro(dados.faturamento)}</strong>
          </div>

          <div>
            <FaBoxOpen />
            <span>Custo Total</span>
            <strong>{dinheiro(dados.custoTotal)}</strong>
          </div>

          <div>
            <FaChartLine />
            <span>Lucro Estimado</span>
            <strong>{dinheiro(dados.lucroTotal)}</strong>
          </div>

          <div>
            <FaPercent />
            <span>Margem</span>
            <strong>{percentual(dados.margemLucro)}</strong>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

function Kpi({ icon, titulo, valor, texto, tipo }) {
  return (
    <div className={`analytics-kpi ${tipo}`}>
      <div>{icon}</div>
      <span>{titulo}</span>
      <strong>{valor}</strong>
      <p>{texto}</p>
    </div>
  );
}

function PanelHeader({ icon, titulo, texto }) {
  return (
    <div className="analytics-panel-header">
      <div>
        <h2>{titulo}</h2>
        <p>{texto}</p>
      </div>
      {icon}
    </div>
  );
}

function Barra({ label, valor, width }) {
  return (
    <div className="analytics-bar-row">
      <div>
        <span>{label}</span>
        <strong>{valor}</strong>
      </div>
      <div className="analytics-bar-bg">
        <i style={{ width: `${Math.max(width, 4)}%` }} />
      </div>
    </div>
  );
}

function Pagamento({ icon, label, valor, total }) {
  const pct = total > 0 ? (Number(valor || 0) / total) * 100 : 0;

  return (
    <div className="payment-row">
      <div>
        {icon}
        <span>{label}</span>
      </div>

      <strong>{dinheiro(valor)}</strong>

      <div className="payment-progress">
        <i style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Ranking({ itens, valorKey, tipo }) {
  if (!itens.length) {
    return <Empty texto="Nenhum dado disponível." />;
  }

  return (
    <div className="ranking-list">
      {itens.map((item, index) => (
        <div key={item.nome || index}>
          <strong>{index + 1}</strong>
          <span>{item.nome}</span>
          <b>
            {tipo === "money"
              ? dinheiro(item[valorKey])
              : `${Number(item[valorKey] || 0)} un.`}
          </b>
        </div>
      ))}
    </div>
  );
}

function Empty({ texto }) {
  return <div className="analytics-empty">{texto}</div>;
}

export default Analytics;