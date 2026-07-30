import { useEffect, useMemo, useState } from "react";
import { FaIndustry, FaPlay, FaCheck, FaBan, FaPlus, FaSearch, FaBoxes } from "react-icons/fa";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import "../styles/ordens-producao.css";

const STATUS = {
  aberta: "Aberta",
  em_producao: "Em produção",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

function OrdensProducao() {
  const [ordens, setOrdens] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [resumo, setResumo] = useState({ aberta: 0, em_producao: 0, concluida: 0, cancelada: 0, totalAtivas: 0 });
  const [indicadores, setIndicadores] = useState({ ordensConcluidas: 0, unidadesProduzidas: 0, cmvProduzido: 0, lucroBrutoPotencial: 0, margemBrutaPotencial: 0, recentes: [] });
  const [filtro, setFiltro] = useState("");
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [analise, setAnalise] = useState(null);
  const [analisandoId, setAnalisandoId] = useState("");
  const [form, setForm] = useState({ produto: "", quantidadePlanejada: "", unidade: "UN", responsavel: "", prioridade: 0, dataPlanejada: "", observacoes: "" });

  async function carregar() {
    setCarregando(true);
    try {
      const params = {};
      if (filtro) params.status = filtro;
      if (busca.trim()) params.busca = busca.trim();
      const [ordensRes, resumoRes, produtosRes, indicadoresRes] = await Promise.all([
        api.get("/producao/ordens", { params }),
        api.get("/producao/ordens/resumo"),
        api.get("/produtos"),
        api.get("/producao/ordens/indicadores", { params: { dias: 30, limite: 8 } }),
      ]);
      setOrdens(ordensRes.data.ordens || []);
      setResumo(resumoRes.data.resumo || {});
      setProdutos(produtosRes.data.produtos || produtosRes.data || []);
      setIndicadores(indicadoresRes.data.indicadores || {});
    } catch (error) {
      alert(error.response?.data?.message || "Não foi possível carregar as ordens de produção.");
    } finally { setCarregando(false); }
  }

  useEffect(() => { carregar(); }, [filtro]);

  const produtoSelecionado = useMemo(() => produtos.find((p) => p._id === form.produto), [produtos, form.produto]);

  async function criarOrdem(event) {
    event.preventDefault();
    if (!form.produto || Number(form.quantidadePlanejada) <= 0) return alert("Selecione o produto e informe a quantidade.");
    try {
      await api.post("/producao/ordens", { ...form, quantidadePlanejada: Number(form.quantidadePlanejada), prioridade: Number(form.prioridade) });
      setForm({ produto: "", quantidadePlanejada: "", unidade: "UN", responsavel: "", prioridade: 0, dataPlanejada: "", observacoes: "" });
      await carregar();
    } catch (error) { alert(error.response?.data?.message || "Erro ao criar ordem."); }
  }


  async function analisarInsumos(ordem) {
    setAnalisandoId(ordem._id);
    try {
      const { data } = await api.get(`/producao/ordens/${ordem._id}/insumos`);
      setAnalise({ ordem, ...(data.analise || {}) });
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao analisar ingredientes.");
    } finally { setAnalisandoId(""); }
  }

  async function alterarStatus(ordem, status) {
    const payload = { status };
    if (status === "concluida") {
      const quantidade = prompt("Quantidade efetivamente produzida:", ordem.quantidadePlanejada);
      if (quantidade === null) return;
      payload.quantidadeProduzida = Number(quantidade);
    }
    if (status === "cancelada") {
      const motivo = prompt("Motivo do cancelamento:");
      if (!motivo) return;
      payload.motivoCancelamento = motivo;
    }
    try {
      const { data } = await api.put(`/producao/ordens/${ordem._id}/status`, payload);
      if (status === "concluida") {
        const concluida = data.ordem || {};
        alert(`Produção concluída com sucesso.\nLote: ${concluida.loteProducao || "-"}\nCusto total: R$ ${Number(concluida.custoTotalProducao || 0).toFixed(2)}\nEstoque final: ${Number(concluida.estoqueProdutoDepois || 0).toFixed(2)}`);
      }
      await carregar();
    } catch (error) { alert(error.response?.data?.message || "Erro ao atualizar ordem."); }
  }

  function dataHora(valor) { return valor ? new Date(valor).toLocaleString("pt-BR") : "-"; }

  return (
    <AdminLayout title="Ordens de Produção" subtitle="Planejamento e acompanhamento da produção">
      <div className="op-page">
        <header className="op-header"><div><h1><FaIndustry /> Ordens de Produção</h1><p>Organize o que será produzido, por quem e em qual prazo.</p></div></header>

        <section className="op-kpis">
          <button onClick={() => setFiltro("")}><span>Ativas</span><strong>{resumo.totalAtivas || 0}</strong></button>
          <button onClick={() => setFiltro("aberta")}><span>Abertas</span><strong>{resumo.aberta || 0}</strong></button>
          <button onClick={() => setFiltro("em_producao")}><span>Em produção</span><strong>{resumo.em_producao || 0}</strong></button>
          <button onClick={() => setFiltro("concluida")}><span>Concluídas</span><strong>{resumo.concluida || 0}</strong></button>
        </section>

        <section className="op-gerencial">
          <div><span>CMV produzido (30 dias)</span><strong>R$ {Number(indicadores.cmvProduzido || 0).toFixed(2)}</strong></div>
          <div><span>Unidades produzidas</span><strong>{Number(indicadores.unidadesProduzidas || 0).toFixed(2)}</strong></div>
          <div><span>Lucro bruto potencial</span><strong>R$ {Number(indicadores.lucroBrutoPotencial || 0).toFixed(2)}</strong></div>
          <div><span>Margem potencial</span><strong>{Number(indicadores.margemBrutaPotencial || 0).toFixed(2)}%</strong></div>
        </section>

        <section className="op-grid">
          <form className="op-card op-form" onSubmit={criarOrdem}>
            <h2><FaPlus /> Nova ordem</h2>
            <label>Produto<select value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })}><option value="">Selecione</option>{produtos.map((p) => <option key={p._id} value={p._id}>{p.nome}</option>)}</select></label>
            {produtoSelecionado && <small>Estoque atual do produto: {produtoSelecionado.estoque || 0}</small>}
            <div className="op-form-row"><label>Quantidade<input type="number" min="0.01" step="0.01" value={form.quantidadePlanejada} onChange={(e) => setForm({ ...form, quantidadePlanejada: e.target.value })} /></label><label>Unidade<input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} /></label></div>
            <label>Responsável<input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Nome do responsável" /></label>
            <div className="op-form-row"><label>Prioridade<select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })}><option value="0">Normal</option><option value="5">Alta</option><option value="10">Urgente</option></select></label><label>Data planejada<input type="datetime-local" value={form.dataPlanejada} onChange={(e) => setForm({ ...form, dataPlanejada: e.target.value })} /></label></div>
            <label>Observações<textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows="3" /></label>
            <button className="op-primary" type="submit">Criar ordem de produção</button>
          </form>

          <div className="op-card op-lista">
            <div className="op-toolbar"><h2>Ordens cadastradas</h2><div><FaSearch /><input value={busca} onChange={(e) => setBusca(e.target.value)} onKeyDown={(e) => e.key === "Enter" && carregar()} placeholder="Código, produto ou responsável" /><button onClick={carregar}>Buscar</button></div></div>
            {carregando ? <p>Carregando...</p> : (
              <div className="op-table-wrap"><table><thead><tr><th>Ordem</th><th>Produto</th><th>Quantidade</th><th>Responsável</th><th>Planejada</th><th>Status</th><th>Ações</th></tr></thead><tbody>
                {ordens.map((ordem) => <tr key={ordem._id}><td><strong>{ordem.codigo}</strong><small>Prioridade {ordem.prioridade}</small>{ordem.loteProducao && <small className="op-lote">Lote {ordem.loteProducao}</small>}</td><td>{ordem.produto?.nome || "Produto removido"}</td><td>{ordem.quantidadePlanejada} {ordem.unidade}{ordem.status === "concluida" && <small>Produzido: {ordem.quantidadeProduzida} · Custo un.: R$ {Number(ordem.custoUnitarioProducao || 0).toFixed(2)}</small>}</td><td>{ordem.responsavel || "-"}</td><td>{dataHora(ordem.dataPlanejada)}</td><td><span className={`op-status ${ordem.status}`}>{STATUS[ordem.status]}</span></td><td><div className="op-actions"><button title="Conferir ingredientes" onClick={() => analisarInsumos(ordem)} disabled={analisandoId === ordem._id}><FaBoxes /></button>{ordem.status === "aberta" && <button title="Iniciar" onClick={() => alterarStatus(ordem, "em_producao")}><FaPlay /></button>}{ordem.status === "em_producao" && <button title="Concluir" onClick={() => alterarStatus(ordem, "concluida")}><FaCheck /></button>}{["aberta", "em_producao"].includes(ordem.status) && <button title="Cancelar" onClick={() => alterarStatus(ordem, "cancelada")}><FaBan /></button>}</div></td></tr>)}
                {!ordens.length && <tr><td colSpan="7">Nenhuma ordem encontrada.</td></tr>}
              </tbody></table></div>
            )}
          </div>
        </section>

        {(indicadores.recentes || []).length > 0 && <section className="op-card op-cmv-historico">
          <h2>Histórico gerencial de CMV</h2>
          <div className="op-table-wrap"><table><thead><tr><th>Data</th><th>Ordem</th><th>Produto</th><th>Produzido</th><th>CMV total</th><th>Custo unitário</th><th>Lucro potencial</th></tr></thead><tbody>
            {(indicadores.recentes || []).map((item) => <tr key={item._id}><td>{dataHora(item.dataProducao)}</td><td>{item.codigoOrdem}</td><td>{item.produto?.nome || "Produto removido"}</td><td>{Number(item.quantidadeProduzida || 0).toFixed(2)}</td><td>R$ {Number(item.custoTotal || 0).toFixed(2)}</td><td>R$ {Number(item.custoUnitario || 0).toFixed(2)}</td><td>R$ {Number(item.lucroBrutoPotencial || 0).toFixed(2)}</td></tr>)}
          </tbody></table></div>
        </section>}

        {analise && <section className="op-card op-insumos">
          <div className="op-insumos-head"><div><h2><FaBoxes /> Análise de ingredientes</h2><p>{analise.ordem.codigo} — {analise.ordem.produto?.nome}</p></div><button onClick={() => setAnalise(null)}>Fechar</button></div>
          <div className={`op-disponibilidade ${analise.podeProduzir ? "ok" : "erro"}`}>{analise.podeProduzir ? "Estoque suficiente: a produção pode ser iniciada." : "Produção bloqueada: existem ingredientes insuficientes."}</div>
          <div className="op-table-wrap"><table><thead><tr><th>Ingrediente</th><th>Necessário</th><th>Estoque</th><th>Reservado</th><th>Disponível</th><th>Falta</th><th>Situação</th></tr></thead><tbody>
            {(analise.itens || []).map((item) => <tr key={String(item.materiaPrima)}><td>{item.nome}</td><td>{Number(item.necessario).toFixed(3)} {item.unidade}</td><td>{Number(item.estoqueAtual).toFixed(3)}</td><td>{Number(item.reservadoOutrasOrdens).toFixed(3)}</td><td>{Number(item.disponivel).toFixed(3)}</td><td>{Number(item.falta).toFixed(3)}</td><td><span className={`op-insumo-status ${item.suficiente ? "ok" : "erro"}`}>{item.suficiente ? "Suficiente" : "Insuficiente"}</span></td></tr>)}
          </tbody></table></div>
        </section>}
      </div>
    </AdminLayout>
  );
}

export default OrdensProducao;
