import { useEffect, useMemo, useState } from "react";
import { FaBoxes, FaEdit, FaExchangeAlt, FaPlus, FaSearch, FaTimes, FaWarehouse } from "react-icons/fa";
import toast from "react-hot-toast";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import "../styles/ingredientes.css";

const formularioVazio = {
  nome: "", codigo: "", codigoBarras: "", categoria: "Insumos", unidade: "unidade",
  estoqueAtual: 0, estoqueMinimo: 0, estoqueMaximo: 0, custoUnitario: 0,
  fornecedor: "", localizacao: "", marca: "", observacoes: "",
  controlaLote: false, controlaValidade: false, diasAlertaValidade: 7, ativo: true,
};
const movimentoVazio = { tipo: "entrada", quantidade: "", custoUnitario: "", motivo: "", documento: "", lote: "", validade: "", fornecedor: "" };
const dinheiro = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Ingredientes() {
  const [dados, setDados] = useState({ materias: [], categorias: [], resumo: {} });
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [status, setStatus] = useState("todos");
  const [ativo, setAtivo] = useState("todos");
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null);
  const [movimentando, setMovimentando] = useState(null);
  const [form, setForm] = useState(formularioVazio);
  const [movimento, setMovimento] = useState(movimentoVazio);

  async function carregar() {
    setLoading(true);
    try {
      const { data } = await api.get("/materias-primas", { params: { search: busca, categoria, status, ativo } });
      setDados(data);
    } catch (error) { toast.error(error.response?.data?.message || "Erro ao carregar ingredientes"); }
    finally { setLoading(false); }
  }
  useEffect(() => { const timer = setTimeout(carregar, 250); return () => clearTimeout(timer); }, [busca, categoria, status, ativo]);

  const cards = useMemo(() => [
    ["Ingredientes", dados.resumo?.total || 0], ["Ativos", dados.resumo?.ativos || 0],
    ["Abaixo do mínimo", dados.resumo?.abaixoMinimo || 0], ["Sem custo", dados.resumo?.semCusto || 0],
    ["Estoque valorizado", dinheiro(dados.resumo?.valorEstoque)], ["Lotes vencidos", dados.resumo?.vencidos || 0],
  ], [dados]);

  function novo() { setEditando({ novo: true }); setForm(formularioVazio); }
  function editar(item) { setEditando(item); setForm({ ...formularioVazio, ...item }); }
  function abrirMovimento(item) { setMovimentando(item); setMovimento({ ...movimentoVazio, custoUnitario: item.custoUnitario || "", fornecedor: item.fornecedor || "" }); }

  async function salvar(evento) {
    evento.preventDefault();
    try {
      if (editando?.novo) await api.post("/materias-primas", form);
      else await api.put(`/materias-primas/${editando._id}`, form);
      toast.success(editando?.novo ? "Ingrediente cadastrado" : "Ingrediente atualizado");
      setEditando(null); carregar();
    } catch (error) { toast.error(error.response?.data?.message || "Erro ao salvar ingrediente"); }
  }

  async function registrarMovimento(evento) {
    evento.preventDefault();
    try {
      await api.post(`/materias-primas/${movimentando._id}/movimentacoes`, movimento);
      toast.success("Movimentação registrada"); setMovimentando(null); carregar();
    } catch (error) { toast.error(error.response?.data?.message || "Erro ao movimentar estoque"); }
  }

  return <AdminLayout title="Banco de Ingredientes" subtitle="Custos, estoque, lotes, validade e fornecedores em uma única base">
    <div className="ingredientes-page">
      <div className="ingredientes-cards">{cards.map(([label, valor]) => <div className="ingrediente-card" key={label}><span>{label}</span><strong>{valor}</strong></div>)}</div>
      <div className="ingredientes-toolbar">
        <div className="ingredientes-search"><FaSearch/><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nome, código, código de barras ou fornecedor"/></div>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}><option value="todas">Todas as categorias</option>{dados.categorias?.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="todos">Todo cadastro</option><option value="completo">Completo</option><option value="atencao">Atenção</option><option value="incompleto">Incompleto</option></select>
        <select value={ativo} onChange={(e) => setAtivo(e.target.value)}><option value="todos">Ativos e inativos</option><option value="ativo">Ativos</option><option value="inativo">Inativos</option></select>
        <button className="ingredientes-primary" onClick={novo}><FaPlus/> Novo ingrediente</button>
      </div>
      <div className="ingredientes-table-wrap"><table className="ingredientes-table"><thead><tr><th>Ingrediente</th><th>Categoria</th><th>Estoque</th><th>Custo médio</th><th>Valor em estoque</th><th>Fornecedor</th><th>Cadastro</th><th>Ações</th></tr></thead><tbody>
        {loading ? <tr><td colSpan="8">Carregando...</td></tr> : dados.materias?.length === 0 ? <tr><td colSpan="8">Nenhum ingrediente encontrado.</td></tr> : dados.materias.map((item) => <tr key={item._id} className={item.abaixoMinimo ? "estoque-alerta" : ""}>
          <td><strong>{item.nome}</strong><small>{item.codigo || "Sem código"}{item.localizacao ? ` · ${item.localizacao}` : ""}</small></td><td>{item.categoria}</td>
          <td><span className={item.abaixoMinimo ? "badge danger" : "badge ok"}>{Number(item.estoqueAtual || 0)} {item.unidade}</span><small>Mín.: {Number(item.estoqueMinimo || 0)}</small></td>
          <td>{dinheiro(item.custoUnitario)}</td><td>{dinheiro(item.valorEstoque)}</td><td>{item.fornecedor || "—"}</td>
          <td><span className={`cadastro-status ${item.diagnostico?.status}`}>{item.diagnostico?.percentual || 0}%</span><small>{item.diagnostico?.pendencias?.join(", ") || "Completo"}</small></td>
          <td><div className="acoes"><button title="Movimentar" onClick={() => abrirMovimento(item)}><FaExchangeAlt/></button><button title="Editar" onClick={() => editar(item)}><FaEdit/></button></div></td>
        </tr>)}</tbody></table></div>
    </div>

    {editando && <div className="ingredientes-overlay"><form className="ingredientes-modal" onSubmit={salvar}><header><div><FaBoxes/><h2>{editando.novo ? "Novo ingrediente" : editando.nome}</h2></div><button type="button" onClick={() => setEditando(null)}><FaTimes/></button></header>
      <section><h3>Identificação</h3><div className="ingredientes-grid"><label>Nome*<input required value={form.nome} onChange={(e)=>setForm({...form,nome:e.target.value})}/></label><label>Código interno<input value={form.codigo} onChange={(e)=>setForm({...form,codigo:e.target.value})}/></label><label>Código de barras<input value={form.codigoBarras} onChange={(e)=>setForm({...form,codigoBarras:e.target.value})}/></label><label>Categoria<input value={form.categoria} onChange={(e)=>setForm({...form,categoria:e.target.value})}/></label><label>Marca<input value={form.marca} onChange={(e)=>setForm({...form,marca:e.target.value})}/></label><label>Unidade<select value={form.unidade} onChange={(e)=>setForm({...form,unidade:e.target.value})}>{["kg","g","litro","ml","unidade","pacote","caixa"].map(u=><option key={u}>{u}</option>)}</select></label></div></section>
      <section><h3>Estoque e custo</h3><div className="ingredientes-grid">{editando.novo && <label>Estoque inicial<input type="number" step="0.001" min="0" value={form.estoqueAtual} onChange={(e)=>setForm({...form,estoqueAtual:e.target.value})}/></label>}<label>Estoque mínimo<input type="number" step="0.001" min="0" value={form.estoqueMinimo} onChange={(e)=>setForm({...form,estoqueMinimo:e.target.value})}/></label><label>Estoque máximo<input type="number" step="0.001" min="0" value={form.estoqueMaximo} onChange={(e)=>setForm({...form,estoqueMaximo:e.target.value})}/></label><label>Custo unitário<input type="number" step="0.0001" min="0" value={form.custoUnitario} onChange={(e)=>setForm({...form,custoUnitario:e.target.value})}/></label><label>Fornecedor principal<input value={form.fornecedor} onChange={(e)=>setForm({...form,fornecedor:e.target.value})}/></label><label>Localização<input value={form.localizacao} onChange={(e)=>setForm({...form,localizacao:e.target.value})}/></label></div></section>
      <section><h3>Rastreabilidade</h3><div className="ingredientes-checks"><label><input type="checkbox" checked={form.controlaLote} onChange={(e)=>setForm({...form,controlaLote:e.target.checked})}/> Controlar lote</label><label><input type="checkbox" checked={form.controlaValidade} onChange={(e)=>setForm({...form,controlaValidade:e.target.checked})}/> Controlar validade</label><label><input type="checkbox" checked={form.ativo} onChange={(e)=>setForm({...form,ativo:e.target.checked})}/> Ingrediente ativo</label></div><div className="ingredientes-grid"><label>Dias para alerta de validade<input type="number" min="0" value={form.diasAlertaValidade} onChange={(e)=>setForm({...form,diasAlertaValidade:e.target.value})}/></label></div><label>Observações<textarea value={form.observacoes} onChange={(e)=>setForm({...form,observacoes:e.target.value})}/></label></section>
      <footer><button type="button" onClick={()=>setEditando(null)}>Cancelar</button><button className="ingredientes-primary" type="submit">Salvar ingrediente</button></footer>
    </form></div>}

    {movimentando && <div className="ingredientes-overlay"><form className="ingredientes-modal movimento-modal" onSubmit={registrarMovimento}><header><div><FaWarehouse/><h2>Movimentar: {movimentando.nome}</h2></div><button type="button" onClick={()=>setMovimentando(null)}><FaTimes/></button></header>
      <section><div className="saldo-atual">Saldo atual <strong>{Number(movimentando.estoqueAtual || 0)} {movimentando.unidade}</strong></div><div className="ingredientes-grid"><label>Tipo<select value={movimento.tipo} onChange={(e)=>setMovimento({...movimento,tipo:e.target.value})}><option value="entrada">Entrada</option><option value="saida">Saída</option><option value="ajuste">Ajuste de saldo</option></select></label><label>{movimento.tipo === "ajuste" ? "Novo saldo" : "Quantidade"}<input required type="number" step="0.001" min="0" value={movimento.quantidade} onChange={(e)=>setMovimento({...movimento,quantidade:e.target.value})}/></label>{movimento.tipo === "entrada" && <label>Custo da entrada<input type="number" step="0.0001" min="0" value={movimento.custoUnitario} onChange={(e)=>setMovimento({...movimento,custoUnitario:e.target.value})}/></label>}<label>Motivo<input value={movimento.motivo} onChange={(e)=>setMovimento({...movimento,motivo:e.target.value})}/></label><label>Documento<input value={movimento.documento} onChange={(e)=>setMovimento({...movimento,documento:e.target.value})}/></label><label>Fornecedor<input value={movimento.fornecedor} onChange={(e)=>setMovimento({...movimento,fornecedor:e.target.value})}/></label>{movimento.tipo === "entrada" && <><label>Lote<input value={movimento.lote} onChange={(e)=>setMovimento({...movimento,lote:e.target.value})}/></label><label>Validade<input type="date" value={movimento.validade} onChange={(e)=>setMovimento({...movimento,validade:e.target.value})}/></label></>}</div></section>
      <footer><button type="button" onClick={()=>setMovimentando(null)}>Cancelar</button><button className="ingredientes-primary" type="submit">Registrar movimentação</button></footer>
    </form></div>}
  </AdminLayout>;
}
