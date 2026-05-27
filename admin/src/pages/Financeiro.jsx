import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import socket from "../services/socket";
import AdminLayout from "../layouts/AdminLayout";

import {
  FaDollarSign,
  FaWallet,
  FaClock,
  FaArrowDown,
  FaChartBar,
  FaCalendarAlt,
  FaDownload,
  FaLightbulb,
} from "react-icons/fa";

function Financeiro() {
  const [pedidos, setPedidos] = useState([]);

  async function carregarDados() {
    try {
      const response = await api.get("/pedidos");
      setPedidos(response.data.pedidos || []);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    carregarDados();

    socket.on("novo-pedido", carregarDados);
    socket.on("pedido-atualizado", carregarDados);

    return () => {
      socket.off("novo-pedido", carregarDados);
      socket.off("pedido-atualizado", carregarDados);
    };
  }, []);

  const financeiro = useMemo(() => {
    const faturamento = pedidos.reduce(
      (acc, p) => acc + Number(p.total || 0),
      0
    );

    const recebidos = pedidos
      .filter((p) => p.status === "entregue")
      .reduce((acc, p) => acc + Number(p.total || 0), 0);

    const pendente = faturamento - recebidos;
    const despesas = faturamento * 0.18;
    const lucro = faturamento - despesas;
    const ticketMedio = pedidos.length ? faturamento / pedidos.length : 0;

    return {
      faturamento,
      recebidos,
      pendente,
      despesas,
      lucro,
      ticketMedio,
      totalPedidos: pedidos.length,
    };
  }, [pedidos]);

  const ultimasMovimentacoes = pedidos.slice(0, 6);

  return (
    <AdminLayout title="Financeiro" subtitle="Visão geral das finanças do seu negócio">
      <div className="financeiro-premium-page">
        <section className="financeiro-topbar">
          <div>
            <h1>Financeiro</h1>
            <p>Controle receitas, despesas, pedidos e lucro em tempo real.</p>
          </div>

          <div className="financeiro-actions">
            <button>
              <FaCalendarAlt />
              01/05/2026 - 31/05/2026
            </button>

            <button>
              <FaDownload />
              Exportar Relatório
            </button>

            <div className="financeiro-online">
              <span></span>
              <div>
                <strong>Sistema Online</strong>
                <small>Dados atualizados em tempo real</small>
              </div>
            </div>
          </div>
        </section>

        <section className="financeiro-kpis">
          <div className="financeiro-kpi green">
            <FaDollarSign />
            <span>Faturamento Total</span>
            <strong>R$ {financeiro.faturamento.toFixed(2)}</strong>
            <p>+18% vs mês anterior</p>
          </div>

          <div className="financeiro-kpi blue">
            <FaWallet />
            <span>Recebido</span>
            <strong>R$ {financeiro.recebidos.toFixed(2)}</strong>
            <p>Pedidos entregues</p>
          </div>

          <div className="financeiro-kpi yellow">
            <FaClock />
            <span>Pendente</span>
            <strong>R$ {financeiro.pendente.toFixed(2)}</strong>
            <p>Aguardando conclusão</p>
          </div>

          <div className="financeiro-kpi purple">
            <FaArrowDown />
            <span>Despesas</span>
            <strong>R$ {financeiro.despesas.toFixed(2)}</strong>
            <p>Estimativa operacional</p>
          </div>

          <div className="financeiro-kpi green">
            <FaChartBar />
            <span>Lucro Líquido</span>
            <strong>R$ {financeiro.lucro.toFixed(2)}</strong>
            <p>Resultado estimado</p>
          </div>
        </section>

        <section className="financeiro-grid">
          <div className="financeiro-card grande">
            <div className="financeiro-card-header">
              <h2>Faturamento dos Últimos 7 Dias</h2>
              <span>Últimos 7 dias</span>
            </div>

            <div className="grafico-linha-fake">
              <div className="linha-ponto p1"></div>
              <div className="linha-ponto p2"></div>
              <div className="linha-ponto p3"></div>
              <div className="linha-ponto p4"></div>
              <div className="linha-ponto p5"></div>
              <div className="linha-ponto p6"></div>
              <div className="linha-ponto p7"></div>
            </div>
          </div>

          <div className="financeiro-card">
            <div className="financeiro-card-header">
              <h2>Distribuição por Pagamento</h2>
            </div>

            <div className="donut-area">
              <div className="donut-fake"></div>

              <div className="pagamentos-lista">
                <p><span className="dot green"></span> Cartão Crédito <strong>40%</strong></p>
                <p><span className="dot blue"></span> PIX <strong>30%</strong></p>
                <p><span className="dot yellow"></span> Dinheiro <strong>20%</strong></p>
                <p><span className="dot purple"></span> Débito <strong>10%</strong></p>
              </div>
            </div>

            <div className="pagamento-total">
              <span>Total</span>
              <strong>R$ {financeiro.faturamento.toFixed(2)}</strong>
            </div>
          </div>

          <div className="financeiro-card movimentacoes">
            <div className="financeiro-card-header">
              <h2>Últimas Movimentações</h2>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {ultimasMovimentacoes.map((pedido) => (
                  <tr key={pedido._id}>
                    <td>Pedido #{pedido._id?.slice(-6)}</td>
                    <td>Vendas</td>
                    <td>Receita</td>
                    <td className="valor-positivo">
                      R$ {Number(pedido.total || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className="status-recebido">
                        {pedido.status === "entregue" ? "Recebido" : "Pendente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="financeiro-card resumo">
            <h2>Resumo do Mês</h2>

            <div className="resumo-linha">
              <span>Faturamento Bruto</span>
              <strong>R$ {financeiro.faturamento.toFixed(2)}</strong>
            </div>

            <div className="resumo-linha red">
              <span>(-) Despesas</span>
              <strong>R$ {financeiro.despesas.toFixed(2)}</strong>
            </div>

            <div className="resumo-linha green">
              <span>(=) Lucro Líquido</span>
              <strong>R$ {financeiro.lucro.toFixed(2)}</strong>
            </div>

            <hr />

            <div className="resumo-linha">
              <span>Ticket Médio</span>
              <strong>R$ {financeiro.ticketMedio.toFixed(2)}</strong>
            </div>

            <div className="resumo-linha">
              <span>Total de Pedidos</span>
              <strong>{financeiro.totalPedidos}</strong>
            </div>
          </div>

          <div className="financeiro-card dica">
            <FaLightbulb />
            <div>
              <h3>Dica Financeira</h3>
              <p>Seu faturamento está sendo atualizado automaticamente com base nos pedidos.</p>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default Financeiro;