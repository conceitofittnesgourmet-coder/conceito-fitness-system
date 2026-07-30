import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import "../styles/orcamentos.css";

const vazio = { cliente: "", telefone: "", email: "", tipoEvento: "Encomenda", dataEvento: "", dataValidade: "", percentualSinal: 50, desconto: 0, taxaEntrega: 0, status: "rascunho", observacoes: "", condicoes: "", itens: [{ nome: "", quantidade: 1, valorUnitario: 0 }] };
const moeda = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Orcamentos() {
  const [lista, setLista] = useState([]);
  const [resumo, setResumo] = useState({});
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState(vazio);
  const [editando, setEditando] = useState(null);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function carregar() {
    const [l, r] = await Promise.all([api.get("/orcamentos", { params: { busca, status } }), api.get("/orcamentos/resumo")]);
    setLista(l.data?.orcamentos || []); setResumo(r.data?.resumo || {});
  }
  useEffect(() => { carregar().catch(console.error); }, [status]);
  const totais = useMemo(() => {
    const subtotal = form.itens.reduce((s, i) => s + Number(i.quantidade || 0) * Number(i.valorUnitario || 0), 0);
    const total = Math.max(0, subtotal - Number(form.desconto || 0) + Number(form.taxaEntrega || 0));
    return { subtotal, total, sinal: total * Number(form.percentualSinal || 0) / 100 };
  }, [form]);

  function abrir(item) {
    setEditando(item?._id || null);
    setForm(item ? { ...item, dataEvento: item.dataEvento?.slice(0,10) || "", dataValidade: item.dataValidade?.slice(0,10) || "" } : vazio);
    setModal(true);
  }
  function item(index, campo, valor) { setForm((f) => ({ ...f, itens: f.itens.map((i,n) => n === index ? { ...i, [campo]: valor } : i) })); }
  function removerItem(index) { setForm((f) => ({ ...f, itens: f.itens.filter((_,n) => n !== index) })); }
  async function salvar(e) {
    e.preventDefault(); setLoading(true);
    try { editando ? await api.put(`/orcamentos/${editando}`, form) : await api.post("/orcamentos", form); setModal(false); await carregar(); }
    catch (err) { alert(err.response?.data?.message || "Não foi possível salvar"); }
    finally { setLoading(false); }
  }
  async function excluir(id) { if (!confirm("Excluir este orçamento?")) return; await api.delete(`/orcamentos/${id}`); carregar(); }
  async function mudarStatus(o, novo) { await api.put(`/orcamentos/${o._id}`, { status: novo }); carregar(); }

  return <AdminLayout title="Orçamentos" subtitle="Encomendas, festas, sinal e aprovação em um só lugar">
    <div className="orc-page">
      <section className="orc-kpis">
        <div><span>Orçamentos</span><strong>{resumo.quantidade || 0}</strong></div>
        <div><span>Valor orçado</span><strong>{moeda(resumo.valorTotal)}</strong></div>
        <div><span>Pendentes</span><strong>{resumo.pendentes || 0}</strong></div>
        <div><span>Aprovados</span><strong>{resumo.aprovados || 0}</strong></div>
      </section>
      <section className="orc-toolbar">
        <div><input placeholder="Buscar cliente, telefone ou número" value={busca} onChange={(e)=>setBusca(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&carregar()} /><button onClick={carregar}>Buscar</button></div>
        <select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="">Todos os status</option>{["rascunho","enviado","aprovado","recusado","expirado","convertido","cancelado"].map(s=><option key={s}>{s}</option>)}</select>
        <button className="primary" onClick={()=>abrir()}><FaPlus/> Novo orçamento</button>
      </section>
      <section className="orc-table-wrap"><table className="orc-table"><thead><tr><th>Número</th><th>Cliente</th><th>Evento</th><th>Total</th><th>Sinal</th><th>Status</th><th>Ações</th></tr></thead><tbody>
        {lista.map(o=><tr key={o._id}><td><strong>{o.numero}</strong><small>{new Date(o.createdAt).toLocaleDateString("pt-BR")}</small></td><td>{o.cliente}<small>{o.telefone}</small></td><td>{o.tipoEvento}<small>{o.dataEvento ? new Date(o.dataEvento).toLocaleDateString("pt-BR") : "Sem data"}</small></td><td>{moeda(o.total)}</td><td>{moeda(o.valorSinal)}</td><td><select className={`status ${o.status}`} value={o.status} onChange={(e)=>mudarStatus(o,e.target.value)}>{["rascunho","enviado","aprovado","recusado","expirado","convertido","cancelado"].map(s=><option key={s}>{s}</option>)}</select></td><td><button onClick={()=>abrir(o)}><FaEdit/></button><button onClick={()=>excluir(o._id)}><FaTrash/></button></td></tr>)}
        {!lista.length && <tr><td colSpan="7" className="empty">Nenhum orçamento encontrado.</td></tr>}
      </tbody></table></section>
    </div>
    {modal && <div className="orc-modal-bg"><form className="orc-modal" onSubmit={salvar}><header><div><h2>{editando ? "Editar orçamento" : "Novo orçamento"}</h2><p>Preencha os dados da encomenda</p></div><button type="button" onClick={()=>setModal(false)}><FaTimes/></button></header>
      <div className="orc-grid"><label>Cliente<input required value={form.cliente} onChange={e=>setForm({...form,cliente:e.target.value})}/></label><label>Telefone<input value={form.telefone} onChange={e=>setForm({...form,telefone:e.target.value})}/></label><label>E-mail<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Tipo de evento<input value={form.tipoEvento} onChange={e=>setForm({...form,tipoEvento:e.target.value})}/></label><label>Data do evento<input type="date" value={form.dataEvento||""} onChange={e=>setForm({...form,dataEvento:e.target.value})}/></label><label>Validade<input type="date" value={form.dataValidade||""} onChange={e=>setForm({...form,dataValidade:e.target.value})}/></label></div>
      <div className="items-head"><h3>Itens</h3><button type="button" onClick={()=>setForm({...form,itens:[...form.itens,{nome:"",quantidade:1,valorUnitario:0}]})}><FaPlus/> Item</button></div>
      {form.itens.map((i,n)=><div className="item-row" key={n}><input required placeholder="Produto ou serviço" value={i.nome} onChange={e=>item(n,"nome",e.target.value)}/><input type="number" min="0.001" step="0.001" value={i.quantidade} onChange={e=>item(n,"quantidade",e.target.value)}/><input type="number" min="0" step="0.01" value={i.valorUnitario} onChange={e=>item(n,"valorUnitario",e.target.value)}/><strong>{moeda(Number(i.quantidade)*Number(i.valorUnitario))}</strong><button type="button" disabled={form.itens.length===1} onClick={()=>removerItem(n)}><FaTrash/></button></div>)}
      <div className="orc-grid financial"><label>Desconto<input type="number" step="0.01" value={form.desconto} onChange={e=>setForm({...form,desconto:e.target.value})}/></label><label>Entrega<input type="number" step="0.01" value={form.taxaEntrega} onChange={e=>setForm({...form,taxaEntrega:e.target.value})}/></label><label>Sinal (%)<input type="number" min="0" max="100" value={form.percentualSinal} onChange={e=>setForm({...form,percentualSinal:e.target.value})}/></label><div className="total-box"><span>Total</span><strong>{moeda(totais.total)}</strong><small>Sinal: {moeda(totais.sinal)}</small></div></div>
      <label>Observações<textarea value={form.observacoes} onChange={e=>setForm({...form,observacoes:e.target.value})}/></label><footer><button type="button" onClick={()=>setModal(false)}>Cancelar</button><button className="primary" disabled={loading}><FaSave/> {loading?"Salvando...":"Salvar orçamento"}</button></footer>
    </form></div>}
  </AdminLayout>;
}
