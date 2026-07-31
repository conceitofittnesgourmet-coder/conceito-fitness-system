import { useEffect, useMemo, useState } from "react";
import { FaBoxOpen, FaCheckCircle, FaEye, FaExclamationTriangle, FaSyncAlt, FaTag } from "react-icons/fa";
import api from "../services/api";

const dinheiro = (valor) => Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function IfoodCatalogoPanel({ configuracao, notificar }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [executando, setExecutando] = useState("");
  const [resultado, setResultado] = useState(null);

  const habilitado = Boolean(configuracao?.merchantId && configuracao?.ultimoTesteOk);
  const produtos = dados?.produtos || [];
  const totais = dados?.totais || {};
  const errosResultado = useMemo(() => resultado?.resumo?.erros || 0, [resultado]);

  async function carregar() {
    if (!habilitado) return;
    setCarregando(true);
    try {
      const response = await api.get("/ifood/catalogo/diagnostico");
      setDados(response.data?.resultado || null);
    } catch (error) {
      notificar?.("erro", error.response?.data?.message || "Falha ao carregar o catálogo.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [configuracao?.merchantId, configuracao?.ultimoTesteOk]);

  async function executar(tipo, produtoId = "") {
    setExecutando(`${tipo}:${produtoId}`);
    try {
      const endpoint = tipo === "simular" ? "/ifood/catalogo/simular" : "/ifood/catalogo/sincronizar";
      const response = await api.post(endpoint, { produtoId });
      setResultado(response.data?.resultado || null);
      notificar?.(response.data?.resultado?.resumo?.erros ? "erro" : "ok", response.data?.message || "Operação concluída.");
      await carregar();
    } catch (error) {
      notificar?.("erro", error.response?.data?.message || "Falha na sincronização do catálogo.");
    } finally {
      setExecutando("");
    }
  }

  async function alterarStatus(produto, disponivel) {
    setExecutando(`status:${produto.id}`);
    try {
      await api.patch(`/ifood/catalogo/produtos/${produto.id}/disponibilidade`, { status: disponivel ? "AVAILABLE" : "UNAVAILABLE" });
      notificar?.("ok", `${produto.nome} foi ${disponivel ? "ativado" : "pausado"} no iFood.`);
      await carregar();
    } catch (error) {
      notificar?.("erro", error.response?.data?.message || "Não foi possível alterar a disponibilidade.");
    } finally { setExecutando(""); }
  }

  if (!habilitado) {
    return <section className="ifood-card ifood-catalog-card"><div className="ifood-card-title"><FaTag/><div><h3>Catálogo iFood</h3><p>Valide a conexão e selecione a loja para liberar a sincronização.</p></div></div></section>;
  }

  return <section className="ifood-card ifood-catalog-card">
    <div className="ifood-catalog-head">
      <div className="ifood-card-title"><FaTag/><div><h3>Catálogo e produtos</h3><p>Espelhe categorias, produtos e personalizações cadastradas no ERP para o iFood.</p></div></div>
      <div className="ifood-catalog-buttons">
        <button className="secondary" onClick={()=>executar("simular")} disabled={Boolean(executando)}><FaEye/> Simular</button>
        <button className="primary" onClick={()=>executar("sincronizar")} disabled={Boolean(executando)}><FaSyncAlt/> Sincronizar tudo</button>
      </div>
    </div>

    <div className="ifood-metrics">
      <div><span>Catálogo</span><strong>{dados?.catalogo?.catalogId || configuracao.catalogId || "—"}</strong></div>
      <div><span>Produtos publicados</span><strong>{totais.produtosPublicados || 0}</strong></div>
      <div><span>Mapeamentos sincronizados</span><strong>{totais.sincronizados || 0}</strong></div>
      <div><span>Pendências</span><strong>{totais.erros || 0}</strong></div>
    </div>

    {resultado && <div className={`ifood-catalog-result ${errosResultado ? "erro" : "ok"}`}>
      {errosResultado ? <FaExclamationTriangle/> : <FaCheckCircle/>}
      <span>{resultado.modoSimulacao ? "Simulação" : "Sincronização"}: {resultado.resumo?.sucessos || 0} sucesso(s), {errosResultado} erro(s).</span>
    </div>}

    <div className="ifood-table-wrap">
      <table className="ifood-table ifood-catalog-table">
        <thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>ERP</th><th>Ações</th></tr></thead>
        <tbody>{carregando ? <tr><td colSpan="5">Carregando catálogo...</td></tr> : produtos.length ? produtos.map(produto => <tr key={produto.id}>
          <td><strong>{produto.nome}</strong><small>{produto.configuravel ? "Com opções personalizáveis" : "Produto simples"}</small></td>
          <td>{produto.categoria}</td>
          <td>{dinheiro(produto.preco)}</td>
          <td><span className={`ifood-event-status ${produto.disponivel ? "processado" : "erro"}`}>{produto.disponivel ? "Disponível" : "Indisponível"}</span></td>
          <td><div className="ifood-order-actions">
            <button onClick={()=>executar("sincronizar",produto.id)} disabled={Boolean(executando)}><FaSyncAlt/> Enviar</button>
            <button onClick={()=>alterarStatus(produto,!produto.disponivel)} disabled={Boolean(executando)}><FaBoxOpen/> {produto.disponivel ? "Pausar" : "Ativar"}</button>
          </div></td>
        </tr>) : <tr><td colSpan="5">Marque produtos no canal iFood para que apareçam aqui.</td></tr>}</tbody>
      </table>
    </div>
  </section>;
}
