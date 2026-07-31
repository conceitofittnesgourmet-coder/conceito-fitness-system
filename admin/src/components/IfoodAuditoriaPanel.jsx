import { useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaHistory,
  FaSearch,
  FaSyncAlt,
  FaTimesCircle,
  FaTools,
} from "react-icons/fa";
import api from "../services/api";

function dataHora(valor) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR");
}

function rotuloModulo(modulo) {
  return ({ configuracao: "Configuração", eventos: "Eventos", pedidos: "Pedidos", catalogo: "Catálogo" })[modulo] || modulo;
}

function IconeStatus({ status }) {
  if (status === "ok") return <FaCheckCircle />;
  if (status === "critico" || status === "erro") return <FaTimesCircle />;
  return <FaExclamationTriangle />;
}

export default function IfoodAuditoriaPanel({ configuracao, notificar }) {
  const [auditoria, setAuditoria] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [executando, setExecutando] = useState(false);
  const [corrigindo, setCorrigindo] = useState("");
  const [consultarRemoto, setConsultarRemoto] = useState(true);
  const [filtro, setFiltro] = useState("todos");

  const habilitado = Boolean(configuracao?.merchantId && configuracao?.ultimoTesteOk);
  const problemas = useMemo(() => {
    const lista = auditoria?.problemas || [];
    return filtro === "todos" ? lista : lista.filter((item) => item.modulo === filtro || item.severidade === filtro);
  }, [auditoria, filtro]);

  async function carregar() {
    try {
      const [ultima, lista] = await Promise.all([
        api.get("/ifood/auditoria/ultima"),
        api.get("/ifood/auditoria/historico?limite=8"),
      ]);
      setAuditoria(ultima.data?.resultado || null);
      setHistorico(lista.data?.auditorias || []);
    } catch (error) {
      // O painel pode iniciar sem auditoria anterior.
    }
  }

  useEffect(() => { carregar(); }, [configuracao?.merchantId]);

  async function executar() {
    setExecutando(true);
    try {
      const response = await api.post("/ifood/auditoria/executar", { consultarRemoto });
      setAuditoria(response.data?.resultado || null);
      notificar?.(response.data?.resultado?.status === "ok" ? "ok" : "erro", response.data?.message || "Auditoria concluída.");
      await carregar();
    } catch (error) {
      notificar?.("erro", error.response?.data?.message || "Falha ao executar a auditoria.");
    } finally {
      setExecutando(false);
    }
  }

  async function corrigir(item) {
    const chave = `${item.codigo}:${item.referencia}`;
    setCorrigindo(chave);
    try {
      const response = await api.post("/ifood/auditoria/corrigir", {
        codigo: item.codigo,
        referencia: item.referencia,
      });
      notificar?.("ok", response.data?.message || "Pendência corrigida.");
      await executar();
    } catch (error) {
      notificar?.("erro", error.response?.data?.message || "Não foi possível corrigir a pendência.");
    } finally {
      setCorrigindo("");
    }
  }

  if (!habilitado) {
    return <section className="ifood-card ifood-audit-card"><div className="ifood-card-title"><FaSearch /><div><h3>Auditoria e reconciliação</h3><p>Valide a conexão e selecione a loja antes de executar os testes finais.</p></div></div></section>;
  }

  const resumo = auditoria?.resumo || {};
  const metricas = auditoria?.metricas || {};

  return <section className="ifood-card ifood-audit-card">
    <div className="ifood-audit-head">
      <div className="ifood-card-title"><FaSearch /><div><h3>Auditoria, reconciliação e testes finais</h3><p>Compare configuração, eventos, pedidos e catálogo local com o iFood.</p></div></div>
      <div className="ifood-audit-actions">
        <label><input type="checkbox" checked={consultarRemoto} onChange={(e) => setConsultarRemoto(e.target.checked)} /> Consultar catálogo remoto</label>
        <button className="primary" onClick={executar} disabled={executando}><FaSyncAlt /> {executando ? "Auditando..." : "Executar auditoria"}</button>
      </div>
    </div>

    {auditoria ? <>
      <div className={`ifood-audit-status ${auditoria.status}`}><IconeStatus status={auditoria.status} /><div><strong>{auditoria.status === "ok" ? "Integração consistente" : auditoria.status === "critico" ? "Pendências críticas encontradas" : auditoria.status === "erro" ? "Auditoria interrompida" : "Integração requer atenção"}</strong><span>Última execução: {dataHora(auditoria.concluidaEm || auditoria.createdAt)} · {auditoria.duracaoMs || 0} ms</span></div></div>

      <div className="ifood-metrics ifood-audit-metrics">
        <div><span>Críticos</span><strong>{resumo.criticos || 0}</strong></div>
        <div><span>Avisos</span><strong>{resumo.avisos || 0}</strong></div>
        <div><span>Eventos com erro</span><strong>{metricas.eventos?.erros || 0}</strong></div>
        <div><span>Pedidos sem vínculo</span><strong>{metricas.pedidos?.semPedidoErp || 0}</strong></div>
        <div><span>Produtos sem mapa</span><strong>{metricas.catalogo?.semMapeamento || 0}</strong></div>
        <div><span>Itens remotos</span><strong>{metricas.catalogo?.itensRemotos || 0}</strong></div>
      </div>

      <div className="ifood-audit-filters">
        {["todos", "critico", "aviso", "configuracao", "eventos", "pedidos", "catalogo"].map((item) => <button key={item} className={filtro === item ? "active" : ""} onClick={() => setFiltro(item)}>{item === "todos" ? "Todos" : rotuloModulo(item)}</button>)}
      </div>

      <div className="ifood-audit-list">
        {problemas.length ? problemas.map((item, index) => {
          const chave = `${item.codigo}:${item.referencia}`;
          return <article key={`${chave}:${index}`} className={`ifood-audit-issue ${item.severidade}`}>
            <div className="ifood-audit-issue-icon"><IconeStatus status={item.severidade === "aviso" ? "atencao" : item.severidade} /></div>
            <div className="ifood-audit-issue-body"><div className="ifood-audit-issue-meta"><span>{rotuloModulo(item.modulo)}</span><code>{item.codigo}</code></div><h4>{item.titulo}</h4><p>{item.descricao}</p>{item.acaoSugerida && <small><strong>Ação recomendada:</strong> {item.acaoSugerida}</small>}</div>
            {item.corrigivelAutomaticamente && <button onClick={() => corrigir(item)} disabled={Boolean(corrigindo)}><FaTools /> {corrigindo === chave ? "Corrigindo..." : "Corrigir"}</button>}
          </article>;
        }) : <div className="ifood-audit-empty"><FaCheckCircle /><strong>Nenhuma divergência encontrada.</strong><span>Configuração, pedidos, eventos e catálogo estão consistentes.</span></div>}
      </div>
    </> : <div className="ifood-audit-empty"><FaSearch /><strong>Nenhuma auditoria executada.</strong><span>Execute o teste final antes de liberar a integração na operação.</span></div>}

    {historico.length > 0 && <div className="ifood-audit-history"><h4><FaHistory /> Histórico recente</h4><div>{historico.map((item) => <span key={item._id} className={item.status}><IconeStatus status={item.status} /> {dataHora(item.concluidaEm || item.createdAt)} · {item.resumo?.criticos || 0} crítico(s) · {item.resumo?.avisos || 0} aviso(s)</span>)}</div></div>}
  </section>;
}
