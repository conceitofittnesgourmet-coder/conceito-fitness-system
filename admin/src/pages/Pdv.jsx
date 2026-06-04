import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Trash2,
  CreditCard,
  Wallet,
  QrCode,
  ShoppingCart,
  UtensilsCrossed,
  Users,
  Store,
  ArrowRight,
} from "lucide-react";

import api from "../services/api";
import socket from "../services/socket";
import "../styles/pdv.css";

export default function Pdv() {
  const [cart, setCart] = useState([]);
  const [pagamento, setPagamento] = useState("PIX");
  const [produtos, setProdutos] = useState([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [mesa, setMesa] = useState("Balcão");
  const [cliente, setCliente] = useState("Cliente Balcão");
  const [telefone, setTelefone] = useState("");
  const [observacao, setObservacao] = useState("");
  const [clientes, setClientes] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState("");

  async function carregarProdutos() {
    try {
      setLoadingProdutos(true);
      const response = await api.get("/produtos");
      setProdutos(response.data.produtos || []);
    } catch (error) {
      console.log("Erro ao carregar produtos:", error);
    } finally {
      setLoadingProdutos(false);
    }
  }

  async function carregarClientes() {
  try {
    const response = await api.get("/clientes");

    setClientes(response.data.clientes || []);
  } catch (error) {
    console.log("Erro ao carregar clientes:", error);
  }
}

 useEffect(() => {
  carregarProdutos();
  carregarClientes();

  socket.on("produto-criado", carregarProdutos);
  socket.on("produto-atualizado", carregarProdutos);
  socket.on("produto-deletado", carregarProdutos);

  return () => {
    socket.off("produto-criado", carregarProdutos);
    socket.off("produto-atualizado", carregarProdutos);
    socket.off("produto-deletado", carregarProdutos);
  };
}, []);

  function getImagemProduto(produto) {
  const baseURL = api.defaults.baseURL || "https://conceito-fitness-system.onrender.com";
  const backendURL = baseURL.replace("/api", "");

  const imagem =
    produto?.imagens?.[0]?.url ||
    produto?.imagens?.[0] ||
    produto?.imagem?.url ||
    produto?.imagem ||
    produto?.foto ||
    produto?.image ||
    produto?.urlImagem ||
    "";

  if (!imagem) {
    return "/sem-imagem.png";
  }

  if (typeof imagem === "object") {
    return imagem.url || "/sem-imagem.png";
  }

  if (imagem.startsWith("http")) {
    return imagem;
  }

  if (imagem.startsWith("/uploads")) {
    return `${backendURL}${imagem}`;
  }

  return `${backendURL}/uploads/${imagem}`;
}

  function adicionarProduto(produto) {
  const id = produto._id || produto.id;

  const existe = cart.find((item) => item.id === id);

  const produtoFormatado = {
    id,
    produtoId: produto._id || produto.id,
    nome: produto.nome,
    preco: Number(produto.preco || 0),
    imagem: getImagemProduto(produto),
    quantidade: 1,
  };

  if (existe) {
    setCart(
      cart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantidade: Number(item.quantidade || 1) + 1,
            }
          : item
      )
    );
  } else {
    setCart([...cart, produtoFormatado]);
  }
}

  function removerProduto(id) {
    setCart(cart.filter((item) => item.id !== id));
  }

  function limparPedido() {
    setCart([]);
  }

  const subtotalPedido = cart.reduce((acc, item) => {
  const preco = Number(item.preco || 0);
  const quantidade = Number(item.quantidade || 1);

  return acc + preco * quantidade;
}, 0);

const taxaEntregaPedido =
  mesa === "Delivery" && cart.length > 0 ? 6 : 0;

const descontoPedido = 0;

const totalPedido =
  subtotalPedido + taxaEntregaPedido - descontoPedido;

   async function finalizarPedido() {
  try {
    const caixaAberto = localStorage.getItem("caixaAberto") === "true";

if (!caixaAberto) {
  alert("O caixa está fechado. Abra o caixa antes de finalizar vendas.");
  return;
}

    if (cart.length === 0) {
      alert("Adicione produtos no pedido.");
      return;
    }

    const novoPedido = {
      cliente,

      telefone,

      mesa,

      observacao,

      tipo:
        mesa === "Delivery"
          ? "delivery"
          : mesa === "Retirada"
          ? "retirada"
          : "balcao",

      origem: "PDV",

      status: "pendente",

      pagamento,

      produtos: cart.map((item) => ({
  produtoId: item.produtoId,
  nome: item.nome,
  quantidade: Number(item.quantidade || 1),
  preco: Number(item.preco || 0),
  subtotal: Number(item.preco || 0) * Number(item.quantidade || 1),
  imagem: item.imagem,
})),

      subtotal: subtotalPedido,
taxaEntrega: taxaEntregaPedido,
desconto: descontoPedido,
total: totalPedido,
    };

    const response = await api.post("/pedidos", novoPedido);

const pedidoCriado = response.data.pedido || response.data;

window.open(`/cupom/${pedidoCriado._id}`, "_blank");

    alert("Pedido realizado com sucesso!");

    setCart([]);

    setCliente("Cliente Balcão");

    setTelefone("");

    setObservacao("");

    setMesa("Balcão");

  } catch (error) {
    console.log(error);

    alert("Erro ao finalizar pedido.");
  }
}

  return (
    <div className="pdv-page">
      <aside className="pdv-sidebar-premium">
        <div className="pdv-brand">
          <div className="pdv-brand-icon">
            <UtensilsCrossed />
          </div>

          <div>
            <h2>CONCEITO</h2>
            <span>FITNESS GOURMET</span>
          </div>
        </div>

        <nav className="pdv-nav">
          <Link to="/dashboard">Painel</Link>
          <Link className="active" to="/pdv">PDV</Link>
          <Link to="/produtos">Produtos</Link>
          <Link to="/pedidos">Pedidos</Link>
          <Link to="/cozinha">Cozinha</Link>
          <Link to="/entregador">Entregas</Link>
          <Link to="/clientes">Clientes</Link>
          <Link to="/financeiro">Financeiro</Link>
          <Link to="/caixa">Caixa</Link>
          <Link to="/analytics">Análise</Link>
        </nav>

        <div className="pdv-clube-box">
          <strong>👑 Clube Conceito</strong>
          <span>Clube de Benefícios</span>
          <p>Aumente suas vendas com benefícios exclusivos.</p>
          <button>Gerenciar Clube</button>
        </div>

        <div className="pdv-user-box">
          <div>●</div>
          <span>Administrador</span>
          <strong>Online</strong>
        </div>
      </aside>

      <main className="pdv-main-premium">
        <header className="pdv-header-premium">
          <div className="pdv-title">
            <button className="menu-button">☰</button>

            <div>
              <h1>PDV - Ponto de Venda</h1>
              <p>Faça vendas de forma rápida e eficiente</p>
            </div>
          </div>

          <div className="pdv-header-actions">
            <button>
              <Store size={18} />
              Mesa/Comanda
            </button>

            <div className="pdv-search-premium">
              <Search size={18} />
              <input placeholder="Buscar produto..." />
              <span>F2</span>
            </div>

            <button>
              <Users size={18} />
              Clientes
              <span>F3</span>
            </button>
          </div>
        </header>

        <section className="pdv-workspace">
          <div className="pdv-products-panel">
            <div className="pdv-categories-premium">
              <button className="active">Todos</button>
              <button>Bolos e Tortas</button>
              <button>Sobremesas</button>
              <button>Salgados</button>
              <button>Bebidas</button>
              <button>Cafés</button>
              <button>Combos</button>
              <button>Outros</button>
            </div>

            <div className="pdv-products-grid">
              {loadingProdutos && (
                <div className="pdv-loading-produtos">
                  Carregando produtos...
                </div>
              )}

              {!loadingProdutos &&
                produtos.map((produto) => (
                  <div className="pdv-product-card" key={produto._id || produto.id}>
                    <div className="pdv-product-img">
                      <img
                    src={getImagemProduto(produto)}
                      alt={produto.nome}
                        onError={(e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = "/sem-imagem.png";
}}
/>
                      {produto.destaque && (
                        <span className="pdv-tag">Destaque</span>
                      )}
                    </div>

                    <div className="pdv-product-info">
                      <h3>{produto.nome}</h3>

                      <div>
                        <strong>
                          R$ {Number(produto.preco || 0).toFixed(2)}
                        </strong>

                      <small className="pdv-estoque">
  Estoque: {Number(produto.estoque || 0)}
</small>

                        <button
  disabled={Number(produto.estoque || 0) <= 0}
  onClick={() => adicionarProduto(produto)}
>
  <Plus size={20} />
</button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <button className="carregar-produtos">
              Carregar mais produtos ↓
            </button>
          </div>

          <aside className="pdv-cart-premium">
            <div className="pdv-cart-top">
              <div>
                <h2>Pedido Atual</h2>
                <select value={mesa} onChange={(e) => setMesa(e.target.value)}>
  <option>Balcão</option>
  <option>Mesa 01</option>
  <option>Mesa 02</option>
  <option>Mesa 03</option>
  <option>Mesa 04</option>
  <option>Mesa 05</option>
  <option>Mesa 06</option>
  <option>Mesa 07</option>
  <option>Mesa 08</option>
  <option>Mesa 09</option>
  <option>Mesa 10</option>
  <option>Delivery</option>
  <option>Retirada</option>
</select>
              </div>

              <button onClick={limparPedido}>
                <Trash2 size={16} />
                Limpar
              </button>
            </div>

            <div className="pdv-cart-list">
              {cart.length === 0 && (
                <div className="carrinho-vazio">
                  <ShoppingCart size={34} />
                  <p>Nenhum produto adicionado</p>
                </div>
              )}

              {cart.map((item) => (
                <div className="pdv-cart-row" key={item.id}>
                  <img
  src={item.imagem}
  alt={item.nome}
  onError={(e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = "/sem-imagem.png";
}}
/>

                  <div className="cart-product-name">
                    <strong>{item.quantidade}x</strong>
                    <span>{item.nome}</span>
                  </div>

                  <small>
  R$ {Number(item.preco || 0).toFixed(2)}
</small>

<strong>
  R$ {(Number(item.preco || 0) * Number(item.quantidade || 1)).toFixed(2)}
</strong>

                  <button onClick={() => removerProduto(item.id)}>×</button>
                </div>
              ))}
            </div>

            <div className="pdv-cliente-box">

  <input
  placeholder="Buscar cliente cadastrado"
  value={buscaCliente}
  onChange={(e) => setBuscaCliente(e.target.value)}
/>

{buscaCliente && (
  <div style={{ background: "#fff", border: "1px solid #ddd", padding: 8 }}>
    {clientes
      .filter((c) =>
        c.nome?.toLowerCase().includes(buscaCliente.toLowerCase()) ||
        c.telefone?.includes(buscaCliente)
      )
      .slice(0, 5)
      .map((c) => (
        <button
          key={c._id}
          type="button"
          onClick={() => {
            setCliente(c.nome);
            setTelefone(c.telefone);
            setBuscaCliente("");
          }}
          style={{
            display: "block",
            width: "100%",
            padding: 8,
            textAlign: "left",
            border: "none",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {c.nome} - {c.telefone}
        </button>
      ))}
  </div>
)}

  <input
    placeholder="Nome do cliente"
    value={cliente}
    onChange={(e) => setCliente(e.target.value)}
  />

  <input
    placeholder="Telefone / WhatsApp"
    value={telefone}
    onChange={(e) => setTelefone(e.target.value)}
  />

  <textarea
    placeholder="+ Observação do pedido"
    value={observacao}
    onChange={(e) => setObservacao(e.target.value)}
  />
 </div>

             <div className="pdv-total-box">
              <div>
                <span>Subtotal</span>
                <strong>R$ {subtotalPedido.toFixed(2)}</strong>
             </div> 
            <strong>
  R$ {cart.reduce((acc, item) => acc + Number(item.preco || 0) * Number(item.quantidade || 1), 0).toFixed(2)}
</strong>
              <div>
                <span>Taxa de entrega</span>
                <strong>R$ {taxaEntregaPedido.toFixed(2)}</strong>
              </div>

              <div>
                <span>Desconto</span>
                <strong className="desconto">- R$ {descontoPedido.toFixed(2)}</strong>
              </div>

              <div className="total-final">
                <span>Total</span>
                <strong>
  R$ {(
    cart.reduce((acc, item) => acc + Number(item.preco || 0) * Number(item.quantidade || 1), 0) +
    (mesa === "Delivery" && cart.length > 0 ? 6 : 0)
  ).toFixed(2)}
</strong>
              </div>
            </div>

            <div className="pagamento-title">Forma de Pagamento</div>

            <div className="payment-grid">
              <button
                className={pagamento === "PIX" ? "active" : ""}
                onClick={() => setPagamento("PIX")}
              >
                <QrCode />
                PIX
              </button>

              <button
                className={pagamento === "CREDITO" ? "active" : ""}
                onClick={() => setPagamento("CREDITO")}
              >
                <CreditCard />
                Cartão Crédito
              </button>

              <button
                className={pagamento === "DEBITO" ? "active" : ""}
                onClick={() => setPagamento("DEBITO")}
              >
                <CreditCard />
                Cartão Débito
              </button>

              <button
                className={pagamento === "DINHEIRO" ? "active" : ""}
                onClick={() => setPagamento("DINHEIRO")}
              >
                <Wallet />
                Dinheiro
              </button>
            </div>

            <button
  className="finalizar-pedido"
  onClick={finalizarPedido}
>
  Finalizar Pedido
  <ArrowRight size={22} />
</button>

          </aside>
        </section>

        <section className="pdv-bottom-stats">
          <div className="bottom-card">
            <h4>Pedidos Hoje</h4>
            <strong>24</strong>
            <span>+18% vs ontem</span>
          </div>

          <div className="bottom-card">
            <h4>Faturamento Hoje</h4>
            <strong>R$ 1.280,50</strong>
            <span>+24% vs ontem</span>
          </div>

          <div className="bottom-card">
            <h4>Ticket Médio</h4>
            <strong>R$ 53,35</strong>
            <span>+8% vs ontem</span>
          </div>

          <div className="bottom-card">
            <h4>Clientes Ativos</h4>
            <strong>16</strong>
            <span>+14% vs ontem</span>
          </div>

          <div className="bottom-card status-card">
            <h4>Status do Sistema</h4>
            <strong>Online</strong>
            <span>Sincronizado</span>
          </div>
        </section>
      </main>
    </div>
  );
}