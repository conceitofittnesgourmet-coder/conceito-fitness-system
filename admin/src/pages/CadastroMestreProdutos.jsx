import { useEffect, useMemo, useState } from "react";
import { FaBoxes, FaCheckCircle, FaExclamationTriangle, FaSearch, FaEdit } from "react-icons/fa";
import toast from "react-hot-toast";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import "../styles/cadastro-mestre-produtos.css";

const vazio = {
  marca: "", fabricante: "", referenciaInterna: "",
  comercial: { precoPromocional: "", vendaMinima: 1, permiteDesconto: true },
  producao: { controlaProducao: false, rendimentoPadrao: 1, unidadeRendimento: "UN", pesoFinalGramas: "", perdaPercentual: "" },
  estoque: { controlaEstoque: true, estoqueMaximo: "", localizacao: "" },
  cardapio: { nomePublico: "", descricaoCurta: "", ordemExibicao: 0 },
  marketplaces: { ifoodCodigo: "", aiqfomeCodigo: "" },
};

function CadastroMestreProdutos() {
  const [dados, setDados] = useState({ resumo: {}, produtos: [] });
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(vazio);

  async function carregar() {
    setLoading(true);
    try {
      const { data } = await api.get("/produtos/mestre/cadastro", { params: { search: busca, status } });
      setDados(data);
    } catch (e) { toast.error(e.response?.data?.message || "Erro ao carregar cadastro mestre"); }
    finally { setLoading(false); }
  }
  useEffect(() => { const t = setTimeout(carregar, 250); return () => clearTimeout(t); }, [busca, status]);

  const cards = useMemo(() => [
    ["Total", dados.resumo?.total || 0], ["Completos", dados.resumo?.completo || 0],
    ["Atenção", dados.resumo?.atencao || 0], ["Incompletos", dados.resumo?.incompleto || 0],
    ["Qualidade média", `${dados.resumo?.percentualMedio || 0}%`],
  ], [dados]);

  function abrir(produto) {
    setEditando(produto);
    setForm({ ...vazio, ...(produto.cadastroMestre || {}),
      comercial: { ...vazio.comercial, ...(produto.cadastroMestre?.comercial || {}) },
      producao: { ...vazio.producao, ...(produto.cadastroMestre?.producao || {}) },
      estoque: { ...vazio.estoque, ...(produto.cadastroMestre?.estoque || {}) },
      cardapio: { ...vazio.cardapio, ...(produto.cadastroMestre?.cardapio || {}) },
      marketplaces: { ...vazio.marketplaces, ...(produto.cadastroMestre?.marketplaces || {}) },
    });
  }
  const setGrupo = (grupo, campo, valor) => setForm((f) => ({ ...f, [grupo]: { ...f[grupo], [campo]: valor } }));

  async function salvar(e) {
    e.preventDefault();
    try {
      await api.patch(`/produtos/${editando._id}/mestre`, { cadastroMestre: form });
      toast.success("Cadastro mestre atualizado"); setEditando(null); carregar();
    } catch (err) { toast.error(err.response?.data?.message || "Erro ao salvar"); }
  }

  return <AdminLayout title="Cadastro Mestre de Produtos" subtitle="Base única para comercial, produção, estoque, cardápio e marketplaces">
    <div className="mestre-page">
      <div className="mestre-cards">{cards.map(([l,v]) => <div className="mestre-card" key={l}><span>{l}</span><strong>{v}</strong></div>)}</div>
      <div className="mestre-toolbar"><div className="mestre-search"><FaSearch/><input value={busca} onChange={(e)=>setBusca(e.target.value)} placeholder="Buscar por nome, SKU ou código de barras"/></div><select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="todos">Todos os status</option><option value="completo">Completo</option><option value="atencao">Atenção</option><option value="incompleto">Incompleto</option></select></div>
      <div className="mestre-table-wrap"><table className="mestre-table"><thead><tr><th>Produto</th><th>SKU</th><th>Preço</th><th>Custo</th><th>Estoque</th><th>Qualidade</th><th>Pendências</th><th></th></tr></thead><tbody>
      {loading ? <tr><td colSpan="8">Carregando...</td></tr> : dados.produtos?.map((p)=><tr key={p._id}><td><strong>{p.nome}</strong><small>{p.categoria}</small></td><td>{p.sku || "—"}</td><td>R$ {Number(p.preco||0).toFixed(2)}</td><td>R$ {Number(p.custo||0).toFixed(2)}</td><td>{p.estoque ?? 0}</td><td><span className={`mestre-status ${p.diagnosticoCadastro.status}`}>{p.diagnosticoCadastro.status === "completo" ? <FaCheckCircle/> : <FaExclamationTriangle/>}{p.diagnosticoCadastro.percentual}%</span></td><td>{p.diagnosticoCadastro.pendencias.join(", ") || "Nenhuma"}</td><td><button onClick={()=>abrir(p)}><FaEdit/> Editar</button></td></tr>)}</tbody></table></div>
    </div>
    {editando && <div className="mestre-overlay"><form className="mestre-modal" onSubmit={salvar}><header><div><FaBoxes/><h2>{editando.nome}</h2></div><button type="button" onClick={()=>setEditando(null)}>×</button></header>
      <section><h3>Identificação</h3><div className="mestre-grid"><label>Marca<input value={form.marca} onChange={(e)=>setForm({...form,marca:e.target.value})}/></label><label>Fabricante<input value={form.fabricante} onChange={(e)=>setForm({...form,fabricante:e.target.value})}/></label><label>Referência interna<input value={form.referenciaInterna} onChange={(e)=>setForm({...form,referenciaInterna:e.target.value})}/></label></div></section>
      <section><h3>Produção e estoque</h3><div className="mestre-grid"><label>Rendimento<input type="number" step="0.001" value={form.producao.rendimentoPadrao} onChange={(e)=>setGrupo("producao","rendimentoPadrao",e.target.value)}/></label><label>Unidade<input value={form.producao.unidadeRendimento} onChange={(e)=>setGrupo("producao","unidadeRendimento",e.target.value)}/></label><label>Perda (%)<input type="number" value={form.producao.perdaPercentual} onChange={(e)=>setGrupo("producao","perdaPercentual",e.target.value)}/></label><label>Estoque máximo<input type="number" value={form.estoque.estoqueMaximo} onChange={(e)=>setGrupo("estoque","estoqueMaximo",e.target.value)}/></label><label>Localização<input value={form.estoque.localizacao} onChange={(e)=>setGrupo("estoque","localizacao",e.target.value)}/></label></div><div className="mestre-checks"><label><input type="checkbox" checked={form.producao.controlaProducao} onChange={(e)=>setGrupo("producao","controlaProducao",e.target.checked)}/> Controla produção</label><label><input type="checkbox" checked={form.estoque.controlaEstoque} onChange={(e)=>setGrupo("estoque","controlaEstoque",e.target.checked)}/> Controla estoque</label></div></section>
      <section><h3>Cardápio e canais</h3><div className="mestre-grid"><label>Nome público<input value={form.cardapio.nomePublico} onChange={(e)=>setGrupo("cardapio","nomePublico",e.target.value)}/></label><label>Ordem<input type="number" value={form.cardapio.ordemExibicao} onChange={(e)=>setGrupo("cardapio","ordemExibicao",e.target.value)}/></label><label>Código iFood<input value={form.marketplaces.ifoodCodigo} onChange={(e)=>setGrupo("marketplaces","ifoodCodigo",e.target.value)}/></label></div><label>Descrição curta<textarea maxLength="240" value={form.cardapio.descricaoCurta} onChange={(e)=>setGrupo("cardapio","descricaoCurta",e.target.value)}/></label></section>
      <footer><button type="button" onClick={()=>setEditando(null)}>Cancelar</button><button className="primary" type="submit">Salvar cadastro mestre</button></footer>
    </form></div>}
  </AdminLayout>;
}
export default CadastroMestreProdutos;
