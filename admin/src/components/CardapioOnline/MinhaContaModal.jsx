import { useEffect, useState } from "react";
import { Clock3, Heart, LogOut, PackageCheck, UserRound, X } from "lucide-react";
import api from "../../services/api";

function statusLabel(pedido) {
  const status = pedido.statusProducao || pedido.status || "aguardando";
  const mapa = {
    aguardando: "Aguardando preparo",
    pendente: "Pedido recebido",
    producao: "Em produção",
    pronto: "Pronto",
    entregue: "Entregue",
    cancelado: "Cancelado",
  };
  return mapa[status] || status;
}

export default function MinhaContaModal({ aberto, onClose, sessao, onEntrar, onSair, favoritos }) {
  const [form, setForm] = useState({ nome: sessao?.nome || "", telefone: sessao?.telefone || "", email: sessao?.email || "" });
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [carteira, setCarteira] = useState(null);

  useEffect(() => {
    setForm({ nome: sessao?.nome || "", telefone: sessao?.telefone || "", email: sessao?.email || "" });
  }, [sessao]);

  useEffect(() => {
    if (!aberto || !sessao?.telefone) return;
    setCarregando(true);
    api.get("/pedidos/cardapio/historico", { params: { telefone: sessao.telefone } })
      .then((response) => setPedidos(response.data?.pedidos || []))
      .catch(() => setPedidos([]))
      .finally(() => setCarregando(false));
    api.get("/clube/carteira", { params: { telefone: sessao.telefone } }).then((r) => setCarteira(r.data?.carteira || null)).catch(() => setCarteira(null));
  }, [aberto, sessao?.telefone]);

  if (!aberto) return null;

  async function entrar(event) {
    event.preventDefault();
    setMensagem("");
    setCarregando(true);
    try {
      await onEntrar(form);
    } catch (error) {
      setMensagem(error.response?.data?.message || "Não foi possível acessar sua conta.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="co-account-overlay" role="dialog" aria-modal="true" aria-label="Minha conta">
      <div className="co-account-modal">
        <button className="co-account-close" type="button" onClick={onClose} aria-label="Fechar"><X /></button>

        {!sessao ? (
          <form className="co-account-login" onSubmit={entrar}>
            <div className="co-account-icon"><UserRound /></div>
            <span>Área do cliente</span>
            <h2>Entre de forma rápida</h2>
            <p>Use seu nome e WhatsApp para consultar pedidos e salvar favoritos.</p>
            <label>Nome</label>
            <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Seu nome" />
            <label>WhatsApp</label>
            <input required value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(44) 99999-9999" />
            <label>E-mail (opcional)</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@email.com" />
            {mensagem && <div className="co-account-error">{mensagem}</div>}
            <button className="co-account-submit" disabled={carregando}>{carregando ? "Acessando..." : "Acessar minha conta"}</button>
          </form>
        ) : (
          <div className="co-account-content">
            <div className="co-account-profile">
              <div className="co-account-avatar">{String(sessao.nome || "C").charAt(0).toUpperCase()}</div>
              <div><span>Olá,</span><h2>{sessao.nome}</h2><small>{sessao.telefone}</small></div>
              <button type="button" onClick={onSair}><LogOut size={17} /> Sair</button>
            </div>

            <div className="co-account-stats">
              <div><PackageCheck /><strong>{pedidos.length}</strong><span>Pedidos</span></div>
              <div><Heart /><strong>{favoritos.length}</strong><span>Favoritos</span></div>
            </div>

            {carteira && <section className="co-club-wallet">
              <div><span>{carteira.programa}</span><strong>{carteira.cliente.numeroAssociado}</strong><small>Nível {carteira.nivel?.nome || "Básico"}</small></div>
              <div className="co-club-balances"><p><b>{Math.round(carteira.pontos)}</b><span>pontos</span></p><p><b>R$ {Number(carteira.cashback||0).toFixed(2)}</b><span>cashback</span></p></div>
              {carteira.assinatura && <div className="co-club-subscription"><strong>{carteira.assinatura.plano?.nome}</strong><span>Assinatura ativa até {new Date(carteira.assinatura.vencimento).toLocaleDateString("pt-BR")}</span></div>}
              {carteira.proximoNivel && <footer>Faltam R$ {Number(carteira.proximoNivel.falta).toFixed(2)} para o nível {carteira.proximoNivel.nome}.</footer>}
            </section>}

            <section className="co-order-history">
              <div className="co-account-section-title"><Clock3 /><div><h3>Meus pedidos</h3><p>Acompanhe as compras feitas com seu WhatsApp.</p></div></div>
              {carregando ? <div className="co-account-empty">Carregando pedidos...</div> : pedidos.length === 0 ? (
                <div className="co-account-empty">Você ainda não possui pedidos registrados neste WhatsApp.</div>
              ) : pedidos.map((pedido) => (
                <article className="co-order-card" key={pedido._id}>
                  <div><strong>Pedido #{pedido.numeroPedido || String(pedido._id).slice(-6)}</strong><span>{new Date(pedido.createdAt).toLocaleDateString("pt-BR")}</span></div>
                  <div className="co-order-status">{statusLabel(pedido)}</div>
                  <p>{(pedido.produtos || []).map((item) => `${item.quantidade}x ${item.nome}`).join(", ")}</p>
                  <footer><strong>R$ {Number(pedido.total || 0).toFixed(2)}</strong><a href={`/tracking/${pedido._id}`}>Acompanhar</a></footer>
                </article>
              ))}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
