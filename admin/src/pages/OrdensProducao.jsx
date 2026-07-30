import { useEffect, useMemo, useState } from "react";
import { FaIndustry, FaPlay, FaCheck, FaBan, FaPlus, FaSearch, FaBoxes, FaMagic, FaShoppingBasket } from "react-icons/fa";
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
  const [planejamento, setPlanejamento] = useState(null);
  const [planejando, setPlanejando] = useState(false);
  const [configPlanejamento, setConfigPlanejamento] = useState({ dataPlanejada: new Date().toISOString().slice(0, 10), diasHistorico: 28, diasCobertura: 1 });
  const [selecionados, setSelecionados] = useState({});

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

  async function gerarPlanejamento() {
    setPlanejando(true);
    try {
      const { data } = await api.get("/producao/ordens/planejamento/sugestoes", { params: configPlanejamento });
      const plano = data.planejamento || {};
      setPlanejamento(plano);
      const novosSelecionados = {};
      (plano.sugestoes || []).forEach((item) => {
        if (Number(item.quantidadeSugerida) > 0) novosSelecionados[String(item.produtoId)] = Number(item.quantidadeSugerida);
      });
      setSelecionados(novosSelecionados);
    } catch (error) {
      alert(error.response?.data?.message || "Não foi possível gerar o planejamento.");
    } finally { setPlanejando(false); }
  }

  async function criarOrdensSugeridas() {
    const itens = Object.entries(selecionados)
      .filter(([, quantidade]) => Number(quantidade) > 0)
      .map(([produto, quantidade]) => ({ produto, quantidade: Number(quantidade) }));
    if (!itens.length) return alert("Selecione ao menos uma sugestão com quantidade maior que zero.");
    try {
      const { data } = await api.post("/producao/ordens/planejamento/criar", {
        dataPlanejada: configPlanejamento.dataPlanejada,
        itens,
      });
      alert(data.message || "Ordens criadas com sucesso.");
      setPlanejamento(null);
      setSelecionados({});
      await carregar();
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao criar ordens sugeridas.");
    }
  }

  function dataHora(valor) { return valor ? new Date(valor).toLocaleString("pt-BR") : "-"; }

  return (
    <AdminLayout title="Ordens de Produção" subtitle="Planejamento e acompanhamento da produção">
      <div className="op-page">
        <header className="op-header"><div><h1><FaIndustry /> Ordens de Produção</h1><p>Organize o que será produzido, por quem e em qual prazo.</p></div></header>

        <section className="op-card op-planejamento">
          <div className="op-planejamento-head">
            <div><h2><FaMagic /> Planejamento Inteligente</h2><p>Use o histórico de vendas e o estoque atual para sugerir a produção do dia.</p></div>
            <div className="op-planejamento-config">
              <label>Data<input type="date" value={configPlanejamento.dataPlanejada} onChange={(e) => setConfigPlanejamento({ ...configPlanejamento, dataPlanejada: e.target.value })} /></label>
              <label>Histórico<select value={configPlanejamento.diasHistorico} onChange={(e) => setConfigPlanejamento({ ...configPlanejamento, diasHistorico: Number(e.target.value) })}><option value="14">14 dias</option><option value="28">28 dias</option><option value="60">60 dias</option><option value="90">90 dias</option></select></label>
              <label>Cobertura<select value={configPlanejamento.diasCobertura} onChange={(e) => setConfigPlanejamento({ ...configPlanejamento, diasCobertura: Number(e.target.value) })}><option value="1">1 dia</option><option value="2">2 dias</option><option value="3">3 dias</option><option value="7">7 dias</option></select></label>
              <button className="op-primary" type="button" onClick={gerarPlanejamento} disabled={planejando}>{planejando ? "Analisando..." : "Gerar sugestão"}</button>
            </div>
          </div>

          {planejamento && <div className="op-planejamento-resultado">
            <div className="op-planejamento-resumo">
              <span><strong>{planejamento.totalProdutosSugeridos || 0}</strong> produtos sugeridos</span>
              <span className={planejamento.podeProduzirTudo ? "ok" : "erro"}>{planejamento.podeProduzirTudo ? "Ingredientes suficientes" : "Há itens para comprar"}</span>
              <button type="button" className="op-primary" onClick={criarOrdensSugeridas}>Criar ordens selecionadas</button>
            </div>
            <div className="op-table-wrap"><table><thead><tr><th>Produzir</th><th>Produto</th><th>Vendido</th><th>Média/dia</th><th>Estoque</th><th>Já planejado</th><th>Sugestão</th><th>Confiança</th></tr></thead><tbody>
              {(planejamento.sugestoes || []).map((item) => <tr key={String(item.produtoId)}><td><input type="checkbox" checked={Number(selecionados[String(item.produtoId)] || 0) > 0} onChange={(e) => setSelecionados({ ...selecionados, [String(item.produtoId)]: e.target.checked ? Math.max(Number(item.quantidadeSugerida || 1), 1) : 0 })} /></td><td><strong>{item.nome}</strong><small>{item.motivo}</small></td><td>{Number(item.vendidoNoPeriodo || 0).toFixed(2)}</td><td>{Number(item.mediaDiaria || 0).toFixed(2)}</td><td>{Number(item.estoqueAtual || 0).toFixed(2)}</td><td>{Number(item.jaPlanejado || 0).toFixed(2)}</td><td><input className="op-qtd-sugerida" type="number" min="0" step="1" value={selecionados[String(item.produtoId)] ?? 0} onChange={(e) => setSelecionados({ ...selecionados, [String(item.produtoId)]: Number(e.target.value) })} /></td><td>{item.confianca || 0}%</td></tr>)}
              {!(planejamento.sugestoes || []).length && <tr><td colSpan="8">Ainda não há vendas históricas suficientes para gerar sugestões.</td></tr>}
            </tbody></table></div>

            {(planejamento.necessidades || []).some((item) => !item.suficiente) && <div className="op-compras"><h3><FaShoppingBasket /> Necessidade de compras</h3><div className="op-table-wrap"><table><thead><tr><th>Ingrediente</th><th>Necessário</th><th>Estoque</th><th>Comprar</th></tr></thead><tbody>{planejamento.necessidades.filter((item) => !item.suficiente).map((item) => <tr key={String(item.materiaPrima)}><td>{item.nome}</td><td>{Number(item.necessario || 0).toFixed(3)} {item.unidade}</td><td>{Number(item.estoqueAtual || 0).toFixed(3)} {item.unidade}</td><td><strong>{Number(item.falta || 0).toFixed(3)} {item.unidade}</strong></td></tr>)}</tbody></table></div></div>}
          </div>}
        </section>

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
