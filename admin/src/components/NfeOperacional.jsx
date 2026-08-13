import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const destinatarioVazio = {
  tipoPessoa: "juridica",
  nomeRazaoSocial: "",
  nomeFantasia: "",
  cnpj: "",
  inscricaoEstadual: "",
  indicadorIe: 1,
  email: "",
  telefone: "",
  endereco: {
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    codigoMunicipioIbge: "",
    uf: "PR",
  },
};

function dinheiro(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function NfeOperacional() {
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [nfes, setNfes] = useState([]);
  const [diagnostico, setDiagnostico] = useState(null);
  const [pedidoId, setPedidoId] = useState("");
  const [destinatario, setDestinatario] = useState(destinatarioVazio);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erros, setErros] = useState([]);
  const [validacao, setValidacao] = useState(null);
  const [statusSefaz, setStatusSefaz] = useState(null);

  const pedidoSelecionado = useMemo(
    () => pedidos.find((pedido) => pedido._id === pedidoId),
    [pedidos, pedidoId]
  );

  async function carregar() {
  const resultados = await Promise.allSettled([
    api.get("/pedidos"),
    api.get("/clientes"),
    api.get("/nfe"),
    api.get("/nfe/diagnostico/status"),
  ]);

  if (resultados[0].status === "fulfilled") {
    setPedidos(resultados[0].value.data.pedidos || []);
  }

  if (resultados[1].status === "fulfilled") {
    setClientes(resultados[1].value.data.clientes || []);
  }

  if (resultados[2].status === "fulfilled") {
    setNfes(resultados[2].value.data.nfes || []);
  }

  if (resultados[3].status === "fulfilled") {
    setDiagnostico(
      resultados[3].value.data.diagnostico || null
    );
  }
}

  useEffect(() => {
    carregar();
  }, []);

  function invalidarValidacao() {
    setValidacao(null);
  }

  function atualizarDestinatario(campo, valor) {
    invalidarValidacao();
    setDestinatario((atual) => ({ ...atual, [campo]: valor }));
  }

  function atualizarEndereco(campo, valor) {
    invalidarValidacao();
    setDestinatario((atual) => ({
      ...atual,
      endereco: { ...atual.endereco, [campo]: valor },
    }));
  }

  function selecionarPedido(id) {
  setPedidoId(id);
  invalidarValidacao();

  if (!id) {
    setDestinatario(destinatarioVazio);
    return;
  }

  const pedido = pedidos.find(
    (item) => item._id === id
  );

  if (!pedido) {
    return;
  }

  const normalizar = (texto) =>
    String(texto || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const nomePedido = normalizar(pedido.cliente);

  const cliente = clientes.find((item) => {
    return (
      normalizar(item.nome) === nomePedido ||
      normalizar(item.razaoSocial) === nomePedido ||
      normalizar(item.nomeFantasia) === nomePedido
    );
  });

  if (!cliente) {
    setDestinatario(destinatarioVazio);
    return;
  }

  setDestinatario({
    tipoPessoa: cliente.tipoPessoa || "juridica",

    nomeRazaoSocial:
      cliente.razaoSocial ||
      cliente.nome ||
      "",

    nomeFantasia:
      cliente.nomeFantasia ||
      "",

    cnpj:
      cliente.cnpj ||
      "",

    inscricaoEstadual:
      cliente.inscricaoEstadual ||
      "",

    indicadorIe:
      Number(cliente.indicadorIe || 9),

    email:
      cliente.email ||
      "",

    telefone:
      cliente.telefone ||
      cliente.whatsapp ||
      "",

    endereco: {
      cep:
        cliente.endereco?.cep ||
        "",

      logradouro:
        cliente.endereco?.logradouro ||
        "",

      numero:
        cliente.endereco?.numero ||
        "",

      complemento:
        cliente.endereco?.complemento ||
        "",

      bairro:
        cliente.endereco?.bairro ||
        "",

      cidade:
        cliente.endereco?.cidade ||
        cliente.cidade ||
        "",

      codigoMunicipioIbge:
        cliente.endereco?.codigoMunicipioIbge ||
        "",

      uf:
        cliente.endereco?.uf ||
        "PR",
    },
  });
}

  async function validarNfe() {
    if (!pedidoId) {
      setMensagem("Selecione um pedido antes de validar a NF-e.");
      return;
    }

    setCarregando(true);
    setMensagem("");
    setErros([]);
    setValidacao(null);

    try {
      const response = await api.post(`/nfe/validar/${pedidoId}`, {
        destinatario,
        formaPagamento: "17",
        descricaoPagamento: pedidoSelecionado?.pagamento || "PIX",
        consumidorFinal: true,
        indicadorPresenca: pedidoSelecionado?.tipo === "delivery" ? 2 : 1,
      });

      setValidacao(response.data.validacao || null);
      setMensagem(response.data.message || "Validação fiscal concluída.");
    } catch (error) {
      setMensagem(error.response?.data?.message || "Não foi possível validar a NF-e.");
      setErros(error.response?.data?.erros || []);
    } finally {
      setCarregando(false);
    }
  }

  async function processarNfe() {
    if (!pedidoId) {
      setMensagem("Selecione um pedido antes de emitir a NF-e.");
      return;
    }

    if (!validacao?.valido) {
      setMensagem("Valide o pedido antes de gerar e transmitir a NF-e.");
      return;
    }

    setCarregando(true);
    setMensagem("");
    setErros([]);

    try {
      const response = await api.post(`/nfe/processar/${pedidoId}`, {
        destinatario,
        formaPagamento: "17",
        descricaoPagamento: pedidoSelecionado?.pagamento || "PIX",
        consumidorFinal: true,
        indicadorPresenca: pedidoSelecionado?.tipo === "delivery" ? 2 : 1,
      });

      setMensagem(response.data.message || "NF-e processada.");
      await carregar();
    } catch (error) {
      setMensagem(error.response?.data?.message || "Não foi possível processar a NF-e.");
      setErros(error.response?.data?.erros || []);
    } finally {
      setCarregando(false);
    }
  }

  async function consultarStatusSefaz() {
    try {
      setCarregando(true);
      const ambiente = diagnostico?.ambiente || "homologacao";
      const response = await api.get(`/nfe/sefaz/status?ambiente=${ambiente}`);
      setStatusSefaz(response.data.status || null);
      setMensagem(response.data.status?.xMotivo || "Status da SEFAZ consultado.");
    } catch (error) {
      setStatusSefaz(null);
      setMensagem(error.response?.data?.message || "Não foi possível consultar o status da SEFAZ.");
    } finally {
      setCarregando(false);
    }
  }

  async function consultar(id) {
    try {
      setCarregando(true);
      const response = await api.get(`/nfe/consultar/${id}`);
      setMensagem(response.data.message || "Consulta realizada.");
      await carregar();
    } catch (error) {
      setMensagem(error.response?.data?.message || "Erro ao consultar a NF-e.");
    } finally {
      setCarregando(false);
    }
  }

  function abrir(path) {
    window.open(`${api.defaults.baseURL}${path}`, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="fiscal-card grande nfe-operacional">
      <div className="nfe-cabecalho">
        <div>
          <span className="nfe-etiqueta">NF-e modelo 55</span>
          <h2>Emissão para cliente CNPJ</h2>
          <p>
            Selecione o pedido, confira os dados do destinatário e processe geração,
            assinatura e transmissão em uma única ação.
          </p>
        </div>
        <div className={`nfe-prontidao ${diagnostico?.pronto ? "ok" : "pendente"}`}>
          {diagnostico?.pronto ? "Pronto para homologação" : "Há pendências fiscais"}
        </div>
      </div>

      {diagnostico && (
        <div className="nfe-diagnostico">
          <strong>Diagnóstico fiscal</strong>
          <span>Ambiente: {diagnostico.ambiente}</span>
          <span>Produtos: {diagnostico.produtos?.total || 0}</span>
          <span>Pendências: {diagnostico.pendencias?.length || 0}</span>
          <div className="nfe-diagnostico-acoes">
            <button type="button" className="btn-ver" onClick={carregar}>Atualizar diagnóstico</button>
            <button type="button" className="btn-ver" onClick={consultarStatusSefaz} disabled={carregando}>Testar SEFAZ</button>
          </div>
        </div>
      )}

      {statusSefaz && (
        <div className={`nfe-status-sefaz ${statusSefaz.cStat === "107" ? "ok" : "alerta"}`}>
          <strong>SEFAZ {statusSefaz.cStat === "107" ? "operacional" : "respondeu com alerta"}</strong>
          <span>cStat {statusSefaz.cStat || "-"} — {statusSefaz.xMotivo || "Sem mensagem"}</span>
          <small>Ambiente: {statusSefaz.ambiente || diagnostico?.ambiente || "-"} {statusSefaz.dhRecbto ? `• ${new Date(statusSefaz.dhRecbto).toLocaleString("pt-BR")}` : ""}</small>
        </div>
      )}

      {diagnostico?.pendencias?.length > 0 && (
        <div className="nfe-pendencias">
          {diagnostico.pendencias.map((item) => (
            <div key={`${item.categoria}-${item.nome}`}>
              <strong>{item.nome}</strong>
              <span>{item.mensagem}</span>
            </div>
          ))}
        </div>
      )}

      <div className="nfe-form-grid">
        <label className="nfe-campo nfe-campo-largo">
          <span>Pedido</span>
          <select
  value={pedidoId}
  onChange={(e) => selecionarPedido(e.target.value)}
>
            <option value="">Selecione um pedido</option>
            {pedidos.map((pedido) => (
              <option key={pedido._id} value={pedido._id}>
                #{pedido._id.slice(-6)} — {pedido.cliente} — {dinheiro(pedido.total)}
              </option>
            ))}
          </select>
        </label>

        <label className="nfe-campo nfe-campo-largo">
          <span>Razão social</span>
          <input value={destinatario.nomeRazaoSocial} onChange={(e) => atualizarDestinatario("nomeRazaoSocial", e.target.value)} />
        </label>
        <label className="nfe-campo">
          <span>CNPJ</span>
          <input value={destinatario.cnpj} onChange={(e) => atualizarDestinatario("cnpj", e.target.value)} />
        </label>
        <label className="nfe-campo">
          <span>Inscrição estadual</span>
          <input value={destinatario.inscricaoEstadual} onChange={(e) => atualizarDestinatario("inscricaoEstadual", e.target.value)} />
        </label>
        <label className="nfe-campo">
          <span>Indicador IE</span>
          <select value={destinatario.indicadorIe} onChange={(e) => atualizarDestinatario("indicadorIe", Number(e.target.value))}>
            <option value={1}>Contribuinte</option>
            <option value={2}>Contribuinte isento</option>
            <option value={9}>Não contribuinte</option>
          </select>
        </label>
        <label className="nfe-campo">
          <span>E-mail</span>
          <input type="email" value={destinatario.email} onChange={(e) => atualizarDestinatario("email", e.target.value)} />
        </label>
        <label className="nfe-campo">
          <span>CEP</span>
          <input value={destinatario.endereco.cep} onChange={(e) => atualizarEndereco("cep", e.target.value)} />
        </label>
        <label className="nfe-campo nfe-campo-largo">
          <span>Logradouro</span>
          <input value={destinatario.endereco.logradouro} onChange={(e) => atualizarEndereco("logradouro", e.target.value)} />
        </label>
        <label className="nfe-campo">
          <span>Número</span>
          <input value={destinatario.endereco.numero} onChange={(e) => atualizarEndereco("numero", e.target.value)} />
        </label>
        <label className="nfe-campo">
          <span>Bairro</span>
          <input value={destinatario.endereco.bairro} onChange={(e) => atualizarEndereco("bairro", e.target.value)} />
        </label>
        <label className="nfe-campo">
          <span>Cidade</span>
          <input value={destinatario.endereco.cidade} onChange={(e) => atualizarEndereco("cidade", e.target.value)} />
        </label>
        <label className="nfe-campo">
          <span>Código IBGE</span>
          <input value={destinatario.endereco.codigoMunicipioIbge} onChange={(e) => atualizarEndereco("codigoMunicipioIbge", e.target.value)} />
        </label>
        <label className="nfe-campo">
          <span>UF</span>
          <input maxLength={2} value={destinatario.endereco.uf} onChange={(e) => atualizarEndereco("uf", e.target.value.toUpperCase())} />
        </label>
      </div>

      <div className="nfe-acoes-emissao">
        <button className="btn-fiscal validar" type="button" onClick={validarNfe} disabled={carregando || !diagnostico?.pronto}>
          {carregando ? "Validando..." : "1. Validar pedido para NF-e"}
        </button>
        <button className="btn-fiscal salvar" type="button" onClick={processarNfe} disabled={carregando || !diagnostico?.pronto || !validacao?.valido}>
          {carregando ? "Processando NF-e..." : "2. Gerar, assinar e transmitir NF-e"}
        </button>
      </div>

      {validacao?.valido && (
        <div className={`nfe-validacao-resumo ${validacao.homologacao ? "homologacao" : "producao"}`}>
          <div className="nfe-validacao-topo">
            <div>
              <strong>Pré-validação concluída</strong>
              <span>{validacao.aviso}</span>
            </div>
            <b>{String(validacao.ambiente || "").toUpperCase()}</b>
          </div>
          <div className="nfe-validacao-grid">
            <div><span>Próxima numeração</span><strong>{validacao.proximoNumero}/{validacao.serie}</strong></div>
            <div><span>Emitente</span><strong>{validacao.emitente?.razaoSocial}</strong></div>
            <div><span>Destinatário</span><strong>{validacao.destinatario?.nomeRazaoSocial}</strong></div>
            <div><span>Itens</span><strong>{validacao.pedido?.quantidadeItens}</strong></div>
            <div><span>Total</span><strong>{dinheiro(validacao.totais?.valorTotal)}</strong></div>
            <div><span>Destino</span><strong>{validacao.emitente?.uf} → {validacao.destinatario?.uf}</strong></div>
          </div>
        </div>
      )}

      {mensagem && <div className="nfe-mensagem">{mensagem}</div>}
      {erros.length > 0 && (
        <div className="nfe-erros">
          {erros.map((erro, index) => <div key={`${erro.campo}-${index}`}>{erro.contexto ? `${erro.contexto}: ` : ""}{erro.mensagem}</div>)}
        </div>
      )}

      <div className="fiscal-table-wrap nfe-historico">
        <table>
          <thead>
            <tr><th>Número</th><th>Destinatário</th><th>Valor</th><th>Status</th><th>SEFAZ</th><th>Protocolo</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {nfes.map((nfe) => (
              <tr key={nfe._id}>
                <td>{nfe.numero}/{nfe.serie}</td>
                <td>{nfe.destinatario?.nomeRazaoSocial || "-"}</td>
                <td>{dinheiro(nfe.totais?.valorTotal)}</td>
                <td>{nfe.status}</td>
                <td>{nfe.cStat || "-"} {nfe.mensagemSefaz || ""}</td>
                <td>{nfe.protocolo || nfe.recibo || "-"}</td>
                <td className="acoes-nota">
                  {nfe.status === "processando" && <button className="btn-ver" onClick={() => consultar(nfe._id)}>Consultar</button>}
                  <button className="btn-ver" onClick={() => abrir(`/nfe/${nfe._id}/danfe`)}>DANFE</button>
                  <button className="btn-ver" onClick={() => abrir(`/nfe/${nfe._id}/download`)}>XML</button>
                </td>
              </tr>
            ))}
            {nfes.length === 0 && <tr><td colSpan="7">Nenhuma NF-e emitida.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default NfeOperacional;
