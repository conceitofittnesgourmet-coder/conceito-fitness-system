import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FaBell,
  FaCheck,
  FaClipboardCheck,
  FaClock,
  FaExclamationTriangle,
  FaFire,
  FaRedo,
  FaPrint,
  FaStopwatch,
  FaTimes,
  FaTv,
  FaUtensils,
} from "react-icons/fa";

import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import socket from "../services/socket";
import {
  configuracoesAgrupadas,
  imprimirComandaPedido,
  resumoOpcao,
} from "../utils/personalizacaoPedido";

const COLUNAS = [
  { chave: "aguardando", titulo: "Aguardando", icone: <FaClock />, statusAceitos: ["aguardando", "pendente", "novo"] },
  { chave: "producao", titulo: "Em produção", icone: <FaFire />, statusAceitos: ["producao", "em_producao", "preparando"] },
  { chave: "pronto", titulo: "Prontos", icone: <FaCheck />, statusAceitos: ["pronto", "finalizado"] },
  { chave: "entregue", titulo: "Entregues", icone: <FaClipboardCheck />, statusAceitos: ["entregue", "retirado"] },
];

const CHECKLIST_PADRAO = [
  "Conferir itens do pedido",
  "Separar embalagem",
  "Preparar produtos",
  "Conferir montagem",
  "Liberar pedido",
];

function normalizarStatus(status) {
  const valor = String(status || "aguardando").toLowerCase().trim();
  return COLUNAS.find((item) => item.statusAceitos.includes(valor))?.chave || "aguardando";
}

function extrairPedidos(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.pedidos || payload?.fila || payload?.data?.pedidos || payload?.data?.fila || [];
}

function numeroPedido(pedido) {
  return pedido.numero || pedido.codigo || pedido.numeroPedido || pedido._id?.slice(-6).toUpperCase() || "------";
}

function nomeCliente(pedido) {
  if (typeof pedido.cliente === "string") return pedido.cliente;
  return pedido.cliente?.nome || pedido.nomeCliente || pedido.consumidor?.nome || "Cliente não informado";
}

function itensPedido(pedido) {
  return pedido.produtos || pedido.itens || pedido.items || [];
}

function nomeProduto(item) {
  return item.nome || item.produto?.nome || item.descricao || "Produto";
}

function quantidadeProduto(item) {
  return Number(item.quantidade || item.qtd || 1);
}

function dataReferencia(pedido) {
  return pedido.inicioProducao || pedido.iniciadoEm || pedido.updatedAt || pedido.createdAt || new Date().toISOString();
}

function formatarHora(data) {
  const valor = new Date(data);
  if (Number.isNaN(valor.getTime())) return "--:--";
  return valor.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function segundosDecorridos(data) {
  const inicio = new Date(data).getTime();
  if (Number.isNaN(inicio)) return 0;
  return Math.max(0, Math.floor((Date.now() - inicio) / 1000));
}

function formatarCronometro(totalSegundos) {
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  const partes = horas > 0 ? [horas, minutos, segundos] : [minutos, segundos];
  return partes.map((valor) => String(valor).padStart(2, "0")).join(":");
}

function classeTempo(segundos, tempoPrevistoMinutos) {
  const previsto = Number(tempoPrevistoMinutos || 15) * 60;
  if (segundos >= previsto) return "tempo-atrasado";
  if (segundos >= previsto * 0.7) return "tempo-atencao";
  return "tempo-normal";
}

function checklistPedido(pedido) {
  const original = Array.isArray(pedido.checklist) ? pedido.checklist : [];
  const sugerido = Array.isArray(pedido.checklistSugerido)
    ? pedido.checklistSugerido
    : [];
  if (!original.length && sugerido.length) {
    return sugerido.map((item, index) => ({
      id: item._id || item.id || `sugerido-${index}`,
      descricao: item.descricao || item.nome || `Etapa ${index + 1}`,
      concluido: Boolean(item.concluido),
    }));
  }
  if (!original.length) {
    return CHECKLIST_PADRAO.map((descricao, index) => ({ id: `padrao-${index}`, descricao, concluido: false }));
  }
  return original.map((item, index) => {
    if (typeof item === "string") return { id: `item-${index}`, descricao: item, concluido: false };
    return {
      ...item,
      id: item._id || item.id || `item-${index}`,
      descricao: item.descricao || item.nome || item.titulo || `Etapa ${index + 1}`,
      concluido: Boolean(item.concluido || item.feito || item.checked),
    };
  });
}

function proximoStatus(statusAtual) {
  const atual = normalizarStatus(statusAtual);
  if (atual === "aguardando") return "producao";
  if (atual === "producao") return "pronto";
  if (atual === "pronto") return "entregue";
  return null;
}

function textoAcao(statusAtual) {
  const atual = normalizarStatus(statusAtual);
  if (atual === "aguardando") return "Iniciar preparo";
  if (atual === "producao") return "Marcar como pronto";
  if (atual === "pronto") return "Entregar pedido";
  return "Concluído";
}

function PedidoCard({ pedido, agora, atualizando, onAlterarStatus, onAlternarChecklist, onAlternarPrioridade, onDragStart }) {
  const status = normalizarStatus(pedido.statusProducao || pedido.status);
  const referencia = dataReferencia(pedido);
  const segundos = segundosDecorridos(referencia);
  const checklist = checklistPedido(pedido);
  const concluidos = checklist.filter((item) => item.concluido).length;
  const progresso = checklist.length ? Math.round((concluidos / checklist.length) * 100) : 0;
  const prioridade =
    Number(pedido.prioridadeProducao || 0) > 0 ||
    pedido.prioridade === true ||
    pedido.prioridade === "alta" ||
    pedido.prioridade === "urgente";
  const proximo = proximoStatus(status);
  void agora;

  return (
    <article className={`cozinha-pedido-card ${prioridade ? "prioridade" : ""}`} draggable onDragStart={(event) => onDragStart(event, pedido)}>
      <div className="cozinha-card-topo">
        <div>
          <span className="cozinha-numero">#{numeroPedido(pedido)}</span>
          <h3>{nomeCliente(pedido)}</h3>
        </div>
        <button type="button" className={`cozinha-prioridade-btn ${prioridade ? "ativa" : ""}`} title={prioridade ? "Remover prioridade" : "Marcar como prioridade"} onClick={() => onAlternarPrioridade(pedido, !prioridade)} disabled={atualizando}>
          <FaExclamationTriangle />
        </button>
      </div>

      <div className="cozinha-meta">
        <span><FaClock /> Pedido às {formatarHora(pedido.createdAt || referencia)}</span>
        <strong className={`cozinha-cronometro ${classeTempo(segundos, pedido.tempoPrevisto)}`}><FaStopwatch />{formatarCronometro(segundos)}</strong>
      </div>

      <div className="cozinha-itens">
        {itensPedido(pedido).map((item, index) => {
          const grupos = configuracoesAgrupadas(item);
          const observacaoItem = String(item.observacaoItem || "").trim();

          return (
            <div className="cozinha-item-bloco" key={item._id || `${nomeProduto(item)}-${index}`}>
              <div className="cozinha-item">
                <strong>{quantidadeProduto(item)}x</strong><span>{nomeProduto(item)}</span>
              </div>

              {grupos.length > 0 && (
                <div className="cozinha-personalizacoes">
                  {grupos.map(({ grupo, opcoes }) => (
                    <div className="cozinha-personalizacao-grupo" key={`${grupo}-${index}`}>
                      <b>{grupo}:</b>
                      <span>{opcoes.map(resumoOpcao).join(", ")}</span>
                    </div>
                  ))}
                </div>
              )}

              {observacaoItem && (
                <div className="cozinha-observacao-item">
                  <strong>OBS DO ITEM:</strong> {observacaoItem}
                </div>
              )}
            </div>
          );
        })}
        {itensPedido(pedido).length === 0 && <p className="cozinha-sem-itens">Itens não informados.</p>}
      </div>

      {(pedido.observacao || pedido.observacoes || pedido.nota) && (
        <div className="cozinha-observacao"><strong>Observação:</strong> {pedido.observacao || pedido.observacoes || pedido.nota}</div>
      )}

      <div className="cozinha-checklist">
        <div className="cozinha-checklist-cabecalho"><span>Checklist</span><strong>{concluidos}/{checklist.length}</strong></div>
        <div className="cozinha-progresso"><span style={{ width: `${progresso}%` }} /></div>
        {checklist.map((item, index) => (
          <label className="cozinha-check-item" key={item.id}>
            <input type="checkbox" checked={item.concluido} disabled={atualizando} onChange={() => onAlternarChecklist(pedido, checklist, index)} />
            <span>{item.descricao}</span>
          </label>
        ))}
      </div>

      <div className="cozinha-card-acoes">
        <button
          type="button"
          className="cozinha-imprimir-comanda"
          onClick={() => imprimirComandaPedido(pedido)}
          title="Imprimir comanda com todas as personalizações"
        >
          <FaPrint /> Imprimir comanda
        </button>
        {proximo ? (
          <button type="button" className={`cozinha-acao-principal acao-${status}`} onClick={() => onAlterarStatus(pedido, proximo)} disabled={atualizando}>
            {atualizando ? "Atualizando..." : textoAcao(status)}
          </button>
        ) : (
          <button type="button" className="cozinha-acao-concluida" disabled><FaCheck /> Pedido concluído</button>
        )}
      </div>
    </article>
  );
}

function Cozinha() {
  const [pedidos, setPedidos] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizandoId, setAtualizandoId] = useState("");
  const [modoTv, setModoTv] = useState(false);
  const [agora, setAgora] = useState(Date.now());
  const [arrastandoId, setArrastandoId] = useState("");

  const carregarFila = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setLoading(true);
    try {
      setErro("");
      const [filaResposta, resumoResposta] = await Promise.allSettled([
        api.get("/producao/fila"),
        api.get("/producao/resumo"),
      ]);
      if (filaResposta.status === "rejected") throw filaResposta.reason;
      setPedidos(extrairPedidos(filaResposta.value.data));
      if (resumoResposta.status === "fulfilled") setResumo(resumoResposta.value.data?.resumo || resumoResposta.value.data);
    } catch (error) {
      console.error("Erro ao carregar painel de produção:", error);
      setErro(error?.response?.data?.message || "Não foi possível carregar a fila de produção.");
      if (!silencioso) toast.error("Erro ao carregar a cozinha");
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarFila();
    const intervalo = window.setInterval(() => setAgora(Date.now()), 1000);
    const atualizarEmTempoReal = () => carregarFila({ silencioso: true });
    const eventos = ["novo-pedido", "pedido-atualizado", "producao-atualizada", "fila-producao-atualizada"];
    eventos.forEach((evento) => socket.on(evento, atualizarEmTempoReal));
    return () => {
      window.clearInterval(intervalo);
      eventos.forEach((evento) => socket.off(evento, atualizarEmTempoReal));
    };
  }, [carregarFila]);

  useEffect(() => {
    if (!modoTv) return undefined;
    const sairComEsc = (event) => { if (event.key === "Escape") setModoTv(false); };
    window.addEventListener("keydown", sairComEsc);
    return () => window.removeEventListener("keydown", sairComEsc);
  }, [modoTv]);

  const pedidosPorColuna = useMemo(() => COLUNAS.reduce((resultado, coluna) => {
    resultado[coluna.chave] = pedidos.filter((pedido) => normalizarStatus(pedido.statusProducao || pedido.status) === coluna.chave);
    return resultado;
  }, {}), [pedidos]);

  const metricas = useMemo(() => ({
    total: pedidos.length,
    aguardando: pedidosPorColuna.aguardando?.length || 0,
    producao: pedidosPorColuna.producao?.length || 0,
    prontos: pedidosPorColuna.pronto?.length || 0,
    atrasados: pedidos.filter((pedido) => normalizarStatus(pedido.statusProducao || pedido.status) !== "entregue" && segundosDecorridos(dataReferencia(pedido)) >= Number(pedido.tempoPrevisto || 15) * 60).length,
  }), [pedidos, pedidosPorColuna, agora]);

  async function alterarStatus(pedido, status) {
    if (!pedido?._id) return;
    setAtualizandoId(pedido._id);
    try {
      await api.put(`/producao/${pedido._id}/status`, { status });
      setPedidos((atuais) => atuais.map((item) => item._id === pedido._id ? {
        ...item,
        status,
        statusProducao: status,
        ...(status === "producao" && !item.inicioProducao ? { inicioProducao: new Date().toISOString() } : {}),
      } : item));
      toast.success(status === "producao" ? "Preparo iniciado" : status === "pronto" ? "Pedido marcado como pronto" : "Pedido entregue");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Erro ao atualizar o status");
      carregarFila({ silencioso: true });
    } finally { setAtualizandoId(""); }
  }

  async function alternarChecklist(pedido, checklist, indice) {
    if (!pedido?._id) return;
    const atualizado = checklist.map((item, index) => index === indice ? { ...item, concluido: !item.concluido } : item);
    setAtualizandoId(pedido._id);
    try {
      await api.put(`/producao/${pedido._id}/checklist`, { checklist: atualizado });
      setPedidos((atuais) => atuais.map((item) => item._id === pedido._id ? { ...item, checklist: atualizado } : item));
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Erro ao atualizar o checklist");
      carregarFila({ silencioso: true });
    } finally { setAtualizandoId(""); }
  }

  async function alternarPrioridade(pedido, prioridade) {
    if (!pedido?._id) return;
    setAtualizandoId(pedido._id);
    try {
      await api.put(`/producao/${pedido._id}/prioridade`, { prioridade: prioridade ? "alta" : "normal" });
      setPedidos((atuais) => atuais.map((item) => item._id === pedido._id ? { ...item, prioridade: prioridade ? "alta" : "normal" } : item));
      toast.success(prioridade ? "Pedido priorizado" : "Prioridade removida");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Erro ao atualizar a prioridade");
      carregarFila({ silencioso: true });
    } finally { setAtualizandoId(""); }
  }

  function iniciarArraste(event, pedido) {
    setArrastandoId(pedido._id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", pedido._id);
  }

  async function soltarNaColuna(event, status) {
    event.preventDefault();
    const pedidoId = event.dataTransfer.getData("text/plain") || arrastandoId;
    setArrastandoId("");
    const pedido = pedidos.find((item) => item._id === pedidoId);
    if (!pedido || normalizarStatus(pedido.statusProducao || pedido.status) === status) return;
    await alterarStatus(pedido, status);
  }

  const conteudo = (
    <div className={`cozinha-premium-page ${modoTv ? "modo-tv" : ""}`}>
      <section className="cozinha-hero">
        <div>
          <span className="cozinha-eyebrow">Conceito Fitness Gourmet</span>
          <h1>Painel da Cozinha</h1>
          <p>Acompanhe o preparo dos pedidos, prioridades e tempo de produção em tempo real.</p>
        </div>
        <div className="cozinha-hero-acoes">
          <div className="cozinha-online"><span /> Atualização em tempo real</div>
          <button type="button" className="cozinha-botao-secundario" onClick={() => carregarFila()}><FaRedo /> Atualizar</button>
          <button type="button" className="cozinha-botao-tv" onClick={() => setModoTv((atual) => !atual)}>{modoTv ? <FaTimes /> : <FaTv />}{modoTv ? "Sair do modo TV" : "Modo TV"}</button>
        </div>
      </section>

      <section className="cozinha-kpis">
        <div className="cozinha-kpi total"><FaUtensils /><span>Na fila</span><strong>{resumo?.total ?? metricas.total}</strong><p>Pedidos monitorados</p></div>
        <div className="cozinha-kpi aguardando"><FaClock /><span>Aguardando</span><strong>{resumo?.aguardando ?? metricas.aguardando}</strong><p>Aguardando início</p></div>
        <div className="cozinha-kpi producao"><FaFire /><span>Em produção</span><strong>{resumo?.producao ?? metricas.producao}</strong><p>Em preparo agora</p></div>
        <div className="cozinha-kpi pronto"><FaCheck /><span>Prontos</span><strong>{resumo?.prontos ?? metricas.prontos}</strong><p>Aguardando entrega</p></div>
        <div className="cozinha-kpi atrasado"><FaBell /><span>Atrasados</span><strong>{resumo?.atrasados ?? metricas.atrasados}</strong><p>Acima do previsto</p></div>
      </section>

      {erro && <section className="cozinha-erro"><FaExclamationTriangle /><div><strong>Falha ao carregar a produção</strong><p>{erro}</p></div><button type="button" onClick={() => carregarFila()}>Tentar novamente</button></section>}

      {loading ? (
        <section className="cozinha-loading"><div className="loading-spinner" /><p>Carregando a fila de produção...</p></section>
      ) : (
        <section className="cozinha-kanban">
          {COLUNAS.map((coluna) => {
            const lista = pedidosPorColuna[coluna.chave] || [];
            return (
              <div className={`cozinha-coluna coluna-${coluna.chave}`} key={coluna.chave} onDragOver={(event) => event.preventDefault()} onDrop={(event) => soltarNaColuna(event, coluna.chave)}>
                <header className="cozinha-coluna-header"><div>{coluna.icone}<h2>{coluna.titulo}</h2></div><strong>{lista.length}</strong></header>
                <div className="cozinha-coluna-conteudo">
                  {lista.map((pedido) => <PedidoCard key={pedido._id} pedido={pedido} agora={agora} atualizando={atualizandoId === pedido._id} onAlterarStatus={alterarStatus} onAlternarChecklist={alternarChecklist} onAlternarPrioridade={alternarPrioridade} onDragStart={iniciarArraste} />)}
                  {lista.length === 0 && <div className="cozinha-coluna-vazia">{coluna.icone}<p>Nenhum pedido nesta etapa.</p></div>}
                </div>
              </div>
            );
          })}
        </section>
      )}
      {modoTv && <div className="cozinha-tv-aviso">Pressione ESC para sair do modo TV</div>}
    </div>
  );

  if (modoTv) return conteudo;
  return <AdminLayout title="Cozinha" subtitle="Fila operacional de pedidos em tempo real">{conteudo}</AdminLayout>;
}

export default Cozinha;
