import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";

import {
  FaChartLine,
  FaMoneyBillWave,
  FaShoppingBag,
  FaBoxes,
  FaUsers,
  FaPrint,
  FaFilePdf,
  FaFileExcel,
  FaFilter,
  FaArrowUp,
  FaArrowDown,
  FaClipboardList,
} from "react-icons/fa";

import "../styles/relatorios.css";

function Relatorios() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);

  const hoje = new Date().toISOString().slice(0, 10);
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [filtros, setFiltros] = useState({
    inicio: inicioMes,
    fim: hoje,
    tipo: "geral",
  });

  async function carregarRelatorio() {
    try {
      setLoading(true);

      const response = await api.get(
        `/relatorios?inicio=${filtros.inicio}&fim=${filtros.fim}&tipo=${filtros.tipo}`
      );

      setDados(response.data);
    } catch (error) {
      console.log("Erro ao carregar relatórios:", error);
      alert(error.response?.data?.message || "Erro ao carregar relatórios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarRelatorio();
  }, []);

  function dinheiro(valor) {
    return `R$ ${Number(valor || 0).toFixed(2)}`;
  }

  function imprimir() {
    window.print();
  }

  function exportarCSV() {
    if (!dados) return;

    const linhas = [
      ["Relatório Conceito Fitness Gourmet"],
      ["Tipo", filtros.tipo],
      ["Período", filtros.inicio, filtros.fim],
      [],
      ["Resumo"],
      ["Faturamento", dados.resumo?.faturamento || 0],
      ["Lucro bruto", dados.resumo?.lucroTotal || 0],
      ["CMV", dados.resumo?.custoTotal || 0],
      ["Margem", `${dados.resumo?.margemLucro || 0}%`],
      ["Entradas", dados.resumo?.entradas || 0],
      ["Saídas", dados.resumo?.saidas || 0],
      ["Saldo", dados.resumo?.saldo || 0],
      ["Pedidos", dados.resumo?.totalPedidos || 0],
      ["Ticket médio", dados.resumo?.ticketMedio || 0],
    ];

    const csv = linhas.map((linha) => linha.join(";")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `relatorio-${filtros.tipo}-conceito.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  const resumo = dados?.resumo || {};

  const mostrar = (tipo) => filtros.tipo === "geral" || filtros.tipo === tipo;

  return (
    <AdminLayout
      title="Relatórios"
      subtitle="Vendas, financeiro, compras, produção, estoque e clientes"
    >
      <div className="relatorios-page">
        <section className="relatorios-hero">
          <div>
            <span>Central de inteligência</span>
            <h1>Relatórios Gerenciais</h1>
            <p>
              Escolha o tipo de relatório, filtre por data e imprima somente o
              que precisar.
            </p>
          </div>
        </section>

        <section className="relatorios-filtros-card no-print">
          <div className="filtros-header">
            <div>
              <h2>Filtros do relatório</h2>
              <p>Você pode buscar por período ou por um único dia.</p>
            </div>
          </div>

          <div className="relatorios-filtros-grid novo-layout">
            <label>
              Tipo de relatório
              <select
                value={filtros.tipo}
                onChange={(e) =>
                  setFiltros({ ...filtros, tipo: e.target.value })
                }
              >
                <option value="geral">Relatório Completo</option>
                <option value="vendas">Vendas</option>
                <option value="financeiro">Financeiro</option>
                <option value="compras">Compras</option>
                <option value="estoque">Estoque</option>
                <option value="clientes">Clientes</option>
              </select>
            </label>

            <label>
              Data inicial
              <input
                type="date"
                value={filtros.inicio}
                onChange={(e) =>
                  setFiltros({ ...filtros, inicio: e.target.value })
                }
              />
            </label>

            <label>
              Data final
              <input
                type="date"
                value={filtros.fim}
                onChange={(e) =>
                  setFiltros({ ...filtros, fim: e.target.value })
                }
              />
            </label>

            <button className="btn-relatorio primary" onClick={carregarRelatorio}>
              <FaFilter /> Filtrar
            </button>

            <button className="btn-relatorio" onClick={imprimir}>
              <FaPrint /> Imprimir
            </button>

            <button className="btn-relatorio" onClick={exportarCSV}>
              <FaFileExcel /> Excel/CSV
            </button>

            <button className="btn-relatorio" onClick={imprimir}>
              <FaFilePdf /> PDF
            </button>
          </div>
        </section>

        {loading && <div className="relatorios-loading">Carregando...</div>}

        {!loading && dados && (
          <div className="area-impressao">
            <section className="relatorio-titulo-print">
              <h1>Conceito Fitness Gourmet</h1>
              <p>
                Relatório: {filtros.tipo.toUpperCase()} | Período:{" "}
                {filtros.inicio} até {filtros.fim}
              </p>
            </section>

            <section className="relatorios-kpis">
              <Kpi icon={<FaMoneyBillWave />} titulo="Faturamento" valor={dinheiro(resumo.faturamento)} texto="Receita no período" />
              <Kpi icon={<FaChartLine />} titulo="Lucro Bruto" valor={dinheiro(resumo.lucroTotal)} texto="Faturamento - CMV" />
              <Kpi icon={<FaBoxes />} titulo="CMV" valor={dinheiro(resumo.custoTotal)} texto="Custo dos vendidos" />
              <Kpi icon={<FaShoppingBag />} titulo="Pedidos" valor={resumo.totalPedidos || 0} texto="Pedidos no período" />
              <Kpi icon={<FaUsers />} titulo="Ticket Médio" valor={dinheiro(resumo.ticketMedio)} texto="Média por pedido" />
              <Kpi icon={<FaMoneyBillWave />} titulo="Saldo" valor={dinheiro(resumo.saldo)} texto="Entradas - saídas" />
            </section>

            <section className="relatorios-resumo-financeiro">
              <Resumo icon={<FaArrowUp />} titulo="Entradas" valor={dinheiro(resumo.entradas)} />
              <Resumo icon={<FaArrowDown />} titulo="Saídas" valor={dinheiro(resumo.saidas)} />
              <Resumo icon={<FaBoxes />} titulo="Compras" valor={dinheiro(resumo.totalCompras)} />
              <Resumo icon={<FaChartLine />} titulo="Margem" valor={`${Number(resumo.margemLucro || 0).toFixed(2)}%`} />
            </section>

            <section className="relatorios-grid">
              {mostrar("vendas") && (
                <>
                  <Tabela
                    titulo="Vendas / Pedidos"
                    colunas={["Data", "Cliente", "Pagamento", "Status", "Total"]}
                    vazio="Nenhuma venda no período."
                    linhas={(dados.pedidos || []).map((p) => [
                      dataBR(p.createdAt),
                      p.cliente || "Cliente Balcão",
                      p.pagamento || "-",
                      p.status || "-",
                      dinheiro(p.total),
                    ])}
                  />

                  <Tabela
                    titulo="Produtos Mais Vendidos"
                    colunas={["Produto", "Qtd"]}
                    vazio="Nenhum produto vendido no período."
                    linhas={(dados.topProdutosVendidos || []).map((item) => [
                      item.nome,
                      item.quantidade,
                    ])}
                  />

                  <Tabela
                    titulo="Produtos Mais Lucrativos"
                    colunas={["Produto", "Lucro"]}
                    vazio="Nenhum produto lucrativo no período."
                    linhas={(dados.topProdutosLucrativos || []).map((item) => [
                      item.nome,
                      dinheiro(item.lucro),
                    ])}
                  />
                </>
              )}

              {mostrar("financeiro") && (
                <>
                  <Tabela
                    titulo="Movimentações Financeiras"
                    colunas={["Data", "Tipo", "Origem", "Descrição", "Valor"]}
                    vazio="Nenhuma movimentação no período."
                    linhas={(dados.movimentacoes || []).map((m) => [
                      dataBR(m.createdAt || m.data),
                      m.tipo,
                      m.origem,
                      m.descricao,
                      dinheiro(m.valor),
                    ])}
                  />

                  <Tabela
                    titulo="Contas a Pagar"
                    colunas={["Descrição", "Categoria", "Valor", "Status"]}
                    vazio="Nenhuma conta a pagar."
                    linhas={(dados.contasPagar || []).map((c) => [
                      c.descricao,
                      c.categoria,
                      dinheiro(c.valor),
                      c.status,
                    ])}
                  />

                  <Tabela
                    titulo="Contas a Receber"
                    colunas={["Descrição", "Cliente", "Valor", "Status"]}
                    vazio="Nenhuma conta a receber."
                    linhas={(dados.contasReceber || []).map((c) => [
                      c.descricao,
                      c.cliente,
                      dinheiro(c.valor),
                      c.status,
                    ])}
                  />
                </>
              )}

              {mostrar("compras") && (
                <Tabela
                  titulo="Compras"
                  colunas={["Data", "Fornecedor", "Valor", "Pagamento", "Status"]}
                  vazio="Nenhuma compra no período."
                  linhas={(dados.compras || []).map((compra) => [
                    dataBR(compra.createdAt || compra.dataCompra),
                    compra.fornecedor?.nome || compra.fornecedorNome || "-",
                    dinheiro(compra.valorTotal),
                    compra.formaPagamento || "-",
                    compra.status,
                  ])}
                />
              )}

              {mostrar("clientes") && (
                <Tabela
                  titulo="Principais Clientes"
                  colunas={["Cliente", "Telefone", "Gasto", "Clube"]}
                  vazio="Nenhum cliente encontrado."
                  linhas={(dados.topClientes || []).map((cliente) => [
                    cliente.nome,
                    cliente.telefone || "-",
                    dinheiro(cliente.gasto),
                    cliente.clube || "-",
                  ])}
                />
              )}

              {mostrar("estoque") && (
                <Tabela
                  titulo="Estoque Baixo"
                  colunas={["Matéria-prima", "Estoque", "Mínimo"]}
                  vazio="Nenhum estoque baixo."
                  linhas={(dados.estoqueBaixo || []).map((item) => [
                    item.nome,
                    item.estoqueAtual,
                    item.estoqueMinimo,
                  ])}
                />
              )}
            </section>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Kpi({ icon, titulo, valor, texto }) {
  return (
    <div className="relatorio-kpi">
      {icon}
      <span>{titulo}</span>
      <strong>{valor}</strong>
      <p>{texto}</p>
    </div>
  );
}

function Resumo({ icon, titulo, valor }) {
  return (
    <div className="resumo-box">
      {icon}
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function Tabela({ titulo, colunas, linhas, vazio }) {
  return (
    <div className="relatorio-card-tabela">
      <h2>{titulo}</h2>

      <div className="tabela-scroll">
        <table>
          <thead>
            <tr>
              {colunas.map((coluna) => (
                <th key={coluna}>{coluna}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {linhas.length > 0 ? (
              linhas.map((linha, index) => (
                <tr key={index}>
                  {linha.map((valor, i) => (
                    <td key={i}>{valor}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={colunas.length}>{vazio}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function dataBR(data) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

export default Relatorios;