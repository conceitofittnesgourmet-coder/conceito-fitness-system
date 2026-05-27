import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import socket from "../services/socket";
import AdminLayout from "../layouts/AdminLayout";

import {
  FaDollarSign,
  FaShoppingBag,
  FaTicketAlt,
  FaChartLine,
  FaUsers,
  FaCalendarAlt,
  FaDownload,
  FaLightbulb,
  FaArrowRight,
} from "react-icons/fa";

function Analise() {
  const [pedidos, setPedidos] = useState([]);
  const [produtos, setProdutos] = useState([]);

  async function carregarDados() {
    try {
      const pedidosRes = await api.get("/pedidos");
      const produtosRes = await api.get("/produtos");

      setPedidos(pedidosRes.data.pedidos || []);
      setProdutos(produtosRes.data.produtos || []);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    carregarDados();

    socket.on("novo-pedido", carregarDados);
    socket.on("pedido-atualizado", carregarDados);
    socket.on("produto-criado", carregarDados);
    socket.on("produto-atualizado", carregarDados);

    return () => {
      socket.off("novo-pedido", carregarDados);
      socket.off("pedido-atualizado", carregarDados);
      socket.off("produto-criado", carregarDados);
      socket.off("produto-atualizado", carregarDados);
    };
  }, []);

  const dados = useMemo(() => {
    const faturamento = pedidos.reduce(
      (acc, pedido) => acc + Number(pedido.total || 0),
      0
    );

    const ticketMedio = pedidos.length ? faturamento / pedidos.length : 0;

    const clientesUnicos = new Set(
      pedidos.map((pedido) => pedido.telefone || pedido.cliente)
    ).size;

    const vendasProdutos = {};

    pedidos.forEach((pedido) => {
      pedido.produtos?.forEach((produto) => {
        if (!vendasProdutos[produto.nome]) {
          vendasProdutos[produto.nome] = {
            nome: produto.nome,
            quantidade: 0,
            faturamento: 0,
          };
        }

        vendasProdutos[produto.nome].quantidade += Number(produto.quantidade || 1);
        vendasProdutos[produto.nome].faturamento +=
          Number(produto.preco || 0) * Number(produto.quantidade || 1);
      });
    });

    const topProdutos = Object.values(vendasProdutos)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    return {
      faturamento,
      ticketMedio,
      clientesUnicos,
      totalPedidos: pedidos.length,
      totalProdutos: produtos.length,
      topProdutos,
    };
  }, [pedidos, produtos]);

  return (
    <AdminLayout
      title="Análise de Sistemas"
      subtitle="Inteligência de Negócios e Performance"
    >
      <div className="analise-premium-page">
        <section className="analise-topbar">
          <div>
            <h1>Análise de Sistemas</h1>
            <p>Inteligência de negócios, vendas, produtos e clientes.</p>
          </div>

          <div className="analise-actions">
            <button>
              <FaCalendarAlt />
              01/05/2026 - 31/05/2026
            </button>

            <button>
              <FaDownload />
              Exportar Relatório
            </button>

            <div className="analise-online">
              <span></span>
              <div>
                <strong>Sistema Online</strong>
                <small>Dados atualizados em tempo real</small>
              </div>
            </div>
          </div>
        </section>

        <section className="analise-kpis">
          <div className="analise-kpi green">
            <FaDollarSign />
            <span>Faturamento Total</span>
            <strong>R$ {dados.faturamento.toFixed(2)}</strong>
            <p>+18% vs mês anterior</p>
          </div>

          <div className="analise-kpi blue">
            <FaShoppingBag />
            <span>Pedidos Realizados</span>
            <strong>{dados.totalPedidos}</strong>
            <p>Pedidos no sistema</p>
          </div>

          <div className="analise-kpi yellow">
            <FaTicketAlt />
            <span>Ticket Médio</span>
            <strong>R$ {dados.ticketMedio.toFixed(2)}</strong>
            <p>Valor médio por pedido</p>
          </div>

          <div className="analise-kpi purple">
            <FaChartLine />
            <span>Taxa de Conversão</span>
            <strong>24,8%</strong>
            <p>+6% vs mês anterior</p>
          </div>

          <div className="analise-kpi green">
            <FaUsers />
            <span>Clientes Ativos</span>
            <strong>{dados.clientesUnicos}</strong>
            <p>Clientes com pedidos</p>
          </div>
        </section>

        <section className="analise-grid">
          <div className="analise-card grande">
            <div className="analise-card-header">
              <h2>Faturamento dos Últimos 30 Dias</h2>
              <span>Últimos 30 dias</span>
            </div>

            <div className="analise-line-chart">
              <div className="chart-dot a1"></div>
              <div className="chart-dot a2"></div>
              <div className="chart-dot a3"></div>
              <div className="chart-dot a4"></div>
              <div className="chart-dot a5"></div>
              <div className="chart-dot a6"></div>
              <div className="chart-dot a7"></div>
            </div>
          </div>

          <div className="analise-card">
            <div className="analise-card-header">
              <h2>Distribuição de Pedidos por Categoria</h2>
            </div>

            <div className="analise-donut-area">
              <div className="analise-donut"></div>

              <div className="analise-legenda">
                <p><span className="dot green"></span> Bolos e Tortas <strong>40%</strong></p>
                <p><span className="dot blue"></span> Sobremesas <strong>25%</strong></p>
                <p><span className="dot yellow"></span> Salgados <strong>15%</strong></p>
                <p><span className="dot purple"></span> Bebidas <strong>10%</strong></p>
                <p><span className="dot gray"></span> Outros <strong>10%</strong></p>
              </div>
            </div>
          </div>

          <div className="analise-card">
            <h2>Pedidos por Dia da Semana</h2>

            <div className="bar-chart-fake">
              <div style={{ height: "70%" }}><span>Seg</span></div>
              <div style={{ height: "58%" }}><span>Ter</span></div>
              <div style={{ height: "52%" }}><span>Qua</span></div>
              <div style={{ height: "76%" }}><span>Qui</span></div>
              <div style={{ height: "86%" }}><span>Sex</span></div>
              <div style={{ height: "64%" }}><span>Sáb</span></div>
              <div style={{ height: "32%" }}><span>Dom</span></div>
            </div>
          </div>

          <div className="analise-card">
            <h2>Origem dos Pedidos</h2>

            <div className="analise-donut pequeno"></div>

            <div className="analise-legenda compacta">
              <p><span className="dot green"></span> WhatsApp <strong>65%</strong></p>
              <p><span className="dot blue"></span> Site / App <strong>20%</strong></p>
              <p><span className="dot yellow"></span> Balcão <strong>10%</strong></p>
              <p><span className="dot purple"></span> Indicação <strong>5%</strong></p>
            </div>
          </div>

          <div className="analise-card">
            <h2>Desempenho por Período</h2>

            <div className="periodos-lista">
              <div>
                <span>Manhã (06h - 12h)</span>
                <strong>25%</strong>
                <progress value="25" max="100"></progress>
              </div>

              <div>
                <span>Tarde (12h - 18h)</span>
                <strong>40%</strong>
                <progress value="40" max="100"></progress>
              </div>

              <div>
                <span>Noite (18h - 00h)</span>
                <strong>35%</strong>
                <progress value="35" max="100"></progress>
              </div>
            </div>
          </div>

          <div className="analise-card">
            <h2>Top 5 Produtos Mais Vendidos</h2>

            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Qtd</th>
                  <th>Faturamento</th>
                </tr>
              </thead>

              <tbody>
                {dados.topProdutos.map((produto) => (
                  <tr key={produto.nome}>
                    <td>{produto.nome}</td>
                    <td>{produto.quantidade}</td>
                    <td>R$ {produto.faturamento.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="analise-card grande-baixo">
            <div className="analise-card-header">
              <h2>Análise de Tendência</h2>
              <span>Este mês</span>
            </div>

            <div className="analise-line-chart menor">
              <div className="chart-dot a1"></div>
              <div className="chart-dot a2"></div>
              <div className="chart-dot a3"></div>
              <div className="chart-dot a4"></div>
              <div className="chart-dot a5"></div>
              <div className="chart-dot a6"></div>
              <div className="chart-dot a7"></div>
            </div>
          </div>

          <div className="analise-card insights">
            <h2>Insights Inteligentes</h2>

            <div className="insight-item green">
              <FaLightbulb />
              <div>
                <strong>Alta nas Vendas</strong>
                <p>Seu faturamento está crescendo com base nos pedidos registrados.</p>
              </div>
            </div>

            <div className="insight-item blue">
              <FaChartLine />
              <div>
                <strong>Produto em Destaque</strong>
                <p>{dados.topProdutos[0]?.nome || "Produto"} lidera as vendas.</p>
              </div>
            </div>

            <div className="insight-item yellow">
              <FaUsers />
              <div>
                <strong>Clientes Engajados</strong>
                <p>{dados.clientesUnicos} clientes ativos realizaram pedidos.</p>
              </div>
            </div>

            <button>
              Ver Relatório Completo
              <FaArrowRight />
            </button>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default Analise;