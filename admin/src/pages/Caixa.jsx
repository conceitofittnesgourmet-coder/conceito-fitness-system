import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import socket from "../services/socket";

import {
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
  const [caixa, setCaixa] = useState(null);
  const [resumoApi, setResumoApi] = useState(null);
  const [saldoInicial, setSaldoInicial] = useState(300);
  const [valorSangria, setValorSangria] = useState("");
  const [motivoSangria, setMotivoSangria] = useState("");
  const [valorSuprimento, setValorSuprimento] = useState("");
  const [motivoSuprimento, setMotivoSuprimento] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [valorContado, setValorContado] = useState("");
const [observacaoFechamento, setObservacaoFechamento] = useState("");

  const caixaAberto = caixa?.status === "aberto";

  async function carregarCaixa() {
    try {
      setCarregando(true);

      const response = await api.get("/caixa/resumo");

      setCaixa(response.data.caixa || null);
      setPedidos(response.data.pedidos || []);
      setResumoApi(response.data.resumo || null);

      if (response.data.caixa?.saldoInicial !== undefined) {
        setSaldoInicial(Number(response.data.caixa.saldoInicial || 0));
      }

      localStorage.setItem(
        "caixaAberto",
        response.data.caixa?.status === "aberto" ? "true" : "false"
      );
    } catch (error) {
      console.log("Erro ao carregar caixa:", error);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarCaixa();

    socket.on("novo-pedido", carregarCaixa);
    socket.on("novo_pedido", carregarCaixa);
    socket.on("pedido-atualizado", carregarCaixa);

    return () => {
      socket.off("novo-pedido", carregarCaixa);
      socket.off("novo_pedido", carregarCaixa);
      socket.off("pedido-atualizado", carregarCaixa);
    };
  }, []);

  const resumo = useMemo(() => {
    const vendas = pedidos || [];

    return {
      vendas,
      total: Number(resumoApi?.total || 0),
      pix: Number(resumoApi?.pix || 0),
      credito: Number(resumoApi?.credito || 0),
      debito: Number(resumoApi?.debito || 0),
      dinheiro: Number(resumoApi?.dinheiro || 0),
      ticketMedio: Number(resumoApi?.ticketMedio || 0),
      maiorVenda: Number(resumoApi?.maiorVenda || 0),
      totalSangrias: Number(resumoApi?.totalSangrias || 0),
      totalSuprimentos: Number(resumoApi?.totalSuprimentos || 0),
      saldoAtual: Number(resumoApi?.saldoAtual || 0),
      quantidadePedidos: Number(resumoApi?.quantidadePedidos || vendas.length),
    };
  }, [pedidos, resumoApi]);

  async function abrirCaixa() {
    try {
      const response = await api.post("/caixa/abrir", {
        saldoInicial: Number(saldoInicial || 0),
        operador: "Administrador",
      });

      setCaixa(response.data.caixa);
      localStorage.setItem("caixaAberto", "true");
      await carregarCaixa();

      alert("Caixa aberto com sucesso!");
    } catch (error) {
      console.log("Erro ao abrir caixa:", error);
      alert(error.response?.data?.message || "Erro ao abrir caixa.");
    }
  }

  async function fecharCaixa() {
    const confirmar = window.confirm("Deseja realmente fechar o caixa?");

    if (!confirmar) return;

    try {
      const response = await api.post("/caixa/fechar", {
  valorContado:
    Number(valorContado || 0),

  saldoEsperado:
    Number(resumo.saldoAtual || 0),

  observacao:
    observacaoFechamento,
});

      setCaixa(response.data.caixa);
      localStorage.setItem("caixaAberto", "false");
      await carregarCaixa();

      alert("Caixa fechado com sucesso!");
    } catch (error) {
      console.log("Erro ao fechar caixa:", error);
      alert(error.response?.data?.message || "Erro ao fechar caixa.");
    }
  }

  async function registrarSangria() {
    if (!valorSangria || Number(valorSangria) <= 0) {
      alert("Informe um valor válido para a sangria.");
      return;
    }

    try {
      await api.post("/caixa/sangria", {
        valor: Number(valorSangria),
        motivo: motivoSangria || "Sangria",
      });

      setValorSangria("");
      setMotivoSangria("");
      await carregarCaixa();

      alert("Sangria registrada com sucesso!");
    } catch (error) {
      console.log("Erro ao registrar sangria:", error);
      alert(error.response?.data?.message || "Erro ao registrar sangria.");
    }
  }

  async function registrarSuprimento() {
    if (!valorSuprimento || Number(valorSuprimento) <= 0) {
      alert("Informe um valor válido para o suprimento.");
      return;
    }

    try {
      await api.post("/caixa/suprimento", {
        valor: Number(valorSuprimento),
        motivo: motivoSuprimento || "Suprimento",
      });

      setValorSuprimento("");
      setMotivoSuprimento("");
      await carregarCaixa();

      alert("Suprimento registrado com sucesso!");
    } catch (error) {
      console.log("Erro ao registrar suprimento:", error);
      alert(error.response?.data?.message || "Erro ao registrar suprimento.");
    }
  }

  return (
    <AdminLayout title="Caixa" subtitle="Controle profissional do caixa diário">
      <div className="caixa-pro-page">
        <section className="caixa-pro-top">
          <div className="caixa-pro-title">
            <button className="caixa-menu-btn">☰</button>

            <div>
              <h1>Caixa</h1>
              <p>
                {carregando
                  ? "Carregando informações..."
                  : "Controle de abertura, vendas, sangrias e fechamento"}
              </p>
            </div>
          </div>

          <div className="caixa-top-actions">
            <button>{new Date().toLocaleDateString("pt-BR")}</button>

            <button className="caixa-bell">
              <FaBell />
              <span>{resumo.quantidadePedidos}</span>
            </button>
          </div>
        </section>

        <section className={`caixa-status-hero ${caixaAberto ? "aberto" : "fechado"}`}>
          <div className="caixa-status-icon">
            {caixaAberto ? <FaLockOpen /> : <FaLock />}
          </div>

          <div>
            <span>{caixaAberto ? "CAIXA ABERTO" : "CAIXA FECHADO"}</span>
            <p>
              {caixaAberto
                ? `Aberto por ${caixa?.operador || "Administrador"}`
                : "Abra o caixa para iniciar as vendas"}
            </p>
          </div>

          <div className="caixa-hero-metric">
            <small>Saldo Inicial</small>
            <strong>R$ {Number(saldoInicial || 0).toFixed(2)}</strong>
          </div>

          <div className="caixa-hero-metric">
            <small>Vendas do Dia</small>
            <strong className="green">R$ {resumo.total.toFixed(2)}</strong>
          </div>

          <div className="caixa-hero-metric">
            <small>Saldo Atual</small>
            <strong>R$ {resumo.saldoAtual.toFixed(2)}</strong>
          </div>

          <div style={{ marginBottom: 12 }}>
  <input
    type="number"
    placeholder="Dinheiro contado no caixa"
    value={valorContado}
    onChange={(e) =>
      setValorContado(e.target.value)
    }
  />

  <textarea
    placeholder="Observação do fechamento"
    value={observacaoFechamento}
    onChange={(e) =>
      setObservacaoFechamento(e.target.value)
    }
  />
</div>

<div style={{ marginBottom: 8 }}>
  <strong>
    Saldo esperado:
    R$ {resumo.saldoAtual.toFixed(2)}
  </strong>
</div>

{valorContado && (
  <div
    style={{
      marginBottom: 12,
      padding: 10,
      borderRadius: 10,
      background:
        Number(valorContado) - Number(resumo.saldoAtual) === 0
          ? "#166534"
          : "#991b1b",
      color: "#fff",
    }}
  >
    <strong>
      Diferença:
      R$ {(
        Number(valorContado || 0) -
        Number(resumo.saldoAtual || 0)
      ).toFixed(2)}
    </strong>
  </div>
)}

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
            <strong>{resumo.quantidadePedidos}</strong>
            <p>Pedidos registrados</p>
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
            <span>Status</span>
            <strong>{caixaAberto ? "Aberto" : "Fechado"}</strong>
            <p>Situação atual</p>
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
                  {resumo.vendas.slice(0, 8).map((pedido) => (
                    <tr key={pedido._id}>
                      <td>#{pedido._id?.slice(-5)}</td>
                      <td>{pedido.cliente || "Cliente Balcão"}</td>
                      <td>{pedido.mesa || pedido.tipo || "Balcão"}</td>
                      <td>{pedido.pagamento || "PIX"}</td>
                      <td>R$ {Number(pedido.total || 0).toFixed(2)}</td>
                      <td>
                        <span className="pago-badge">{pedido.status || "Pago"}</span>
                      </td>
                      <td>
                        <button className="eye-btn">
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {resumo.vendas.length === 0 && (
                    <tr>
                      <td colSpan="7">Nenhum pedido registrado neste caixa.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="caixa-side-column">
            <div className="caixa-pro-card">
              <h2>Resumo de Pagamentos</h2>

              <div className="donut-caixa">
                <span>
                  Total
                  <br />
                  R$ {resumo.total.toFixed(2)}
                </span>
              </div>

              <div className="pagamento-resumo">
                <p>
                  <FaQrcode /> PIX <strong>R$ {resumo.pix.toFixed(2)}</strong>
                </p>

                <p>
                  <FaCreditCard /> Cartão Crédito{" "}
                  <strong>R$ {resumo.credito.toFixed(2)}</strong>
                </p>

                <p>
                  <FaCreditCard /> Cartão Débito{" "}
                  <strong>R$ {resumo.debito.toFixed(2)}</strong>
                </p>

                <p>
                  <FaWallet /> Dinheiro{" "}
                  <strong>R$ {resumo.dinheiro.toFixed(2)}</strong>
                </p>
              </div>
            </div>

            <div className="caixa-pro-card">
              <h2>Detalhamento do Caixa</h2>

              <div className="caixa-detail-line">
                <span>Saldo Inicial</span>
                <strong>R$ {Number(saldoInicial || 0).toFixed(2)}</strong>
              </div>

              <div className="caixa-detail-line">
                <span>(+) Total de Vendas</span>
                <strong>R$ {resumo.total.toFixed(2)}</strong>
              </div>

              <div className="caixa-detail-line">
                <span>(+) Suprimentos</span>
                <strong>R$ {resumo.totalSuprimentos.toFixed(2)}</strong>
              </div>
              <div style={{ marginBottom: 8 }}>
  
</div>

              <div className="caixa-detail-line red">
                <span>(-) Sangrias</span>
                <strong>R$ {resumo.totalSangrias.toFixed(2)}</strong>
              </div>

              <div className="caixa-detail-line total">
                <span>Saldo Atual</span>
                <strong>R$ {resumo.saldoAtual.toFixed(2)}</strong>
              </div>
            </div>

            <div className="caixa-pro-card">
              <div className="caixa-card-header">
                <h2>Sangria</h2>
              </div>

              <input
                type="number"
                placeholder="Valor da sangria"
                value={valorSangria}
                onChange={(e) => setValorSangria(e.target.value)}
                style={{ width: "100%", marginBottom: 8, padding: 10 }}
              />

              <input
                placeholder="Motivo"
                value={motivoSangria}
                onChange={(e) => setMotivoSangria(e.target.value)}
                style={{ width: "100%", marginBottom: 8, padding: 10 }}
              />

              <button onClick={registrarSangria}>Registrar Sangria</button>

              <div className="empty-sangria">
                {caixa?.sangrias?.length
                  ? `${caixa.sangrias.length} sangria(s) registrada(s).`
                  : "Nenhuma sangria registrada."}
              </div>
            </div>

            <div className="caixa-pro-card">
              <div className="caixa-card-header">
                <h2>Suprimento</h2>
              </div>

              <input
                type="number"
                placeholder="Valor do suprimento"
                value={valorSuprimento}
                onChange={(e) => setValorSuprimento(e.target.value)}
                style={{ width: "100%", marginBottom: 8, padding: 10 }}
              />

              <input
                placeholder="Motivo"
                value={motivoSuprimento}
                onChange={(e) => setMotivoSuprimento(e.target.value)}
                style={{ width: "100%", marginBottom: 8, padding: 10 }}
              />

              <button onClick={registrarSuprimento}>Registrar Suprimento</button>

              <div className="empty-sangria">
                {caixa?.suprimentos?.length
                  ? `${caixa.suprimentos.length} suprimento(s) registrado(s).`
                  : "Nenhum suprimento registrado."}
              </div>
            </div>

            <div className="caixa-pro-card">
              <h2>Atividades do Caixa</h2>

              <div className="caixa-atividades">
                <p>
                  <span></span>{" "}
                  {caixaAberto ? "Caixa aberto" : "Caixa fechado"}
                </p>
                <p>
                  <span></span> Pedidos sincronizados
                </p>
                <p>
                  <span></span> Vendas integradas ao PDV
                </p>
                <p>
                  <span></span> Pagamentos calculados automaticamente
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AdminLayout>
  );
}

export default Caixa;