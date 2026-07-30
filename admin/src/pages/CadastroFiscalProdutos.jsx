import { useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileInvoiceDollar,
  FaSearch,
  FaSyncAlt,
  FaTimesCircle,
} from "react-icons/fa";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import "../styles/cadastro-fiscal-produtos.css";

const ESTADO_INICIAL = {
  ncm: "",
  cest: "",
  cfopInterno: "",
  cfopInterestadual: "",
  csosn: "",
  cstIcms: "",
  origemMercadoria: "",
  unidadeComercial: "",
  unidadeTributavel: "",
};

const somenteNumeros = (valor, limite) =>
  String(valor || "").replace(/\D/g, "").slice(0, limite);

function StatusFiscal({ status, pendencias = [] }) {
  if (status === "completo") {
    return <span className="fiscal-status completo"><FaCheckCircle /> Completo</span>;
  }
  if (status === "atencao") {
    return <span className="fiscal-status atencao"><FaExclamationTriangle /> Atenção</span>;
  }
  return <span className="fiscal-status incompleto"><FaTimesCircle /> Incompleto{pendencias.length ? ` (${pendencias.length})` : ""}</span>;
}

export default function CadastroFiscalProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [resumo, setResumo] = useState({ total: 0, completo: 0, atencao: 0, incompleto: 0, semNcm: 0, semCfop: 0, semTributacao: 0 });
  const [selecionados, setSelecionados] = useState([]);
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [ativo, setAtivo] = useState("todos");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  async function carregar() {
    setCarregando(true);
    setMensagem(null);
    try {
      const { data } = await api.get("/produtos/fiscal/cadastro", {
        params: { search: busca, status, ativo },
      });
      setProdutos(data.produtos || []);
      setResumo(data.resumo || {});
      setSelecionados((atuais) => atuais.filter((id) => (data.produtos || []).some((p) => p._id === id)));
    } catch (error) {
      setMensagem({ tipo: "erro", texto: error.response?.data?.message || "Não foi possível carregar os produtos." });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(carregar, 350);
    return () => clearTimeout(timer);
  }, [busca, status, ativo]);

  const todosSelecionados = useMemo(
    () => produtos.length > 0 && produtos.every((produto) => selecionados.includes(produto._id)),
    [produtos, selecionados]
  );

  function alternarTodos() {
    if (todosSelecionados) {
      setSelecionados((atuais) => atuais.filter((id) => !produtos.some((produto) => produto._id === id)));
    } else {
      setSelecionados((atuais) => [...new Set([...atuais, ...produtos.map((produto) => produto._id)])]);
    }
  }

  function alternarProduto(id) {
    setSelecionados((atuais) => atuais.includes(id) ? atuais.filter((item) => item !== id) : [...atuais, id]);
  }

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function aplicarEmLote(event) {
    event.preventDefault();
    const dadosFiscais = Object.fromEntries(Object.entries(form).filter(([, valor]) => String(valor).trim() !== ""));
    if (!selecionados.length) {
      setMensagem({ tipo: "erro", texto: "Selecione pelo menos um produto." });
      return;
    }
    if (!Object.keys(dadosFiscais).length) {
      setMensagem({ tipo: "erro", texto: "Preencha pelo menos um campo fiscal para aplicar." });
      return;
    }

    setSalvando(true);
    setMensagem(null);
    try {
      const { data } = await api.patch("/produtos/fiscal/lote", { ids: selecionados, dadosFiscais });
      setMensagem({ tipo: "sucesso", texto: data.message || "Dados fiscais atualizados." });
      setForm(ESTADO_INICIAL);
      setSelecionados([]);
      await carregar();
    } catch (error) {
      setMensagem({ tipo: "erro", texto: error.response?.data?.message || "Não foi possível atualizar os produtos." });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AdminLayout title="Cadastro Fiscal de Produtos" subtitle="Classificação fiscal individual e em lote">
      <div className="cadastro-fiscal-page">
        <section className="fiscal-resumo-grid">
          <div className="fiscal-resumo-card"><span>Total</span><strong>{resumo.total || 0}</strong></div>
          <div className="fiscal-resumo-card sucesso"><span>Completos</span><strong>{resumo.completo || 0}</strong></div>
          <div className="fiscal-resumo-card alerta"><span>Atenção</span><strong>{resumo.atencao || 0}</strong></div>
          <div className="fiscal-resumo-card erro"><span>Incompletos</span><strong>{resumo.incompleto || 0}</strong></div>
          <div className="fiscal-resumo-card"><span>Sem NCM</span><strong>{resumo.semNcm || 0}</strong></div>
          <div className="fiscal-resumo-card"><span>Sem CFOP</span><strong>{resumo.semCfop || 0}</strong></div>
        </section>

        {mensagem && <div className={`fiscal-mensagem ${mensagem.tipo}`}>{mensagem.texto}</div>}

        <section className="fiscal-lote-card">
          <div className="fiscal-section-title">
            <FaFileInvoiceDollar />
            <div><h2>Aplicar dados fiscais em lote</h2><p>Somente os campos preenchidos abaixo serão alterados nos produtos selecionados.</p></div>
          </div>

          <form onSubmit={aplicarEmLote}>
            <div className="fiscal-form-grid">
              <label>NCM<input value={form.ncm} placeholder="8 números" onChange={(e) => alterar("ncm", somenteNumeros(e.target.value, 8))} /></label>
              <label>CEST<input value={form.cest} placeholder="7 números" onChange={(e) => alterar("cest", somenteNumeros(e.target.value, 7))} /></label>
              <label>CFOP interno<input value={form.cfopInterno} placeholder="Ex.: 5102" onChange={(e) => alterar("cfopInterno", somenteNumeros(e.target.value, 4))} /></label>
              <label>CFOP interestadual<input value={form.cfopInterestadual} placeholder="Ex.: 6102" onChange={(e) => alterar("cfopInterestadual", somenteNumeros(e.target.value, 4))} /></label>
              <label>CSOSN<select value={form.csosn} onChange={(e) => alterar("csosn", e.target.value)}><option value="">Não alterar</option><option value="101">101</option><option value="102">102</option><option value="103">103</option><option value="201">201</option><option value="202">202</option><option value="203">203</option><option value="300">300</option><option value="400">400</option><option value="500">500</option><option value="900">900</option></select></label>
              <label>CST ICMS<input value={form.cstIcms} placeholder="Regime normal" onChange={(e) => alterar("cstIcms", somenteNumeros(e.target.value, 3))} /></label>
              <label>Origem<select value={form.origemMercadoria} onChange={(e) => alterar("origemMercadoria", e.target.value)}><option value="">Não alterar</option><option value="0">0 - Nacional</option><option value="1">1 - Importação direta</option><option value="2">2 - Estrangeira mercado interno</option><option value="3">3 - Nacional, importação &gt; 40%</option><option value="4">4 - Nacional, processo básico</option><option value="5">5 - Nacional, importação ≤ 40%</option><option value="6">6 - Importação sem similar</option><option value="7">7 - Mercado interno sem similar</option><option value="8">8 - Nacional, importação &gt; 70%</option></select></label>
              <label>Unidade comercial<input value={form.unidadeComercial} placeholder="Ex.: UN" onChange={(e) => alterar("unidadeComercial", e.target.value.toUpperCase())} /></label>
              <label>Unidade tributável<input value={form.unidadeTributavel} placeholder="Ex.: UN" onChange={(e) => alterar("unidadeTributavel", e.target.value.toUpperCase())} /></label>
            </div>
            <div className="fiscal-lote-actions">
              <span><strong>{selecionados.length}</strong> produto(s) selecionado(s)</span>
              <button type="submit" disabled={salvando}>{salvando ? "Aplicando..." : "Aplicar aos selecionados"}</button>
            </div>
          </form>
        </section>

        <section className="fiscal-produtos-card">
          <div className="fiscal-toolbar">
            <div className="fiscal-search"><FaSearch /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar produto, categoria ou código" /></div>
            <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="todos">Todos os status</option><option value="incompleto">Incompletos</option><option value="atencao">Atenção</option><option value="completo">Completos</option></select>
            <select value={ativo} onChange={(e) => setAtivo(e.target.value)}><option value="todos">Ativos e inativos</option><option value="true">Somente ativos</option><option value="false">Somente inativos</option></select>
            <button type="button" className="btn-atualizar" onClick={carregar} disabled={carregando}><FaSyncAlt className={carregando ? "girando" : ""} /> Atualizar</button>
          </div>

          <div className="fiscal-table-wrap">
            <table className="fiscal-produtos-table">
              <thead><tr><th><input type="checkbox" checked={todosSelecionados} onChange={alternarTodos} /></th><th>Produto</th><th>Status</th><th>NCM</th><th>CFOP</th><th>CSOSN/CST</th><th>Origem</th><th>Pendências</th></tr></thead>
              <tbody>
                {carregando ? <tr><td colSpan="8" className="fiscal-empty">Carregando produtos...</td></tr> : produtos.length === 0 ? <tr><td colSpan="8" className="fiscal-empty">Nenhum produto encontrado.</td></tr> : produtos.map((produto) => {
                  const fiscal = produto.dadosFiscais || {};
                  return <tr key={produto._id} className={selecionados.includes(produto._id) ? "selecionado" : ""}>
                    <td><input type="checkbox" checked={selecionados.includes(produto._id)} onChange={() => alternarProduto(produto._id)} /></td>
                    <td><strong>{produto.nome}</strong><small>{produto.categoria || produto.sku || "Sem categoria"}</small></td>
                    <td><StatusFiscal status={produto.statusFiscal} pendencias={produto.pendenciasFiscais} /></td>
                    <td>{fiscal.ncm || "—"}</td><td>{fiscal.cfopInterno || "—"}</td><td>{fiscal.csosn || fiscal.cstIcms || "—"}</td><td>{fiscal.origemMercadoria ?? "—"}</td>
                    <td><div className="fiscal-pendencias">{(produto.pendenciasFiscais || []).length ? produto.pendenciasFiscais.map((item) => <span key={item}>{item}</span>) : <span className="ok">Sem pendências</span>}</div></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
