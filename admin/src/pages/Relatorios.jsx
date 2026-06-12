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
} from "react-icons/fa";

import "../styles/relatorios.css";

function Relatorios() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);

  const hoje = new Date().toISOString().slice(0, 10);

  const inicioMes = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  )
    .toISOString()
    .slice(0, 10);

  const [filtros, setFiltros] = useState({
    inicio: inicioMes,
    fim: hoje,
  });

  async function carregarRelatorio() {
    try {
      setLoading(true);

      const response = await api.get(
        `/relatorios?inicio=${filtros.inicio}&fim=${filtros.fim}`
      );

      setDados(response.data);
    } catch (error) {
      console.log("Erro ao carregar relatórios:", error);

      const mensagem =
        error.response?.data?.message ||
        "Erro ao carregar relatórios.";

      alert(mensagem);
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
      [],
      ["Produtos Mais Vendidos"],
      ["Produto", "Quantidade"],
      ...(dados.topProdutosVendidos || []).map((p) => [
        p.nome,
        p.quantidade,
      ]),
      [],
      ["Produtos Mais Lucrativos"],
      ["Produto", "Lucro"],
      ...(dados.topProdutosLucrativos || []).map((p) => [
        p.nome,
        p.lucro,
      ]),
    ];

    const csv = linhas.map((linha) => linha.join(";")).join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "relatorio-conceito-fitness.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  const resumo = dados?.resumo || {};

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
              Analise vendas, lucro, CMV, compras, estoque, clientes e fluxo
              financeiro da Conceito Fitness Gourmet.
            </p>
          </div>
        </section>

        <section className="relatorios-filtros-card">
          <div className="filtros-header">
            <div>
              <h2>Filtros do relatório</h2>
              <p>Escolha o período e gere a visão gerencial.</p>
            </div>
          </div>

          <div className="relatorios-filtros-grid">
            <label>
              Data inicial
              <input
                type="date"
                value={filtros.inicio}
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    inicio: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Data final
              <input
                type="date"
                value={filtros.fim}
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    fim: e.target.value,
                  })
                }
              />
            </label>

            <button className="btn-relatorio primary" onClick={carregarRelatorio}>
              <FaFilter />
              Filtrar
            </button>

            <button className="btn-relatorio" onClick={imprimir}>
              <FaPrint />
              Imprimir
            </button>

            <button className="btn-relatorio" onClick={exportarCSV}>
              <FaFileExcel />
              Excel/CSV
            </button>

            <button className="btn-relatorio" onClick={imprimir}>
              <FaFilePdf />
              PDF
            </button>
          </div>
        </section>

        {loading && (
          <div className="relatorios-loading">
            Carregando relatórios...
          </div>
        )}

        {!loading && dados && (
          <>
            <section className="relatorios-kpis">
              <div className="relatorio-kpi">
                <FaMoneyBillWave />
                <span>Faturamento</span>
                <strong>{dinheiro(resumo.faturamento)}</strong>
                <p>Receita no período</p>
              </div>

              <div className="relatorio-kpi">
                <FaChartLine />
                <span>Lucro Bruto</span>
                <strong>{dinheiro(resumo.lucroTotal)}</strong>
                <p>Faturamento - CMV</p>
              </div>

              <div className="relatorio-kpi">
                <FaBoxes />
                <span>CMV</span>
                <strong>{dinheiro(resumo.custoTotal)}</strong>
                <p>Custo dos produtos vendidos</p>
              </div>

              <div className="relatorio-kpi">
                <FaShoppingBag />
                <span>Pedidos</span>
                <strong>{resumo.totalPedidos || 0}</strong>
                <p>Pedidos no período</p>
              </div>

              <div className="relatorio-kpi">
                <FaUsers />
                <span>Ticket Médio</span>
                <strong>{dinheiro(resumo.ticketMedio)}</strong>
                <p>Média por pedido</p>
              </div>

              <div className="relatorio-kpi">
                <FaMoneyBillWave />
                <span>Saldo</span>
                <strong>{dinheiro(resumo.saldo)}</strong>
                <p>Entradas - saídas</p>
              </div>
            </section>

            <section className="relatorios-resumo-financeiro">
              <div className="resumo-box entrada">
                <FaArrowUp />
                <span>Entradas</span>
                <strong>{dinheiro(resumo.entradas)}</strong>
              </div>

              <div className="resumo-box saida">
                <FaArrowDown />
                <span>Saídas</span>
                <strong>{dinheiro(resumo.saidas)}</strong>
              </div>

              <div className="resumo-box">
                <FaBoxes />
                <span>Compras</span>
                <strong>{dinheiro(resumo.totalCompras)}</strong>
              </div>

              <div className="resumo-box">
                <FaChartLine />
                <span>Margem</span>
                <strong>{Number(resumo.margemLucro || 0).toFixed(2)}%</strong>
              </div>
            </section>

            <section className="relatorios-grid">
              <Tabela
                titulo="Produtos Mais Vendidos"
                colunas={["Produto", "Quantidade"]}
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

              <Tabela
                titulo="Top Clientes"
                colunas={["Cliente", "Telefone", "Gasto", "Clube"]}
                vazio="Nenhum cliente encontrado."
                linhas={(dados.topClientes || []).map((cliente) => [
                  cliente.nome,
                  cliente.telefone || "-",
                  dinheiro(cliente.gasto),
                  cliente.clube || "-",
                ])}
              />

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

              <Tabela
                titulo="Movimentações Financeiras"
                colunas={["Tipo", "Origem", "Descrição", "Valor"]}
                vazio="Nenhuma movimentação no período."
                linhas={(dados.movimentacoes || []).slice(0, 20).map((m) => [
                  m.tipo,
                  m.origem,
                  m.descricao,
                  dinheiro(m.valor),
                ])}
              />

              <Tabela
                titulo="Compras"
                colunas={["Fornecedor", "Valor", "Status"]}
                vazio="Nenhuma compra no período."
                linhas={(dados.compras || []).slice(0, 20).map((compra) => [
                  compra.fornecedor?.nome || compra.fornecedorNome || "-",
                  dinheiro(compra.valorTotal),
                  compra.status,
                ])}
              />
            </section>
          </>
        )}
      </div>
    </AdminLayout>
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

export default Relatorios;