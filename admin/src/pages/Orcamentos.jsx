import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaMagic, FaCheckCircle, FaExclamationTriangle, FaWhatsapp, FaPrint } from "react-icons/fa";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import "../styles/orcamentos.css";

const criarVazio = () => ({ cliente: "", telefone: "", email: "", tipoEvento: "Encomenda", dataEvento: "", dataValidade: "", percentualSinal: 50, desconto: 0, taxaEntrega: 0, status: "rascunho", observacoes: "", condicoes: "", itens: [{ produtoId: "", nome: "", quantidade: 1, valorUnitario: 0 }] });
const moeda = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (v) => v ? new Date(v).toLocaleDateString("pt-BR") : "Sem data";
const statusDisponiveis = ["rascunho", "enviado", "aprovado", "recusado", "expirado", "convertido", "cancelado"];

export default function Orcamentos() {
  const [lista, setLista] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [resumo, setResumo] = useState({});
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState(criarVazio());
  const [editando, setEditando] = useState(null);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assistente, setAssistente] = useState(null);
  const [analise, setAnalise] = useState(null);
  const [convertendo, setConvertendo] = useState(false);
  const [dadosConversao, setDadosConversao] = useState({ formaPagamento: "PIX", vencimentoSinal: "", vencimentoSaldo: "" });

  async function carregar() {
    const [l, r] = await Promise.all([
      api.get("/orcamentos", { params: { busca, status } }),
      api.get("/orcamentos/resumo"),
    ]);
    setLista(l.data?.orcamentos || []);
    setResumo(r.data?.resumo || {});
  }

  async function carregarProdutos() {
    try {
      const resposta = await api.get("/produtos");
      setProdutos(resposta.data?.produtos || resposta.data || []);
    } catch (error) {
      console.error("Não foi possível carregar produtos:", error);
    }
  }

  useEffect(() => { carregar().catch(console.error); }, [status]);
  useEffect(() => { carregarProdutos(); }, []);

  const totais = useMemo(() => {
    const subtotal = form.itens.reduce((s, i) => s + Number(i.quantidade || 0) * Number(i.valorUnitario || 0), 0);
    const total = Math.max(0, subtotal - Number(form.desconto || 0) + Number(form.taxaEntrega || 0));
    return { subtotal, total, sinal: total * Number(form.percentualSinal || 0) / 100 };
  }, [form]);

  function abrir(item) {
    setEditando(item?._id || null);
    setForm(item ? { ...item, dataEvento: item.dataEvento?.slice(0, 10) || "", dataValidade: item.dataValidade?.slice(0, 10) || "" } : criarVazio());
    setModal(true);
  }

  function atualizarItem(index, campo, valor) {
    setForm((f) => ({ ...f, itens: f.itens.map((i, n) => n === index ? { ...i, [campo]: valor } : i) }));
  }

  function selecionarProduto(index, produtoId) {
    const produto = produtos.find((p) => p._id === produtoId);
    setForm((f) => ({
      ...f,
      itens: f.itens.map((i, n) => n === index ? {
        ...i,
        produtoId,
        nome: produto?.nome || i.nome,
        valorUnitario: Number(produto?.preco || i.valorUnitario || 0),
      } : i),
    }));
  }

  function removerItem(index) {
    setForm((f) => ({ ...f, itens: f.itens.filter((_, n) => n !== index) }));
  }

  async function salvar(e) {
    e.preventDefault();
    setLoading(true);
    try {
      editando ? await api.put(`/orcamentos/${editando}`, form) : await api.post("/orcamentos", form);
      setModal(false);
      await carregar();
    } catch (err) {
      alert(err.response?.data?.message || "Não foi possível salvar");
    } finally {
      setLoading(false);
    }
  }

  async function excluir(id) {
    if (!confirm("Excluir este orçamento?")) return;
    try { await api.delete(`/orcamentos/${id}`); await carregar(); }
    catch (err) { alert(err.response?.data?.message || "Não foi possível excluir"); }
  }

  async function mudarStatus(o, novo) {
    try { await api.put(`/orcamentos/${o._id}`, { status: novo }); await carregar(); }
    catch (err) { alert(err.response?.data?.message || "Não foi possível alterar o status"); }
  }

  async function abrirAssistente(o) {
    setAssistente(o);
    setAnalise(null);
    setDadosConversao({ formaPagamento: "PIX", vencimentoSinal: new Date().toISOString().slice(0, 10), vencimentoSaldo: o.dataEvento?.slice(0, 10) || "" });
    try {
      const resposta = await api.get(`/orcamentos/${o._id}/conversao`);
      setAnalise(resposta.data?.validacao || null);
    } catch (err) {
      setAnalise(err.response?.data?.validacao || { podeConverter: false, pontuacao: 0, classificacao: "Falha na análise", pendencias: [err.response?.data?.message || "Não foi possível analisar o orçamento."], avisos: [] });
    }
  }

  async function converterAgora() {
    if (!assistente || !analise?.podeConverter) return;
    if (!confirm(`Converter ${assistente.numero} em pedido, produção e financeiro?`)) return;
    setConvertendo(true);
    try {
      const resposta = await api.post(`/orcamentos/${assistente._id}/converter`, dadosConversao);
      const pedido = resposta.data?.pedido;
      alert(`Conversão concluída! Pedido #${pedido?.numeroPedido || "criado"}.`);
      setAssistente(null);
      setAnalise(null);
      await carregar();
    } catch (err) {
      alert(err.response?.data?.message || "Não foi possível concluir a conversão.");
      if (err.response?.data?.validacao) setAnalise(err.response.data.validacao);
    } finally {
      setConvertendo(false);
    }
  }

  function imprimir(o) {
    const janela = window.open("", "_blank", "width=900,height=700");
    if (!janela) return alert("Permita pop-ups para imprimir o orçamento.");
    const itens = (o.itens || []).map(i => `<tr><td>${i.nome}</td><td>${i.quantidade}</td><td>${moeda(i.valorUnitario)}</td><td>${moeda(i.subtotal)}</td></tr>`).join("");
    janela.document.write(`<html><head><title>${o.numero}</title><style>body{font-family:Arial;padding:36px;color:#302720}h1{color:#3e5d45}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{border-bottom:1px solid #ddd;padding:10px;text-align:left}.total{font-size:22px;text-align:right}.brand{color:#a15f75;font-weight:bold}</style></head><body><div class="brand">CONCEITO FITNESS GOURMET</div><h1>Orçamento ${o.numero}</h1><p><b>Cliente:</b> ${o.cliente}<br/><b>Telefone:</b> ${o.telefone || "-"}<br/><b>Evento:</b> ${o.tipoEvento} — ${dataBR(o.dataEvento)}</p><table><thead><tr><th>Item</th><th>Qtd.</th><th>Unitário</th><th>Subtotal</th></tr></thead><tbody>${itens}</tbody></table><p class="total"><b>Total: ${moeda(o.total)}</b><br/><small>Sinal: ${moeda(o.valorSinal)}</small></p><p>${o.observacoes || ""}</p><script>window.print()</script></body></html>`);
    janela.document.close();
  }

  function whatsapp(o) {
    const numero = String(o.telefone || "").replace(/\D/g, "");
    const texto = `Olá, ${o.cliente}! Segue o resumo do orçamento ${o.numero} da Conceito Fitness Gourmet. Total: ${moeda(o.total)}. Sinal: ${moeda(o.valorSinal)}. Validade: ${dataBR(o.dataValidade)}.`;
    window.open(`https://wa.me/${numero ? `55${numero.replace(/^55/, "")}` : ""}?text=${encodeURIComponent(texto)}`, "_blank");
  }

  return <AdminLayout title="Orçamentos" subtitle="Encomendas, aprovação e conversão inteligente em um só lugar">
    <div className="orc-page">
      <section className="orc-kpis">
        <div><span>Orçamentos</span><strong>{resumo.quantidade || 0}</strong></div>
        <div><span>Valor orçado</span><strong>{moeda(resumo.valorTotal)}</strong></div>
        <div><span>Pendentes</span><strong>{resumo.pendentes || 0}</strong></div>
        <div><span>Aprovados</span><strong>{resumo.aprovados || 0}</strong></div>
      </section>

      <section className="orc-toolbar">
        <div><input placeholder="Buscar cliente, telefone ou número" value={busca} onChange={(e) => setBusca(e.target.value)} onKeyDown={(e) => e.key === "Enter" && carregar()} /><button onClick={carregar}>Buscar</button></div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Todos os status</option>{statusDisponiveis.map(s => <option key={s}>{s}</option>)}</select>
        <button className="primary" onClick={() => abrir()}><FaPlus /> Novo orçamento</button>
      </section>

      <section className="orc-table-wrap"><table className="orc-table"><thead><tr><th>Número</th><th>Cliente</th><th>Evento</th><th>Total</th><th>Sinal</th><th>Status</th><th>Ações</th></tr></thead><tbody>
        {lista.map(o => <tr key={o._id}>
          <td><strong>{o.numero}</strong><small>{dataBR(o.createdAt)}</small></td>
          <td>{o.cliente}<small>{o.telefone}</small></td>
          <td>{o.tipoEvento}<small>{dataBR(o.dataEvento)}</small></td>
          <td>{moeda(o.total)}</td><td>{moeda(o.valorSinal)}</td>
          <td><select className={`status ${o.status}`} value={o.status} disabled={o.status === "convertido"} onChange={(e) => mudarStatus(o, e.target.value)}>{statusDisponiveis.map(s => <option key={s}>{s}</option>)}</select></td>
          <td className="orc-actions">
            <button title="Editar" onClick={() => abrir(o)}><FaEdit /></button>
            <button title="Imprimir" onClick={() => imprimir(o)}><FaPrint /></button>
            <button title="WhatsApp" onClick={() => whatsapp(o)}><FaWhatsapp /></button>
            {o.status === "aprovado" && !o.pedidoId && <button className="magic" title="Converter" onClick={() => abrirAssistente(o)}><FaMagic /></button>}
            <button title="Excluir" onClick={() => excluir(o._id)}><FaTrash /></button>
          </td>
        </tr>)}
        {!lista.length && <tr><td colSpan="7" className="empty">Nenhum orçamento encontrado.</td></tr>}
      </tbody></table></section>
    </div>

    {modal && <div className="orc-modal-bg"><form className="orc-modal" onSubmit={salvar}><header><div><h2>{editando ? "Editar orçamento" : "Novo orçamento"}</h2><p>Vincule os itens aos produtos para habilitar a conversão inteligente.</p></div><button type="button" onClick={() => setModal(false)}><FaTimes /></button></header>
      <div className="orc-grid"><label>Cliente<input required value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} /></label><label>Telefone<input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></label><label>E-mail<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label><label>Tipo de evento<input value={form.tipoEvento} onChange={e => setForm({ ...form, tipoEvento: e.target.value })} /></label><label>Data do evento<input type="date" value={form.dataEvento || ""} onChange={e => setForm({ ...form, dataEvento: e.target.value })} /></label><label>Validade<input type="date" value={form.dataValidade || ""} onChange={e => setForm({ ...form, dataValidade: e.target.value })} /></label></div>
      <div className="items-head"><h3>Itens</h3><button type="button" onClick={() => setForm({ ...form, itens: [...form.itens, { produtoId: "", nome: "", quantidade: 1, valorUnitario: 0 }] })}><FaPlus /> Item</button></div>
      {form.itens.map((i, n) => <div className="item-row item-row-v041" key={i._id || n}>
        <select value={i.produtoId || ""} onChange={e => selecionarProduto(n, e.target.value)}><option value="">Produto cadastrado</option>{produtos.map(p => <option key={p._id} value={p._id}>{p.nome}</option>)}</select>
        <input required placeholder="Produto ou serviço" value={i.nome} onChange={e => atualizarItem(n, "nome", e.target.value)} />
        <input type="number" min="0.001" step="0.001" value={i.quantidade} onChange={e => atualizarItem(n, "quantidade", e.target.value)} />
        <input type="number" min="0" step="0.01" value={i.valorUnitario} onChange={e => atualizarItem(n, "valorUnitario", e.target.value)} />
        <strong>{moeda(Number(i.quantidade) * Number(i.valorUnitario))}</strong>
        <button type="button" disabled={form.itens.length === 1} onClick={() => removerItem(n)}><FaTrash /></button>
      </div>)}
      <div className="orc-grid financial"><label>Desconto<input type="number" step="0.01" value={form.desconto} onChange={e => setForm({ ...form, desconto: e.target.value })} /></label><label>Entrega<input type="number" step="0.01" value={form.taxaEntrega} onChange={e => setForm({ ...form, taxaEntrega: e.target.value })} /></label><label>Sinal (%)<input type="number" min="0" max="100" value={form.percentualSinal} onChange={e => setForm({ ...form, percentualSinal: e.target.value })} /></label><div className="total-box"><span>Total</span><strong>{moeda(totais.total)}</strong><small>Sinal: {moeda(totais.sinal)}</small></div></div>
      <label>Observações<textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></label><footer><button type="button" onClick={() => setModal(false)}>Cancelar</button><button className="primary" disabled={loading}><FaSave /> {loading ? "Salvando..." : "Salvar orçamento"}</button></footer>
    </form></div>}

    {assistente && <div className="orc-modal-bg"><div className="orc-modal conversao-modal"><header><div><h2><FaMagic /> Assistente de Conversão</h2><p>{assistente.numero} — {assistente.cliente}</p></div><button onClick={() => setAssistente(null)}><FaTimes /></button></header>
      {!analise ? <div className="conversion-loading">Analisando cliente, produtos, produção e financeiro...</div> : <>
        <div className="confidence"><div><span>Índice de confiança</span><strong>{analise.pontuacao}%</strong><small>{analise.classificacao}</small></div><div className="confidence-bar"><i style={{ width: `${analise.pontuacao}%` }} /></div></div>
        <div className="validation-columns">
          <section><h3><FaCheckCircle /> Validações</h3>{analise.pendencias.length === 0 && <p className="ok">Nenhuma pendência obrigatória.</p>}{analise.pendencias.map((p, i) => <p className="blocked" key={i}><FaTimes /> {p}</p>)}</section>
          <section><h3><FaExclamationTriangle /> Avisos</h3>{analise.avisos.length === 0 && <p className="ok">Nenhum aviso encontrado.</p>}{analise.avisos.map((a, i) => <p className="warning" key={i}>{a}</p>)}</section>
        </div>
        <div className="conversion-financial"><div><span>Total</span><strong>{moeda(analise.financeiro.total)}</strong></div><div><span>Sinal</span><strong>{moeda(analise.financeiro.sinal)}</strong></div><div><span>Saldo</span><strong>{moeda(analise.financeiro.saldo)}</strong></div><div><span>Lucro estimado</span><strong>{moeda(analise.financeiro.lucroEstimado)}</strong><small>{analise.financeiro.margem}% de margem</small></div></div>
        <div className="orc-grid"><label>Forma de pagamento<select value={dadosConversao.formaPagamento} onChange={e => setDadosConversao({ ...dadosConversao, formaPagamento: e.target.value })}><option>PIX</option><option>DINHEIRO</option><option>CRÉDITO</option><option>DÉBITO</option></select></label><label>Vencimento do sinal<input type="date" value={dadosConversao.vencimentoSinal} onChange={e => setDadosConversao({ ...dadosConversao, vencimentoSinal: e.target.value })} /></label><label>Vencimento do saldo<input type="date" value={dadosConversao.vencimentoSaldo} onChange={e => setDadosConversao({ ...dadosConversao, vencimentoSaldo: e.target.value })} /></label></div>
        <div className="conversion-result"><b>A conversão criará:</b> pedido, ordens de produção dos itens controlados e contas a receber de sinal e saldo.</div>
        <footer><button onClick={() => setAssistente(null)}>Cancelar</button><button className="primary conversion-button" disabled={!analise.podeConverter || convertendo} onClick={converterAgora}><FaMagic /> {convertendo ? "Convertendo..." : "Converter agora"}</button></footer>
      </>}
    </div></div>}
  </AdminLayout>;
}
