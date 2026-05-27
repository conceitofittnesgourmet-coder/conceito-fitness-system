import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import socket from "../services/socket";

import {
  FaCashRegister,
  FaLockOpen,
  FaLock,
  FaMoneyBillWave,
  FaCreditCard,
  FaQrcode,
  FaWallet,
  FaChartLine,
  FaClock,
  FaEye,
  FaBell,
} from "react-icons/fa";

function Caixa() {
  const [pedidos, setPedidos] = useState([]);
  const [caixaAberto, setCaixaAberto] = useState(
    localStorage.getItem("caixaAberto") === "true"
  );
  const [saldoInicial, setSaldoInicial] = useState(
    Number(localStorage.getItem("saldoInicial") || 300)
  );

  async function carregarPedidos() {
    try {
      const response = await api.get("/pedidos");
      setPedidos(response.data.pedidos || []);
    } catch (error) {
      console.log("Erro ao carregar caixa:", error);
    }
  }

  useEffect(() => {
    carregarPedidos();

    socket.on("novo-pedido", carregarPedidos);
    socket.on("pedido-atualizado", carregarPedidos);

    return () => {
      socket.off("novo-pedido", carregarPedidos);
      socket.off("pedido-atualizado", carregarPedidos);
    };
  }, []);

  const resumo = useMemo(() => {
    const vendas = pedidos.filter(
      (p) => p.origem === "PDV" || p.tipo === "balcao" || p.tipo === "retirada" || p.tipo === "delivery"
    );

    const total = vendas.reduce((acc, p) => acc + Number(p.total || 0), 0);

    const pix = vendas.filter((p) => p.pagamento === "PIX").reduce((a, p) => a + Number(p.total || 0), 0);
    const credito = vendas.filter((p) => p.pagamento === "CREDITO").reduce((a, p) => a + Number(p.total || 0), 0);
    const debito = vendas.filter((p) => p.pagamento === "DEBITO").reduce((a, p) => a + Number(p.total || 0), 0);
    const dinheiro = vendas.filter((p) => p.pagamento === "DINHEIRO").reduce((a, p) => a + Number(p.total || 0), 0);

    const ticketMedio = vendas.length ? total / vendas.length : 0;
    const maiorVenda = vendas.length
      ? Math.max(...vendas.map((p) => Number(p.total || 0)))
      : 0;

    return {
      vendas,
      total,
      pix,
      credito,
      debito,
      dinheiro,
      ticketMedio,
      maiorVenda,
      saldoAtual: saldoInicial + total,
    };
  }, [pedidos, saldoInicial]);

  function abrirCaixa() {
    localStorage.setItem("caixaAberto", "true");
    localStorage.setItem("saldoInicial", String(saldoInicial));
    setCaixaAberto(true);
  }

  function fecharCaixa() {
    localStorage.setItem("caixaAberto", "false");
    setCaixaAberto(false);
  }

  return (
    <AdminLayout title="Caixa" subtitle="Controle e gestão do caixa diário">
      <div className="caixa-pro-page">
        <section className="caixa-pro-top">
          <div className="caixa-pro-title">
            <button className="caixa-menu-btn">☰</button>

            <div>
              <h1>Caixa</h1>
              <p>Controle e gestão do caixa diário</p>
            </div>
          </div>

          <div className="caixa-top-actions">
            <button>Hoje, 22 de Maio de 2026</button>

            <button className="caixa-bell">
              <FaBell />
              <span>3</span>
            </button>
          </div>
        </section>

        <section className={`caixa-status-hero ${caixaAberto ? "aberto" : "fechado"}`}>
          <div className="caixa-status-icon">
            {caixaAberto ? <FaLockOpen /> : <FaLock />}
          </div>

          <div>
            <span>{caixaAberto ? "CAIXA ABERTO" : "CAIXA FECHADO"}</span>
            <p>{caixaAberto ? "Desde 08:15 por Administrador" : "Abra o caixa para iniciar as vendas"}</p>
          </div>

          <div className="caixa-hero-metric">
            <small>Saldo Inicial</small>
            <strong>R$ {saldoInicial.toFixed(2)}</strong>
          </div>

          <div className="caixa-hero-metric">
            <small>Vendas do Dia</small>
            <strong className="green">R$ {resumo.total.toFixed(2)}</strong>
          </div>

          <div className="caixa-hero-metric">
            <small>Saldo Atual</small>
            <strong>R$ {resumo.saldoAtual.toFixed(2)}</strong>
          </div>

          {caixaAberto ? (
            <button className="caixa-fechar-btn" onClick={fecharCaixa}>
              <FaLock />
              Fechar Caixa
            </button>
          ) : (
            <div className="caixa-abrir-inline">
              <input
                type="number"
                value={saldoInicial}
                onChange={(e) => setSaldoInicial(Number(e.target.value))}
              />

              <button onClick={abrirCaixa}>
                <FaLockOpen />
                Abrir Caixa
              </button>
            </div>
          )}
        </section>

        <section className="caixa-pro-kpis">
          <div className="caixa-pro-kpi green">
            <FaMoneyBillWave />
            <span>Total de Vendas</span>
            <strong>{resumo.vendas.length}</strong>
            <p>Pedidos realizados</p>
          </div>

          <div className="caixa-pro-kpi blue">
            <FaWallet />
            <span>Ticket Médio</span>
            <strong>R$ {resumo.ticketMedio.toFixed(2)}</strong>
            <p>Valor médio por pedido</p>
          </div>

          <div className="caixa-pro-kpi purple">
            <FaChartLine />
            <span>Maior Venda</span>
            <strong>R$ {resumo.maiorVenda.toFixed(2)}</strong>
            <p>Melhor pedido do dia</p>
          </div>

          <div className="caixa-pro-kpi yellow">
            <FaClock />
            <span>Tempo Médio</span>
            <strong>28 min</strong>
            <p>Por pedido</p>
          </div>
        </section>

        <section className="caixa-pro-layout">
          <div className="caixa-main-column">
            <div className="caixa-pro-card chart-card">
              <div className="caixa-card-header">
                <h2>Movimentação de Vendas</h2>
                <button>Hoje</button>
              </div>

              <div className="caixa-chart-fake">
                <div className="line-dot c1"></div>
                <div className="line-dot c2"></div>
                <div className="line-dot c3"></div>
                <div className="line-dot c4"></div>
                <div className="line-dot c5"></div>
                <div className="line-dot c6"></div>
                <div className="line-dot c7"></div>
              </div>
            </div>

            <div className="caixa-pro-card">
              <div className="caixa-card-header">
                <h2>Últimos Pedidos</h2>
              </div>

              <table className="caixa-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Mesa / Tipo</th>
                    <th>Pagamento</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {resumo.vendas.slice(0, 6).map((pedido) => (
                    <tr key={pedido._id}>
                      <td>#{pedido._id?.slice(-5)}</td>
                      <td>{pedido.cliente || "Cliente Balcão"}</td>
                      <td>{pedido.mesa || pedido.tipo || "Balcão"}</td>
                      <td>{pedido.pagamento || "PIX"}</td>
                      <td>R$ {Number(pedido.total || 0).toFixed(2)}</td>
                      <td><span className="pago-badge">Pago</span></td>
                      <td><button className="eye-btn"><FaEye /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="caixa-side-column">
            <div className="caixa-pro-card">
              <h2>Resumo de Pagamentos</h2>

              <div className="donut-caixa">
                <span>Total<br />R$ {resumo.total.toFixed(2)}</span>
              </div>

              <div className="pagamento-resumo">
                <p><FaQrcode /> PIX <strong>R$ {resumo.pix.toFixed(2)}</strong></p>
                <p><FaCreditCard /> Cartão Crédito <strong>R$ {resumo.credito.toFixed(2)}</strong></p>
                <p><FaCreditCard /> Cartão Débito <strong>R$ {resumo.debito.toFixed(2)}</strong></p>
                <p><FaWallet /> Dinheiro <strong>R$ {resumo.dinheiro.toFixed(2)}</strong></p>
              </div>
            </div>

            <div className="caixa-pro-card">
              <h2>Detalhamento do Caixa</h2>

              <div className="caixa-detail-line">
                <span>Saldo Inicial</span>
                <strong>R$ {saldoInicial.toFixed(2)}</strong>
              </div>

              <div className="caixa-detail-line">
                <span>(+) Total de Vendas</span>
                <strong>R$ {resumo.total.toFixed(2)}</strong>
              </div>

              <div className="caixa-detail-line red">
                <span>(-) Sangrias</span>
                <strong>R$ 0,00</strong>
              </div>

              <div className="caixa-detail-line total">
                <span>Saldo Atual</span>
                <strong>R$ {resumo.saldoAtual.toFixed(2)}</strong>
              </div>
            </div>

            <div className="caixa-pro-card">
              <div className="caixa-card-header">
                <h2>Sangrias / Retiradas</h2>
                <button>Nova Sangria</button>
              </div>

              <div className="empty-sangria">
                Nenhuma sangria registrada.
              </div>
            </div>

            <div className="caixa-pro-card">
              <h2>Atividades do Caixa</h2>

              <div className="caixa-atividades">
                <p><span></span> Caixa aberto por Administrador</p>
                <p><span></span> Pedido finalizado</p>
                <p><span></span> Venda registrada no PDV</p>
                <p><span></span> Pagamento sincronizado</p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AdminLayout>
  );
}

export default Caixa;