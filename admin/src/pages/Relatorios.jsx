import { useEffect, useMemo, useState } from "react";
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
    tipo: "vendas",
    inicio: inicioMes,
    fim: hoje,
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

  const resumo = dados?.resumo || {};

  const totalItensVendidos = useMemo(() => {
    return (dados?.topProdutosVendidos || []).reduce(
      (acc, item) => acc + Number(item.quantidade || 0),
      0
    );
  }, [dados]);

  function dinheiro(valor) {
    return `R$ ${Number(valor || 0).toFixed(2)}`;
  }

  function dataBR(data) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function dataHoraBR(data = new Date()) {
    return new Date(data).toLocaleString("pt-BR");
  }

  function imprimirA4() {
    document.body.classList.remove("termica-print");
    setTimeout(() => window.print(), 150);
  }

  function imprimirTermica() {
    document.body.classList.add("termica-print");
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove("termica-print"), 500);
    }, 150);
  }

  function exportarCSV() {
    if (!dados) return;

    const linhas = [
      ["Relatório Conceito Fitness Gourmet"],
      ["Tipo", filtros.tipo],
      ["Período", filtros.inicio, filtros.fim],
      [],
      ["Resumo"],
      ["Faturamento", resumo.faturamento || 0],
      ["Lucro bruto", resumo.lucroTotal || 0],
      ["CMV", resumo.custoTotal || 0],
      ["Margem", `${resumo.margemLucro || 0}%`],
      ["Pedidos", resumo.totalPedidos || 0],
      ["Ticket médio", resumo.ticketMedio || 0],
      ["Entradas", resumo.entradas || 0],
      ["Saídas", resumo.saidas || 0],
      ["Saldo", resumo.saldo || 0],
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
              Escolha o relatório, filtre por data e imprima em A4 ou na térmica
              MP4200TH.
            </p>
          </div>
        </section>

        <section className="relatorios-filtros-card no-print">
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
                <option value="vendas">Vendas / Pedidos</option>
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

            <button className="btn-relatorio" onClick={imprimirA4}>
              <FaPrint /> Imprimir A4
            </button>

            <button className="btn-relatorio" onClick={imprimirTermica}>
              <FaPrint /> Térmica
            </button>

            <button className="btn-relatorio" onClick={exportarCSV}>
              <FaFileExcel /> Excel/CSV
            </button>

            <button className="btn-relatorio" onClick={imprimirA4}>
              <FaFilePdf /> PDF
            </button>
          </div>
        </section>

        {loading && <div className="relatorios-loading">Carregando...</div>}

        {!loading && dados && (
          <>
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
                <Kpi icon={<FaShoppingBag />} titulo="Pedidos" valor={resumo.totalPedidos || 0} texto="Total de pedidos" />
                <Kpi icon={<FaUsers />} titulo="Ticket Médio" valor={dinheiro(resumo.ticketMedio)} texto="Média por pedido" />
                <Kpi icon={<FaBoxes />} titulo="Itens Vendidos" valor={totalItensVendidos} texto="Total de itens" />
                <Kpi icon={<FaChartLine />} titulo="Lucro Bruto" valor={dinheiro(resumo.lucroTotal)} texto="Faturamento - CMV" />
                <Kpi icon={<FaMoneyBillWave />} titulo="Saldo" valor={dinheiro(resumo.saldo)} texto="Entradas - saídas" />
              </section>

<section className="relatorios-dashboard">
  <div className="dashboard-card sucesso">
    <span>Faturamento</span>
    <strong>{dinheiro(resumo.faturamento)}</strong>
  </div>

  <div className="dashboard-card lucro">
    <span>Lucro Bruto</span>
    <strong>{dinheiro(resumo.lucroTotal)}</strong>
  </div>

  <div className="dashboard-card caixa">
    <span>Saldo Financeiro</span>
    <strong>{dinheiro(resumo.saldo)}</strong>
  </div>

  <div className="dashboard-card compras">
    <span>Compras</span>
    <strong>{dinheiro(resumo.totalCompras)}</strong>
  </div>

  <div className="dashboard-card alerta">
    <span>Contas a Pagar</span>
    <strong>{dinheiro(resumo.contasPagarTotal)}</strong>
  </div>

  <div className="dashboard-card receber">
    <span>Contas a Receber</span>
    <strong>{dinheiro(resumo.contasReceberTotal)}</strong>
  </div>

  <div className="dashboard-card estoque">
    <span>Estoque Crítico</span>
    <strong>{resumo.estoqueBaixo || 0}</strong>
  </div>

  <div className="dashboard-card ticket">
    <span>Ticket Médio</span>
    <strong>{dinheiro(resumo.ticketMedio)}</strong>
  </div>
</section>

<section className="relatorio-card-tabela">
  <h2>DRE Gerencial</h2>

  <table>
    <tbody>
      <tr>
        <td>Receita Bruta</td>
        <td>{dinheiro(resumo.faturamento)}</td>
      </tr>

      <tr>
        <td>(-) CMV</td>
        <td>{dinheiro(resumo.custoTotal)}</td>
      </tr>

      <tr>
        <td>= Lucro Bruto</td>
        <td>{dinheiro(resumo.lucroTotal)}</td>
      </tr>

      <tr>
        <td>(-) Compras</td>
        <td>{dinheiro(resumo.totalCompras)}</td>
      </tr>

      <tr>
        <td>(-) Contas a Pagar</td>
        <td>{dinheiro(resumo.contasPagarTotal)}</td>
      </tr>

      <tr>
        <td>
          <strong>Resultado Operacional</strong>
        </td>
        <td>
          <strong>
            {dinheiro(
              (resumo.lucroTotal || 0)
              - (resumo.totalCompras || 0)
              - (resumo.contasPagarTotal || 0)
            )}
          </strong>
        </td>
      </tr>
    </tbody>
  </table>
</section>

<section className="relatorio-card-tabela">
  <h2>Vendas por Forma de Pagamento</h2>

  <table>
    <tbody>
      {Object.entries(dados.vendasPorPagamento || {}).map(([forma, valor]) => (
        <tr key={forma}>
          <td>{forma}</td>
          <td>{dinheiro(valor)}</td>
        </tr>
      ))}

      {Object.keys(dados.vendasPorPagamento || {}).length === 0 && (
        <tr>
          <td colSpan="2">Nenhuma venda por pagamento no período.</td>
        </tr>
      )}
    </tbody>
  </table>
</section>

<section className="relatorio-card-tabela">
  <h2>Contas a Pagar — Vencimentos</h2>

  <table>
    <thead>
      <tr>
        <th>Descrição</th>
        <th>Vencimento</th>
        <th>Status</th>
        <th>Valor</th>
      </tr>
    </thead>

    <tbody>
      {(dados.contasPagar || [])
        .filter((conta) => conta.status !== "paga")
        .slice(0, 10)
        .map((conta) => (
          <tr key={conta._id}>
            <td>{conta.descricao}</td>
            <td>{dataBR(conta.vencimento)}</td>
            <td>{conta.status}</td>
            <td>{dinheiro(conta.valor)}</td>
          </tr>
        ))}

      {(dados.contasPagar || []).filter((conta) => conta.status !== "paga")
        .length === 0 && (
        <tr>
          <td colSpan="4">Nenhuma conta pendente no período.</td>
        </tr>
      )}
    </tbody>
  </table>
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
  titulo="Ranking Avançado de Clientes"
  colunas={["Cliente", "Telefone", "Gasto", "Pontos", "Cashback", "Clube"]}
  vazio="Nenhum cliente encontrado."
  linhas={(dados.topClientes || []).map((cliente) => [
    cliente.nome,
    cliente.telefone || "-",
    dinheiro(cliente.gasto),
    cliente.pontos || 0,
    dinheiro(cliente.cashback),
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

            <div className="impressao-termica">
              <div className="termica-centro">
                <strong>CONCEITO FITNESS GOURMET</strong>
                <span>--------------------------------</span>
                <span>RELATÓRIO: {filtros.tipo.toUpperCase()}</span>
                <span>PERÍODO: {filtros.inicio} ATÉ {filtros.fim}</span>
                <span>DATA/HORA: {dataHoraBR()}</span>
                <span>--------------------------------</span>
              </div>

              <h3>RESUMO</h3>
              <Linha label="FATURAMENTO" valor={dinheiro(resumo.faturamento)} />
              <Linha label="PEDIDOS" valor={resumo.totalPedidos || 0} />
              <Linha label="TICKET MÉDIO" valor={dinheiro(resumo.ticketMedio)} />
              <Linha label="ITENS VENDIDOS" valor={totalItensVendidos} />
              <Linha label="ENTRADAS" valor={dinheiro(resumo.entradas)} />
              <Linha label="SAÍDAS" valor={dinheiro(resumo.saidas)} />
              <Linha label="SALDO" valor={dinheiro(resumo.saldo)} />

              {mostrar("vendas") && (
                <>
                  <Separador />
                  <h3>PEDIDOS</h3>
                  {(dados.pedidos || []).slice(0, 20).map((p) => (
                    <div className="termica-item" key={p._id}>
                      <span>{dataBR(p.createdAt)} - {p.cliente || "Balcão"}</span>
                      <strong>{dinheiro(p.total)}</strong>
                    </div>
                  ))}

                  <Separador />
                  <h3>PRODUTOS MAIS VENDIDOS</h3>
                  {(dados.topProdutosVendidos || []).slice(0, 10).map((p) => (
                    <div className="termica-item" key={p.nome}>
                      <span>{p.nome}</span>
                      <strong>{p.quantidade}</strong>
                    </div>
                  ))}

                  <Separador />
                  <h3>PRODUTOS MAIS LUCRATIVOS</h3>
                  {(dados.topProdutosLucrativos || []).slice(0, 10).map((p) => (
                    <div className="termica-item" key={p.nome}>
                      <span>{p.nome}</span>
                      <strong>{dinheiro(p.lucro)}</strong>
                    </div>
                  ))}
                </>
              )}

              {mostrar("financeiro") && (
                <>
                  <Separador />
                  <h3>FINANCEIRO</h3>
                  {(dados.movimentacoes || []).slice(0, 20).map((m) => (
                    <div className="termica-item" key={m._id}>
                      <span>{m.tipo} - {m.origem}</span>
                      <strong>{dinheiro(m.valor)}</strong>
                    </div>
                  ))}
                </>
              )}

              {mostrar("compras") && (
                <>
                  <Separador />
                  <h3>COMPRAS</h3>
                  {(dados.compras || []).slice(0, 20).map((c) => (
                    <div className="termica-item" key={c._id}>
                      <span>{c.fornecedor?.nome || c.fornecedorNome || "-"}</span>
                      <strong>{dinheiro(c.valorTotal)}</strong>
                    </div>
                  ))}
                </>
              )}

              {mostrar("clientes") && (
                <>
                  <Separador />
                  <h3>CLIENTES</h3>
                  {(dados.topClientes || []).slice(0, 20).map((c) => (
                    <div className="termica-item" key={c.telefone || c.nome}>
                      <span>{c.nome}</span>
                      <strong>{dinheiro(c.gasto)}</strong>
                    </div>
                  ))}
                </>
              )}

              {mostrar("estoque") && (
                <>
                  <Separador />
                  <h3>ESTOQUE BAIXO</h3>
                  {(dados.estoqueBaixo || []).length === 0 && (
                    <p>Nenhum estoque baixo.</p>
                  )}
                  {(dados.estoqueBaixo || []).map((e) => (
                    <div className="termica-item" key={e._id}>
                      <span>{e.nome}</span>
                      <strong>{e.estoqueAtual}/{e.estoqueMinimo}</strong>
                    </div>
                  ))}
                </>
              )}

              <Separador />
              <div className="termica-centro">
                <strong>OBRIGADO!</strong>
                <span>CONCEITO FITNESS GOURMET</span>
              </div>
            </div>
          </>
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

function Linha({ label, valor }) {
  return (
    <div className="termica-linha">
      <span>{label}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function Separador() {
  return <div className="termica-separador">--------------------------------</div>;
}

export default Relatorios;