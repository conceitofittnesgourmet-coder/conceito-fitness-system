import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";

import {
  FaDollarSign,
  FaWallet,
  FaClock,
  FaArrowDown,
  FaChartBar,
  FaPlus,
  FaCheck,
  FaTrash,
} from "react-icons/fa";

function Financeiro() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const hoje = new Date().toISOString().slice(0, 10);
const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString()
  .slice(0, 10);

const [filtros, setFiltros] = useState({
  inicio: inicioMes,
  fim: hoje,
  busca: "",
  formaPagamento: "",
  tipo: "",
});

  const [novaPagar, setNovaPagar] = useState({
    descricao: "",
    categoria: "",
    fornecedor: "",
    valor: "",
    vencimento: "",
  });

  const [novaReceber, setNovaReceber] = useState({
    descricao: "",
    cliente: "",
    valor: "",
    vencimento: "",
  });

 async function carregarFinanceiro() {
  try {
    setLoading(true);

    const params = new URLSearchParams();

    if (filtros.inicio) params.append("inicio", filtros.inicio);
    if (filtros.fim) params.append("fim", filtros.fim);
    if (filtros.busca) params.append("busca", filtros.busca);
    if (filtros.formaPagamento) params.append("formaPagamento", filtros.formaPagamento);
    if (filtros.tipo) params.append("tipo", filtros.tipo);

    const response = await api.get(`/financeiro?${params.toString()}`);

    setDados(response.data);
  } catch (error) {
    console.log("Erro financeiro:", error);
    alert("Erro ao carregar financeiro.");
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    carregarFinanceiro();
  }, []);

  const resumo = dados?.resumo || {};
  const contasPagar = dados?.contasPagar || [];
  const contasReceber = dados?.contasReceber || [];
  const movimentacoes = dados?.movimentacoes || [];

  async function criarContaPagar() {
    if (!novaPagar.descricao || !novaPagar.valor || !novaPagar.vencimento) {
      alert("Preencha descrição, valor e vencimento.");
      return;
    }

    await api.post("/financeiro/contas-pagar", novaPagar);

    setNovaPagar({
      descricao: "",
      categoria: "",
      fornecedor: "",
      valor: "",
      vencimento: "",
    });

    carregarFinanceiro();
  }

  async function criarContaReceber() {
    if (!novaReceber.descricao || !novaReceber.valor || !novaReceber.vencimento) {
      alert("Preencha descrição, valor e vencimento.");
      return;
    }

    await api.post("/financeiro/contas-receber", novaReceber);

    setNovaReceber({
      descricao: "",
      cliente: "",
      valor: "",
      vencimento: "",
    });

    carregarFinanceiro();
  }

  async function pagarConta(id) {
    await api.put(`/financeiro/contas-pagar/${id}/pagar`, {
      formaPagamento: "PIX",
    });

    carregarFinanceiro();
  }

  async function receberConta(id) {
    await api.put(`/financeiro/contas-receber/${id}/receber`, {
      formaRecebimento: "PIX",
    });

    carregarFinanceiro();
  }

  async function cancelarContaPagar(id) {
    if (!window.confirm("Cancelar esta conta a pagar?")) return;

    await api.delete(`/financeiro/contas-pagar/${id}`);
    carregarFinanceiro();
  }

  async function cancelarContaReceber(id) {
    if (!window.confirm("Cancelar esta conta a receber?")) return;

    await api.delete(`/financeiro/contas-receber/${id}`);
    carregarFinanceiro();
  }

  function formatarData(data) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function dinheiro(valor) {
    return `R$ ${Number(valor || 0).toFixed(2)}`;
  }

  if (loading) {
    return (
      <AdminLayout title="Financeiro" subtitle="Carregando financeiro...">
        <div className="card">Carregando...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Financeiro" subtitle="Controle financeiro real do ERP">
      <div className="financeiro-premium-page">
        <section className="financeiro-topbar">
          <div>
            <h1>Financeiro</h1>
            <p>Contas a pagar, receber, fluxo de caixa e movimentações reais.</p>
          </div>
        </section>

        <section className="financeiro-card" style={{ marginBottom: 20 }}>
  <h2>Filtros do Financeiro</h2>

  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
    <input
      type="date"
      value={filtros.inicio}
      onChange={(e) => setFiltros({ ...filtros, inicio: e.target.value })}
    />

    <input
      type="date"
      value={filtros.fim}
      onChange={(e) => setFiltros({ ...filtros, fim: e.target.value })}
    />

    <input
      placeholder="Buscar descrição/categoria"
      value={filtros.busca}
      onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
    />

    <select
      value={filtros.formaPagamento}
      onChange={(e) => setFiltros({ ...filtros, formaPagamento: e.target.value })}
    >
      <option value="">Todas as formas</option>
      <option value="PIX">PIX</option>
      <option value="DINHEIRO">Dinheiro</option>
      <option value="CREDITO">Crédito</option>
      <option value="DEBITO">Débito</option>
    </select>

    <select
      value={filtros.tipo}
      onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
    >
      <option value="">Entradas e saídas</option>
      <option value="entrada">Entradas</option>
      <option value="saida">Saídas</option>
    </select>
  </div>

  <button style={{ marginTop: 12 }} onClick={carregarFinanceiro}>
    Aplicar Filtros
  </button>
</section>

        <section className="financeiro-kpis">
          <div className="financeiro-kpi green">
            <FaDollarSign />
            <span>Entradas</span>
            <strong>{dinheiro(resumo.entradas)}</strong>
            <p>Receitas registradas</p>
          </div>

          <div className="financeiro-kpi purple">
            <FaArrowDown />
            <span>Saídas</span>
            <strong>{dinheiro(resumo.saidas)}</strong>
            <p>Despesas pagas</p>
          </div>

          <div className="financeiro-kpi blue">
            <FaWallet />
            <span>Saldo</span>
            <strong>{dinheiro(resumo.saldo)}</strong>
            <p>Entradas - saídas</p>
          </div>

          <div className="financeiro-kpi yellow">
            <FaClock />
            <span>A Receber</span>
            <strong>{dinheiro(resumo.totalReceberPendente)}</strong>
            <p>Pendente</p>
          </div>

          <div className="financeiro-kpi red">
            <FaChartBar />
            <span>A Pagar</span>
            <strong>{dinheiro(resumo.totalPagarPendente)}</strong>
            <p>Pendente</p>
          </div>
        </section>

        <section className="financeiro-grid">
          <div className="financeiro-card">
            <h2><FaPlus /> Nova Conta a Pagar</h2>

            <input placeholder="Descrição" value={novaPagar.descricao} onChange={(e) => setNovaPagar({ ...novaPagar, descricao: e.target.value })} />
            <input placeholder="Categoria" value={novaPagar.categoria} onChange={(e) => setNovaPagar({ ...novaPagar, categoria: e.target.value })} />
            <input placeholder="Fornecedor" value={novaPagar.fornecedor} onChange={(e) => setNovaPagar({ ...novaPagar, fornecedor: e.target.value })} />
            <input type="number" placeholder="Valor" value={novaPagar.valor} onChange={(e) => setNovaPagar({ ...novaPagar, valor: e.target.value })} />
            <input type="date" value={novaPagar.vencimento} onChange={(e) => setNovaPagar({ ...novaPagar, vencimento: e.target.value })} />

            <button onClick={criarContaPagar}>Cadastrar Conta a Pagar</button>
          </div>

          <div className="financeiro-card">
            <h2><FaPlus /> Nova Conta a Receber</h2>

            <input placeholder="Descrição" value={novaReceber.descricao} onChange={(e) => setNovaReceber({ ...novaReceber, descricao: e.target.value })} />
            <input placeholder="Cliente" value={novaReceber.cliente} onChange={(e) => setNovaReceber({ ...novaReceber, cliente: e.target.value })} />
            <input type="number" placeholder="Valor" value={novaReceber.valor} onChange={(e) => setNovaReceber({ ...novaReceber, valor: e.target.value })} />
            <input type="date" value={novaReceber.vencimento} onChange={(e) => setNovaReceber({ ...novaReceber, vencimento: e.target.value })} />

            <button onClick={criarContaReceber}>Cadastrar Conta a Receber</button>
          </div>

          <div className="financeiro-card movimentacoes grande">
            <h2>Contas a Pagar</h2>

            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {contasPagar.map((conta) => (
                  <tr key={conta._id}>
                    <td>{conta.descricao}</td>
                    <td className="valor-negativo">{dinheiro(conta.valor)}</td>
                    <td>{formatarData(conta.vencimento)}</td>
                    <td>{conta.status}</td>
                    <td>
                      {conta.status !== "paga" && conta.status !== "cancelada" && (
                        <button onClick={() => pagarConta(conta._id)}>
                          <FaCheck /> Pagar
                        </button>
                      )}

                      {conta.status !== "cancelada" && (
                        <button onClick={() => cancelarContaPagar(conta._id)}>
                          <FaTrash />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="financeiro-card movimentacoes grande">
            <h2>Contas a Receber</h2>

            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Cliente</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {contasReceber.map((conta) => (
                  <tr key={conta._id}>
                    <td>{conta.descricao}</td>
                    <td>{conta.cliente || "-"}</td>
                    <td className="valor-positivo">{dinheiro(conta.valor)}</td>
                    <td>{formatarData(conta.vencimento)}</td>
                    <td>{conta.status}</td>
                    <td>
                      {conta.status !== "recebida" && conta.status !== "cancelada" && (
                        <button onClick={() => receberConta(conta._id)}>
                          <FaCheck /> Receber
                        </button>
                      )}

                      {conta.status !== "cancelada" && (
                        <button onClick={() => cancelarContaReceber(conta._id)}>
                          <FaTrash />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="financeiro-card movimentacoes grande">
            <h2>Fluxo de Caixa</h2>

            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Origem</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Data</th>
                </tr>
              </thead>

              <tbody>
                {movimentacoes.map((mov) => (
                  <tr key={mov._id}>
                    <td>{mov.descricao}</td>
                    <td>{mov.origem}</td>
                    <td>{mov.tipo}</td>
                    <td className={mov.tipo === "entrada" ? "valor-positivo" : "valor-negativo"}>
                      {dinheiro(mov.valor)}
                    </td>
                    <td>{formatarData(mov.data)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default Financeiro;