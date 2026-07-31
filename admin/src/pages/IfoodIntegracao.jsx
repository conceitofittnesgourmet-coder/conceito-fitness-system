import { useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaCloud,
  FaExclamationTriangle,
  FaPlug,
  FaSave,
  FaStore,
  FaSyncAlt,
  FaShoppingBag,
  FaHistory,
  FaPlay,
} from "react-icons/fa";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import "../styles/ifood-integracao.css";

const inicial = {
  nome: "Integração principal",
  clientId: "",
  clientSecret: "",
  merchantId: "",
  merchantNome: "",
  catalogId: "",
  ativa: false,
  pollingAtivo: false,
  intervaloPollingSegundos: 30,
  sincronizarPedidos: true,
  sincronizarCatalogo: false,
  sincronizarDisponibilidade: false,
  clientSecretConfigurado: false,
  ultimoTesteOk: false,
  ultimoTesteEm: null,
  ultimoErro: "",
  ultimoStatusLoja: "",
  ultimoPollingEm: null,
  ultimoPollingOk: false,
  ultimoPollingErro: "",
  ultimoEventoEm: null,
  eventosRecebidos: 0,
  eventosProcessados: 0,
  pedidosImportados: 0,
};

function IfoodIntegracao() {
  const [form, setForm] = useState(inicial);
  const [merchants, setMerchants] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [pedidosImportados, setPedidosImportados] = useState([]);
  const [executandoPolling, setExecutandoPolling] = useState(false);

  const prontoParaTeste = useMemo(
    () => Boolean(form.clientId && (form.clientSecret || form.clientSecretConfigurado)),
    [form]
  );

  async function carregar() {
    setCarregando(true);
    try {
      const response = await api.get("/ifood/configuracao");
      setForm({ ...inicial, ...(response.data?.configuracao || {}), clientSecret: "" });
    } catch (error) {
      setMensagem({ tipo: "erro", texto: error.response?.data?.message || "Falha ao carregar a integração." });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    carregarOperacao();
  }, []);

  function alterar(nome, valor) {
    setForm((atual) => ({ ...atual, [nome]: valor }));
  }

  async function salvar() {
    setSalvando(true);
    setMensagem(null);
    try {
      const response = await api.put("/ifood/configuracao", form);
      setForm((atual) => ({
        ...atual,
        ...(response.data?.configuracao || {}),
        clientSecret: "",
      }));
      setMensagem({ tipo: "ok", texto: response.data?.message || "Configuração salva." });
    } catch (error) {
      setMensagem({ tipo: "erro", texto: error.response?.data?.message || "Não foi possível salvar." });
    } finally {
      setSalvando(false);
    }
  }

  async function testar() {
    setTestando(true);
    setMensagem(null);
    try {
      if (form.clientSecret || !form.clientSecretConfigurado) {
        const salvamento = await api.put("/ifood/configuracao", form);
        setForm((atual) => ({
          ...atual,
          ...(salvamento.data?.configuracao || {}),
          clientSecret: "",
        }));
      }
      const response = await api.post("/ifood/testar-conexao");
      const lista = response.data?.merchants || [];
      setMerchants(lista);
      const selecionado = response.data?.selecionado;
      setForm((atual) => ({
        ...atual,
        merchantId: selecionado?.id || atual.merchantId,
        merchantNome: selecionado?.name || selecionado?.corporateName || atual.merchantNome,
        ultimoTesteOk: true,
        ultimoTesteEm: new Date().toISOString(),
        ultimoErro: "",
        ultimoStatusLoja: response.data?.status?.state || response.data?.status?.status || "",
        clientSecretConfigurado: true,
        clientSecret: "",
      }));
      setMensagem({ tipo: "ok", texto: "Conexão validada. As lojas vinculadas foram carregadas." });
    } catch (error) {
      setForm((atual) => ({ ...atual, ultimoTesteOk: false }));
      setMensagem({ tipo: "erro", texto: error.response?.data?.message || "Falha no teste de conexão." });
    } finally {
      setTestando(false);
    }
  }

  function selecionarMerchant(id) {
    const merchant = merchants.find((item) => item.id === id);
    setForm((atual) => ({
      ...atual,
      merchantId: id,
      merchantNome: merchant?.name || merchant?.corporateName || "",
    }));
  }


async function carregarOperacao() {
  try {
    const [eventosResponse, pedidosResponse] = await Promise.all([
      api.get("/ifood/eventos?limite=20"),
      api.get("/ifood/pedidos-importados?limite=20"),
    ]);
    setEventos(eventosResponse.data?.eventos || []);
    setPedidosImportados(pedidosResponse.data?.pedidos || []);
  } catch (error) {
    // A configuração inicial continua acessível mesmo sem histórico.
  }
}

async function executarPolling() {
  setExecutandoPolling(true);
  setMensagem(null);
  try {
    if (form.clientSecret || !form.clientSecretConfigurado) {
      await api.put("/ifood/configuracao", form);
    }
    const response = await api.post("/ifood/polling/executar");
    const resultado = response.data?.resultado || {};
    setMensagem({
      tipo: resultado.erros?.length ? "erro" : "ok",
      texto: `Polling concluído: ${resultado.recebidos || 0} evento(s), ${resultado.pedidosImportados || 0} pedido(s) novo(s).`,
    });
    await carregar();
    await carregarOperacao();
  } catch (error) {
    setMensagem({ tipo: "erro", texto: error.response?.data?.message || "Falha ao executar o polling." });
  } finally {
    setExecutandoPolling(false);
  }
}

function dataHora(valor) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR");
}

  return (
    <AdminLayout
      title="Integração iFood"
      subtitle="Credenciais, loja vinculada e preparação da sincronização"
    >
      <div className="ifood-page">
        <section className="ifood-hero">
          <div>
            <span className="ifood-kicker"><FaPlug /> V04.3.2</span>
            <h2>Recebimento seguro de pedidos</h2>
            <p>
              Polling oficial, reconhecimento dos eventos e importação sem duplicidade para o ERP.
            </p>
          </div>
          <div className={`ifood-health ${form.ultimoTesteOk ? "ok" : "pendente"}`}>
            {form.ultimoTesteOk ? <FaCheckCircle /> : <FaExclamationTriangle />}
            <div>
              <strong>{form.ultimoTesteOk ? "Conexão validada" : "Conexão pendente"}</strong>
              <span>{form.ultimoStatusLoja || "Aguardando teste"}</span>
            </div>
          </div>
        </section>

        {mensagem && <div className={`ifood-alert ${mensagem.tipo}`}>{mensagem.texto}</div>}

        <div className="ifood-grid">
          <section className="ifood-card">
            <div className="ifood-card-title"><FaCloud /><div><h3>Credenciais do aplicativo</h3><p>Nunca exponha o Client Secret no frontend ou no GitHub.</p></div></div>

            {carregando ? <p>Carregando...</p> : <div className="ifood-form">
              <label>
                Nome da integração
                <input value={form.nome || ""} onChange={(e) => alterar("nome", e.target.value)} />
              </label>
              <label>
                Client ID
                <input value={form.clientId || ""} onChange={(e) => alterar("clientId", e.target.value)} placeholder="Client ID do Portal do Desenvolvedor" />
              </label>
              <label>
                Client Secret
                <input
                  type="password"
                  value={form.clientSecret || ""}
                  onChange={(e) => alterar("clientSecret", e.target.value)}
                  placeholder={form.clientSecretConfigurado ? "Já configurado — preencha somente para trocar" : "Informe o Client Secret"}
                />
                <small>{form.clientSecretConfigurado ? "Credencial protegida e já armazenada." : "Será criptografado no backend."}</small>
              </label>
              <label>
                Catalog ID <span>(opcional nesta etapa)</span>
                <input value={form.catalogId || ""} onChange={(e) => alterar("catalogId", e.target.value)} placeholder="Será usado na sincronização do cardápio" />
              </label>
            </div>}
          </section>

          <section className="ifood-card">
            <div className="ifood-card-title"><FaStore /><div><h3>Loja vinculada</h3><p>O Merchant ID identifica sua unidade no iFood.</p></div></div>
            <div className="ifood-form">
              {merchants.length > 0 ? (
                <label>
                  Loja encontrada
                  <select value={form.merchantId || ""} onChange={(e) => selecionarMerchant(e.target.value)}>
                    <option value="">Selecione</option>
                    {merchants.map((item) => <option key={item.id} value={item.id}>{item.name || item.corporateName} — {item.id}</option>)}
                  </select>
                </label>
              ) : (
                <label>
                  Merchant ID
                  <input value={form.merchantId || ""} onChange={(e) => alterar("merchantId", e.target.value)} placeholder="Será preenchido pelo teste de conexão" />
                </label>
              )}
              <label>
                Nome da loja
                <input value={form.merchantNome || ""} onChange={(e) => alterar("merchantNome", e.target.value)} />
              </label>
              <div className="ifood-status-box">
                <span>Status informado pelo iFood</span>
                <strong>{form.ultimoStatusLoja || "Não consultado"}</strong>
              </div>
            </div>
          </section>
        </div>

        <section className="ifood-card">
          <div className="ifood-card-title"><FaSyncAlt /><div><h3>Controles de sincronização</h3><p>Ative o polling somente depois de validar a loja e executar um teste manual.</p></div></div>
          <div className="ifood-switches">
            <label><input type="checkbox" checked={Boolean(form.ativa)} onChange={(e) => alterar("ativa", e.target.checked)} /> Integração ativa</label>
            <label><input type="checkbox" checked={Boolean(form.pollingAtivo)} onChange={(e) => alterar("pollingAtivo", e.target.checked)} /> Polling automático a cada 30 segundos</label>
            <label><input type="checkbox" checked={Boolean(form.sincronizarPedidos)} onChange={(e) => alterar("sincronizarPedidos", e.target.checked)} /> Sincronizar pedidos</label>
            <label><input type="checkbox" checked={Boolean(form.sincronizarCatalogo)} onChange={(e) => alterar("sincronizarCatalogo", e.target.checked)} /> Sincronizar catálogo</label>
            <label><input type="checkbox" checked={Boolean(form.sincronizarDisponibilidade)} onChange={(e) => alterar("sincronizarDisponibilidade", e.target.checked)} /> Sincronizar disponibilidade</label>
          </div>
          <div className="ifood-polling-note">
            <FaExclamationTriangle /> O evento só recebe acknowledgment depois de ser armazenado e processado. Eventos duplicados não criam pedidos repetidos.
          </div>
        </section>



<section className="ifood-card ifood-operation-card">
  <div className="ifood-card-title"><FaShoppingBag /><div><h3>Operação de pedidos</h3><p>Execute um ciclo manual antes de ativar o polling automático.</p></div></div>
  <div className="ifood-metrics">
    <div><span>Eventos recebidos</span><strong>{form.eventosRecebidos || 0}</strong></div>
    <div><span>Eventos processados</span><strong>{form.eventosProcessados || 0}</strong></div>
    <div><span>Pedidos importados</span><strong>{form.pedidosImportados || 0}</strong></div>
    <div><span>Último polling</span><strong>{dataHora(form.ultimoPollingEm)}</strong></div>
  </div>
  {form.ultimoPollingErro && <div className="ifood-alert erro">{form.ultimoPollingErro}</div>}
  <button className="primary" onClick={executarPolling} disabled={executandoPolling || !form.merchantId}>
    <FaPlay /> {executandoPolling ? "Consultando iFood..." : "Executar polling agora"}
  </button>
</section>

<div className="ifood-grid">
  <section className="ifood-card">
    <div className="ifood-card-title"><FaHistory /><div><h3>Eventos recentes</h3><p>Histórico persistido antes do acknowledgment.</p></div></div>
    <div className="ifood-table-wrap">
      <table className="ifood-table"><thead><tr><th>Evento</th><th>Pedido</th><th>Status</th><th>Recebido</th></tr></thead>
        <tbody>{eventos.length ? eventos.map((item) => <tr key={item._id}><td><strong>{item.fullCode || item.code}</strong><small>{item.eventId}</small></td><td>{item.orderId || "—"}</td><td><span className={`ifood-event-status ${item.statusProcessamento}`}>{item.statusProcessamento}</span></td><td>{dataHora(item.criadoNoIfoodEm || item.createdAt)}</td></tr>) : <tr><td colSpan="4">Nenhum evento recebido.</td></tr>}</tbody>
      </table>
    </div>
  </section>
  <section className="ifood-card">
    <div className="ifood-card-title"><FaShoppingBag /><div><h3>Pedidos importados</h3><p>Pedidos vinculados ao fluxo interno do ERP.</p></div></div>
    <div className="ifood-table-wrap">
      <table className="ifood-table"><thead><tr><th>iFood</th><th>ERP</th><th>Status</th><th>Importado</th></tr></thead>
        <tbody>{pedidosImportados.length ? pedidosImportados.map((item) => <tr key={item._id}><td><strong>#{item.displayId || item.orderId?.slice(-6)}</strong><small>{item.orderType}</small></td><td>{item.pedidoErp?.numeroPedido ? `#${item.pedidoErp.numeroPedido}` : "—"}</td><td>{item.status}</td><td>{dataHora(item.importadoEm || item.createdAt)}</td></tr>) : <tr><td colSpan="4">Nenhum pedido importado.</td></tr>}</tbody>
      </table>
    </div>
  </section>
</div>

        <div className="ifood-actions">
          <button className="secondary" onClick={salvar} disabled={salvando || carregando}><FaSave /> {salvando ? "Salvando..." : "Salvar configuração"}</button>
          <button className="primary" onClick={testar} disabled={testando || !prontoParaTeste}><FaPlug /> {testando ? "Testando..." : "Salvar e testar conexão"}</button>
        </div>
      </div>
    </AdminLayout>
  );
}

export default IfoodIntegracao;
