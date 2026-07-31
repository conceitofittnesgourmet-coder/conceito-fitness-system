import { useEffect, useMemo, useState } from "react";
import {
  FaBoxOpen,
  FaCheck,
  FaClone,
  FaCog,
  FaFilter,
  FaList,
  FaSave,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import toast from "react-hot-toast";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import "../styles/produtos-personalizacoes.css";

const idDe = (valor) => String(valor?._id || valor?.id || valor || "");
const dinheiro = (valor) => Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function configPadrao(grupo) {
  return {
    grupoId: idDe(grupo),
    nome: grupo.nome,
    tipo: grupo.tipo || "personalizado",
    obrigatorio: Boolean(grupo.obrigatorio),
    minimoEscolhas: Number(grupo.minimoEscolhas || 0),
    maximoEscolhas: Number(grupo.maximoEscolhas || 1),
    ordem: Number(grupo.ordem || 0),
    mostrarPDV: grupo.canais?.pdv !== false,
    mostrarCardapio: grupo.canais?.cardapio !== false,
    mostrarPWA: grupo.canais?.pwa !== false,
    regraPreco: "sem_alteracao",
    valorPreco: 0,
    opcoesPermitidas: [],
    opcoesPadrao: [],
  };
}

function ProdutosPersonalizacoes() {
  const [produtos, setProdutos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [opcoes, setOpcoes] = useState([]);
  const [produtoId, setProdutoId] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [gruposSelecionados, setGruposSelecionados] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [permiteObservacao, setPermiteObservacao] = useState(true);
  const [permiteMontagemCliente, setPermiteMontagemCliente] = useState(true);
  const [copiarDe, setCopiarDe] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregarBase() {
    try {
      setCarregando(true);
      const [{ data: dadosProdutos }, { data: dadosGrupos }, { data: dadosOpcoes }] = await Promise.all([
        api.get("/produtos", { params: { limit: 9999 } }),
        api.get("/grupos-componentes"),
        api.get("/opcoes-componentes"),
      ]);
      setProdutos(dadosProdutos.produtos || []);
      setGrupos(dadosGrupos.grupos || []);
      setOpcoes(dadosOpcoes.opcoes || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao carregar configurações.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregarBase(); }, []);

  const produto = useMemo(() => produtos.find((p) => idDe(p) === produtoId), [produtos, produtoId]);
  const produtosFiltrados = useMemo(() => produtos.filter((p) => {
    const termo = busca.trim().toLowerCase();
    const bateBusca = !termo || [p.nome, p.categoria, p.sku].some((v) => String(v || "").toLowerCase().includes(termo));
    const configurado = (p.gruposComponentes || []).length > 0;
    return bateBusca && (filtro === "todos" || (filtro === "configurados" ? configurado : !configurado));
  }), [produtos, busca, filtro]);

  const opcoesPorGrupo = useMemo(() => {
    const mapa = new Map();
    opcoes.forEach((opcao) => {
      const chave = idDe(opcao.grupo);
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave).push(opcao);
    });
    return mapa;
  }, [opcoes]);

  async function selecionarProduto(id) {
    setProdutoId(id);
    setCopiarDe("");
    if (!id) return;
    try {
      const { data } = await api.get(`/produtos/${id}/personalizacoes`);
      const p = data.produto || {};
      setGruposSelecionados((p.gruposComponentes || []).map(idDe));
      setConfigs((p.configuracaoGrupos || []).map((c) => ({
        ...c,
        grupoId: idDe(c.grupoId),
        opcoesPermitidas: (c.opcoesPermitidas || []).map(idDe),
        opcoesPadrao: (c.opcoesPadrao || []).map(idDe),
      })));
      setPermiteObservacao(p.permiteObservacao !== false);
      setPermiteMontagemCliente(p.permiteMontagemCliente !== false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao carregar produto.");
    }
  }

  function obterConfig(grupo) {
    return configs.find((c) => idDe(c.grupoId) === idDe(grupo)) || configPadrao(grupo);
  }

  function atualizarConfig(grupo, campo, valor) {
    const grupoId = idDe(grupo);
    const atual = obterConfig(grupo);
    const nova = { ...atual, grupoId, [campo]: valor };
    setConfigs((lista) => lista.some((c) => idDe(c.grupoId) === grupoId)
      ? lista.map((c) => idDe(c.grupoId) === grupoId ? nova : c)
      : [...lista, nova]);
  }

  function alternarGrupo(grupo) {
    const grupoId = idDe(grupo);
    const ativo = gruposSelecionados.includes(grupoId);
    if (ativo) {
      setGruposSelecionados((lista) => lista.filter((id) => id !== grupoId));
      setConfigs((lista) => lista.filter((c) => idDe(c.grupoId) !== grupoId));
    } else {
      setGruposSelecionados((lista) => [...lista, grupoId]);
      setConfigs((lista) => [...lista, configPadrao(grupo)]);
    }
  }

  function alternarOpcao(grupo, campo, opcaoId) {
    const config = obterConfig(grupo);
    const atual = (config[campo] || []).map(idDe);
    const proximo = atual.includes(opcaoId) ? atual.filter((id) => id !== opcaoId) : [...atual, opcaoId];
    atualizarConfig(grupo, campo, proximo);
    if (campo === "opcoesPermitidas" && atual.includes(opcaoId)) {
      atualizarConfig(grupo, "opcoesPadrao", (config.opcoesPadrao || []).map(idDe).filter((id) => id !== opcaoId));
    }
  }

  async function salvar() {
    if (!produtoId) return toast.error("Selecione um produto.");
    try {
      setSalvando(true);
      const selecionadas = configs.filter((c) => gruposSelecionados.includes(idDe(c.grupoId)));
      await api.put(`/produtos/${produtoId}/personalizacoes`, {
        gruposComponentes: gruposSelecionados,
        configuracaoGrupos: selecionadas,
        permiteObservacao,
        permiteMontagemCliente,
      });
      toast.success("Opções do produto atualizadas!");
      await carregarBase();
      await selecionarProduto(produtoId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao salvar personalizações.");
    } finally {
      setSalvando(false);
    }
  }

  async function copiar() {
    if (!produtoId || !copiarDe) return toast.error("Selecione o produto de origem.");
    if (!window.confirm("Substituir a configuração atual pela configuração do produto escolhido?")) return;
    try {
      setSalvando(true);
      await api.post(`/produtos/${produtoId}/personalizacoes/copiar`, { origemId: copiarDe });
      toast.success("Configuração copiada!");
      await carregarBase();
      await selecionarProduto(produtoId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao copiar configuração.");
    } finally {
      setSalvando(false);
    }
  }

  return <AdminLayout title="Opções por Produto" subtitle="Defina massas, recheios, coberturas, tamanhos e adicionais disponíveis em cada produto">
    <div className="pp-page">
      <section className="pp-sidebar">
        <div className="pp-search"><FaSearch/><input value={busca} onChange={(e)=>setBusca(e.target.value)} placeholder="Buscar produto..."/></div>
        <div className="pp-filter"><FaFilter/><select value={filtro} onChange={(e)=>setFiltro(e.target.value)}><option value="todos">Todos</option><option value="configurados">Configurados</option><option value="sem_configuracao">Sem configuração</option></select></div>
        <div className="pp-products">
          {carregando ? <p>Carregando...</p> : produtosFiltrados.map((p) => {
            const ativo = idDe(p) === produtoId;
            const qtd = (p.gruposComponentes || []).length;
            return <button key={idDe(p)} className={ativo ? "active" : ""} onClick={()=>selecionarProduto(idDe(p))}>
              <span className="pp-product-icon"><FaBoxOpen/></span><span><strong>{p.nome}</strong><small>{p.categoria || "Sem categoria"} · {qtd} grupo(s)</small></span>{qtd > 0 && <FaCheck className="ok"/>}
            </button>;
          })}
        </div>
      </section>

      <main className="pp-content">
        {!produto ? <div className="pp-empty"><FaCog/><h2>Selecione um produto</h2><p>Escolha um item ao lado para definir as opções que o cliente poderá selecionar.</p></div> : <>
          <header className="pp-header"><div><span>Produto selecionado</span><h2>{produto.nome}</h2><p>Preço base: {dinheiro(produto.preco)}</p></div><button className="pp-save" onClick={salvar} disabled={salvando}><FaSave/>{salvando ? "Salvando..." : "Salvar configuração"}</button></header>

          <section className="pp-copy"><FaClone/><div><strong>Copiar configuração de outro produto</strong><span>Útil para bolos com as mesmas massas, recheios e coberturas.</span></div><select value={copiarDe} onChange={(e)=>setCopiarDe(e.target.value)}><option value="">Selecione a origem</option>{produtos.filter((p)=>idDe(p)!==produtoId && (p.gruposComponentes||[]).length).map((p)=><option key={idDe(p)} value={idDe(p)}>{p.nome}</option>)}</select><button onClick={copiar} disabled={!copiarDe || salvando}>Copiar</button></section>

          <section className="pp-global"><label><input type="checkbox" checked={permiteMontagemCliente} onChange={(e)=>setPermiteMontagemCliente(e.target.checked)}/><span><strong>Permitir montagem pelo cliente</strong><small>Exibe os grupos no Cardápio Online e nos canais habilitados.</small></span></label><label><input type="checkbox" checked={permiteObservacao} onChange={(e)=>setPermiteObservacao(e.target.checked)}/><span><strong>Permitir observações</strong><small>Cliente pode informar detalhes especiais do item.</small></span></label></section>

          <div className="pp-groups">
            {grupos.map((grupo) => {
              const grupoId = idDe(grupo);
              const selecionado = gruposSelecionados.includes(grupoId);
              const config = obterConfig(grupo);
              const listaOpcoes = opcoesPorGrupo.get(grupoId) || [];
              const permitidas = (config.opcoesPermitidas || []).map(idDe);
              const padrao = (config.opcoesPadrao || []).map(idDe);
              return <article className={`pp-group ${selecionado ? "selected" : ""}`} key={grupoId}>
                <header><button className="pp-toggle" onClick={()=>alternarGrupo(grupo)}>{selecionado ? <FaCheck/> : <FaPlusSafe/>}</button><div><h3>{grupo.nome}</h3><p>{grupo.descricao || `${listaOpcoes.length} opção(ões) cadastrada(s)`}</p></div><span>{grupo.tipoSelecao === "multipla" ? "Múltipla" : "Única"}</span></header>
                {selecionado && <div className="pp-group-body">
                  <div className="pp-rules"><label>Obrigatório<select value={String(config.obrigatorio)} onChange={(e)=>atualizarConfig(grupo,"obrigatorio",e.target.value==="true")}><option value="true">Sim</option><option value="false">Não</option></select></label><label>Mínimo<input type="number" min="0" value={config.minimoEscolhas} onChange={(e)=>atualizarConfig(grupo,"minimoEscolhas",Number(e.target.value))}/></label><label>Máximo<input type="number" min="1" value={config.maximoEscolhas} onChange={(e)=>atualizarConfig(grupo,"maximoEscolhas",Number(e.target.value))}/></label><label>Ordem<input type="number" value={config.ordem} onChange={(e)=>atualizarConfig(grupo,"ordem",Number(e.target.value))}/></label></div>
                  <div className="pp-channels"><label><input type="checkbox" checked={config.mostrarPDV!==false} onChange={(e)=>atualizarConfig(grupo,"mostrarPDV",e.target.checked)}/> PDV</label><label><input type="checkbox" checked={config.mostrarCardapio!==false} onChange={(e)=>atualizarConfig(grupo,"mostrarCardapio",e.target.checked)}/> Cardápio</label><label><input type="checkbox" checked={config.mostrarPWA!==false} onChange={(e)=>atualizarConfig(grupo,"mostrarPWA",e.target.checked)}/> PWA</label></div>
                  <div className="pp-options-head"><div><FaList/><strong>Opções permitidas</strong><small>Sem seleção = todas as opções ativas do grupo.</small></div><button onClick={()=>atualizarConfig(grupo,"opcoesPermitidas",[])}>Liberar todas</button></div>
                  <div className="pp-options">{listaOpcoes.length===0 ? <p>Nenhuma opção cadastrada neste grupo.</p> : listaOpcoes.map((opcao)=>{
                    const opcaoId=idDe(opcao); const permitida=!permitidas.length || permitidas.includes(opcaoId); const padraoAtivo=padrao.includes(opcaoId);
                    return <div className={`pp-option ${permitida?"allowed":"blocked"}`} key={opcaoId}><button title={permitida?"Bloquear neste produto":"Permitir neste produto"} onClick={()=>alternarOpcao(grupo,"opcoesPermitidas",opcaoId)}>{permitida?<FaCheck/>:<FaTimes/>}</button><div><strong>{opcao.nome}</strong><small>{dinheiro(opcao.precoAdicional)} adicional</small></div><label><input type="checkbox" disabled={!permitida} checked={padraoAtivo} onChange={()=>alternarOpcao(grupo,"opcoesPadrao",opcaoId)}/> Padrão</label></div>;
                  })}</div>
                </div>}
              </article>;
            })}
          </div>
        </>}
      </main>
    </div>
  </AdminLayout>;
}

function FaPlusSafe() { return <span className="plus-safe">+</span>; }
export default ProdutosPersonalizacoes;
