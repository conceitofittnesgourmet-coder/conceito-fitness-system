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
  const [nfes, setNfes] = useState([]);
  const [diagnostico, setDiagnostico] = useState(null);
  const [pedidoId, setPedidoId] = useState("");
  const [destinatario, setDestinatario] = useState(destinatarioVazio);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erros, setErros] = useState([]);

  const pedidoSelecionado = useMemo(
    () => pedidos.find((pedido) => pedido._id === pedidoId),
    [pedidos, pedidoId]
  );

  async function carregar() {
    const resultados = await Promise.allSettled([
      api.get("/pedidos"),
      api.get("/nfe"),
      api.get("/nfe/diagnostico/status"),
    ]);

    if (resultados[0].status === "fulfilled") {
      setPedidos(resultados[0].value.data.pedidos || []);
    }
    if (resultados[1].status === "fulfilled") {
      setNfes(resultados[1].value.data.nfes || []);
    }
    if (resultados[2].status === "fulfilled") {
      setDiagnostico(resultados[2].value.data.diagnostico || null);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function atualizarEndereco(campo, valor) {
    setDestinatario((atual) => ({
      ...atual,
      endereco: { ...atual.endereco, [campo]: valor },
    }));
  }

  async function processarNfe() {
    if (!pedidoId) {
      setMensagem("Selecione um pedido antes de emitir a NF-e.");
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
          <button type="button" className="btn-ver" onClick={carregar}>Atualizar diagnóstico</button>
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
          <select value={pedidoId} onChange={(e) => setPedidoId(e.target.value)}>
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
          <input value={destinatario.nomeRazaoSocial} onChange={(e) => setDestinatario({ ...destinatario, nomeRazaoSocial: e.target.value })} />
        </label>
        <label className="nfe-campo">
          <span>CNPJ</span>
          <input value={destinatario.cnpj} onChange={(e) => setDestinatario({ ...destinatario, cnpj: e.target.value })} />
        </label>
        <label className="nfe-campo">
          <span>Inscrição estadual</span>
          <input value={destinatario.inscricaoEstadual} onChange={(e) => setDestinatario({ ...destinatario, inscricaoEstadual: e.target.value })} />
        </label>
        <label className="nfe-campo">
          <span>Indicador IE</span>
          <select value={destinatario.indicadorIe} onChange={(e) => setDestinatario({ ...destinatario, indicadorIe: Number(e.target.value) })}>
            <option value={1}>Contribuinte</option>
            <option value={2}>Contribuinte isento</option>
            <option value={9}>Não contribuinte</option>
          </select>
        </label>
        <label className="nfe-campo">
          <span>E-mail</span>
          <input type="email" value={destinatario.email} onChange={(e) => setDestinatario({ ...destinatario, email: e.target.value })} />
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

      <button className="btn-fiscal salvar" type="button" onClick={processarNfe} disabled={carregando || !diagnostico?.pronto}>
        {carregando ? "Processando NF-e..." : "Gerar, assinar e transmitir NF-e"}
      </button>

      {mensagem && <div className="nfe-mensagem">{mensagem}</div>}
      {erros.length > 0 && (
        <div className="nfe-erros">
          {erros.map((erro, index) => <div key={`${erro.campo}-${index}`}>{erro.contexto ? `${erro.contexto}: ` : ""}{erro.mensagem}</div>)}
        </div>
      )}

      <div className="fiscal-table-wrap nfe-historico">
        <table>
          <thead>
            <tr><th>Número</th><th>Destinatário</th><th>Valor</th><th>Status</th><th>SEFAZ</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {nfes.map((nfe) => (
              <tr key={nfe._id}>
                <td>{nfe.numero}/{nfe.serie}</td>
                <td>{nfe.destinatario?.nomeRazaoSocial || "-"}</td>
                <td>{dinheiro(nfe.totais?.valorTotal)}</td>
                <td>{nfe.status}</td>
                <td>{nfe.cStat || "-"} {nfe.mensagemSefaz || ""}</td>
                <td className="acoes-nota">
                  {nfe.status === "processando" && <button className="btn-ver" onClick={() => consultar(nfe._id)}>Consultar</button>}
                  <button className="btn-ver" onClick={() => abrir(`/nfe/${nfe._id}/danfe`)}>DANFE</button>
                  <button className="btn-ver" onClick={() => abrir(`/nfe/${nfe._id}/download`)}>XML</button>
                </td>
              </tr>
            ))}
            {nfes.length === 0 && <tr><td colSpan="6">Nenhuma NF-e emitida.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default NfeOperacional;
