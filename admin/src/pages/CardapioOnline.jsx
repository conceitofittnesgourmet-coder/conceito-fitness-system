import { useEffect, useRef, useState } from "react";
import {
  Search,
  Plus,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Star,
  Coffee,
  CakeSlice,
  CupSoda,
  Gift,
  Leaf,
  ChefHat,
  Clock,
  Scale,
  Flame,
  MessageCircle,
} from "lucide-react";

import api from "../services/api";
import socket from "../services/socket";
import "../styles/CardapioOnline.css";

function CardapioOnline() {
  const WHATSAPP_LOJA = "5544991288775";

  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todos");

  const [cliente, setCliente] = useState({
    nome: "",
    telefone: "",
    entrega: "",
    observacao: "",
  });

  const destaquesRef = useRef(null);
const combosRef = useRef(null);
const novidadesRef = useRef(null);
const duvidasRef = useRef(null);

function irPara(ref) {
  ref.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function filtrarCategoria(cat) {
  setCategoria(cat);
  setTimeout(() => {
    destaquesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 100);
}

  async function carregarProdutos() {
    try {
      const response = await api.get("/produtos");
      setProdutos(response.data.produtos || []);
    } catch (error) {
      console.log("Erro ao carregar cardápio online:", error);
    }
  }

  useEffect(() => {
    carregarProdutos();

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
    const baseURL = api.defaults.baseURL || "http://localhost:5000/api";
    const backendURL = baseURL.replace("/api", "");

    const imagem =
      produto?.imagens?.[0]?.url ||
      produto?.imagens?.[0] ||
      produto?.imagem?.url ||
      produto?.imagem ||
      produto?.foto ||
      produto?.image ||
      "";

    if (!imagem) return "/sem-imagem.png";
    if (typeof imagem === "object") return imagem.url || "/sem-imagem.png";
    if (imagem.startsWith("http")) return imagem;
    if (imagem.startsWith("/uploads")) return `${backendURL}${imagem}`;
    return `${backendURL}/uploads/${imagem}`;
  }

  function adicionarProduto(produto) {
    const id = produto._id || produto.id;
    const existe = carrinho.find((item) => item.id === id);

    if (existe) {
      setCarrinho(
        carrinho.map((item) =>
          item.id === id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      );
    } else {
      setCarrinho([
        ...carrinho,
        {
          id,
          nome: produto.nome,
          preco: Number(produto.preco || 0),
          imagem: getImagemProduto(produto),
          quantidade: 1,
        },
      ]);
    }
  }

  function alterarQuantidade(id, quantidade) {
    if (quantidade <= 0) {
      setCarrinho(carrinho.filter((item) => item.id !== id));
      return;
    }

    setCarrinho(
      carrinho.map((item) =>
        item.id === id ? { ...item, quantidade } : item
      )
    );
  }

  const categorias = [
    { nome: "Todos", icon: <Gift /> },
    { nome: "CAFÉS", icon: <Coffee /> },
    { nome: "Bebidas", icon: <CupSoda /> },
    { nome: "BOLOS", icon: <CakeSlice /> },
    { nome: "DOCES", icon: <CakeSlice /> },
    { nome: "Salgados", icon: <ChefHat /> },
    { nome: "Gourmet", icon: <Star /> },
  ];

  const produtosFiltrados = produtos.filter((produto) => {
    const matchBusca = produto.nome
      ?.toLowerCase()
      .includes(busca.toLowerCase());

    const matchCategoria =
      categoria === "Todos" ||
      String(produto.categoria || "").toLowerCase() ===
        categoria.toLowerCase();

    return matchBusca && matchCategoria && produto.ativo !== false;
  });

  const destaques = produtosFiltrados.slice(0, 3);
  const combos = produtosFiltrados.slice(3, 6);
  const novidades = produtosFiltrados.slice(0, 5);

  const total = carrinho.reduce(
    (acc, item) => acc + item.preco * item.quantidade,
    0
  );

  function finalizarWhatsApp() {
    if (carrinho.length === 0) {
      alert("Adicione pelo menos um produto ao pedido.");
      return;
    }

    if (!cliente.nome || !cliente.telefone) {
      alert("Preencha seu nome e WhatsApp.");
      return;
    }

    const itens = carrinho
      .map(
        (item) =>
          `• ${item.nome} x${item.quantidade} - R$ ${(
            item.preco * item.quantidade
          ).toFixed(2)}`
      )
      .join("\n");

    const mensagem = `
Olá! Quero fazer um pedido pelo cardápio online da Conceito Fitness Gourmet.

🛒 *Pedido:*
${itens}

💰 *Total:* R$ ${total.toFixed(2)}

👤 *Cliente:* ${cliente.nome}
📱 *WhatsApp:* ${cliente.telefone}
📍 *Entrega/Retirada:* ${cliente.entrega || "Não informado"}
📝 *Observação:* ${cliente.observacao || "Nenhuma"}

Aguardo confirmação.
`;

    window.open(
      `https://wa.me/${WHATSAPP_LOJA}?text=${encodeURIComponent(mensagem)}`,
      "_blank"
    );
  }

  function ProdutoCard({ produto, badge }) {
    const restricoes = String(produto.restricoes || "")
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    return (
      <article className="co-product-card">
        <div className="co-product-image">
          {badge && <span className="co-badge">{badge}</span>}

          <img
            src={getImagemProduto(produto)}
            alt={produto.nome}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/sem-imagem.png";
            }}
          />
        </div>

        <div className="co-product-body">
          <h3>{produto.nome}</h3>
          <p>{produto.descricao || "Produto especial da Conceito."}</p>

          <div className="co-tags">
            {restricoes.slice(0, 3).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <div className="co-meta">
            {produto.tempoPreparo && (
              <small>
                <Clock size={13} /> {produto.tempoPreparo} min
              </small>
            )}

            {produto.peso && (
              <small>
                <Scale size={13} /> {produto.peso}
              </small>
            )}
          </div>

          <div className="co-product-footer">
            <strong>R$ {Number(produto.preco || 0).toFixed(2)}</strong>

            <button
              disabled={Number(produto.estoque || 0) <= 0}
              onClick={() => adicionarProduto(produto)}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="co-page">
      <header className="co-header">
        <div className="co-logo">
          <div className="co-logo-mark">C</div>
          <div>
            <strong>CONCEITO</strong>
            <span>FITNESS GOURMET</span>
          </div>
        </div>

        <nav className="co-nav">
  <button onClick={() => irPara(destaquesRef)} className="active">
    Cardápio
  </button>

  <button onClick={() => irPara(combosRef)}>
    Combos
  </button>

  <button onClick={() => irPara(novidadesRef)}>
    Novidades
  </button>

  <button onClick={() => filtrarCategoria("Bebidas")}>
    Bebidas
  </button>

  <button onClick={() => filtrarCategoria("DOCES")}>
    Doces
  </button>

  <button onClick={() => irPara(duvidasRef)}>
    Dúvidas
  </button>
</nav>

        <a
          className="co-whatsapp-top"
          href={`https://wa.me/${WHATSAPP_LOJA}`}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={22} />
          <div>
            <strong>Atendimento via WhatsApp</strong>
            <span>Fale conosco</span>
          </div>
        </a>
      </header>

      <section className="co-hero">
        <div className="co-hero-text">
          <h1>
            Alimentação que <span>transforma.</span>
          </h1>

          <p>
            Saudável, gourmet e feita com ingredientes selecionados para o seu
            melhor.
          </p>

          <div className="co-hero-benefits">
            <div>
              <Leaf />
              <span>Ingredientes</span>
              <strong>Seleção Premium</strong>
            </div>

            <div>
              <ChefHat />
              <span>Receitas</span>
              <strong>Exclusivas</strong>
            </div>

            <div>
              <Flame />
              <span>Preparo</span>
              <strong>Rápido</strong>
            </div>
          </div>
        </div>

        <div className="co-hero-image">
          <div className="co-love-seal">
            FEITO COM
            <strong>AMOR</strong>
            E PROPÓSITO
          </div>
        </div>
      </section>

      <main className="co-main">
        <section className="co-content">
          <div className="co-filter-card">
            <div className="co-search">
              <input
                placeholder="Buscar produto..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <button>
                <Search size={20} />
              </button>
            </div>

            <div className="co-category-grid">
              {categorias.map((cat) => (
                <button
                  key={cat.nome}
                  className={categoria === cat.nome ? "active" : ""}
                  onClick={() => filtrarCategoria(cat.nome)}
                >
                  {cat.icon}
                  <span>{cat.nome}</span>
                </button>
              ))}
            </div>
          </div>

          <section className="co-section" ref={destaquesRef}>
            <div className="co-section-title">
              <div>
                <h2>
                  <Flame /> Destaques da Casa
                </h2>
                <p>Os queridinhos que todo mundo ama</p>
              </div>

              <button onClick={() => filtrarCategoria("Todos")}>
  Ver todos
</button>
            </div>

            <div className="co-products-grid">
              {destaques.map((produto, index) => (
                <ProdutoCard
                  key={produto._id || produto.id}
                  produto={produto}
                  badge={
                    index === 0 ? "MAIS PEDIDO" : index === 1 ? "EXCLUSIVO" : "FIT"
                  }
                />
              ))}
            </div>
          </section>

          <section className="co-section" ref={combosRef}>
            <div className="co-section-title">
              <div>
                <h2>
                  <Gift /> Combos Especiais
                </h2>
                <p>Mais sabor e economia para o seu dia</p>
              </div>

              <button onClick={() => irPara(combosRef)}>
  Ver todos
</button>
            </div>

            <div className="co-products-grid">
              {combos.map((produto) => (
                <ProdutoCard
                  key={produto._id || produto.id}
                  produto={produto}
                  badge="DESCONTO 10%"
                />
              ))}
            </div>
          </section>

          <section className="co-section" ref={novidadesRef}>
            <div className="co-section-title">
              <div>
                <h2>
                  <Star /> Novidades do Cardápio
                </h2>
                <p>Experimente o que acabou de chegar</p>
              </div>

              <button onClick={() => irPara(novidadesRef)}>
  Ver todos
</button>
            </div>

            <div className="co-news-row">
              {novidades.map((produto) => (
                <div className="co-news-card" key={produto._id || produto.id}>
                  <span>NOVO</span>
                  <img src={getImagemProduto(produto)} alt={produto.nome} />
                  <strong>{produto.nome}</strong>
                  <small>R$ {Number(produto.preco || 0).toFixed(2)}</small>
                </div>
              ))}
            </div>
          </section>
        </section>

        <aside className="co-cart">
          <h2>
            <ShoppingBag size={22} /> Seu Pedido
          </h2>

          <p className="co-cart-sub">Entrega ou Retirada</p>

          {carrinho.length === 0 ? (
            <div className="co-empty-cart">
              <ShoppingBag />
              <strong>Nenhum produto adicionado ainda.</strong>
              <span>Adicione itens deliciosos ao seu pedido!</span>
            </div>
          ) : (
            <div className="co-cart-list">
              {carrinho.map((item) => (
                <div className="co-cart-item" key={item.id}>
                  <img src={item.imagem} alt={item.nome} />

                  <div>
                    <strong>{item.nome}</strong>
                    <span>R$ {item.preco.toFixed(2)}</span>

                    <div className="co-qty">
                      <button
                        onClick={() =>
                          alterarQuantidade(item.id, item.quantidade - 1)
                        }
                      >
                        -
                      </button>

                      <span>{item.quantidade}</span>

                      <button
                        onClick={() =>
                          alterarQuantidade(item.id, item.quantidade + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="co-client-form">
            <label>Seu nome</label>
            <input
              placeholder="Digite seu nome"
              value={cliente.nome}
              onChange={(e) =>
                setCliente({ ...cliente, nome: e.target.value })
              }
            />

            <label>WhatsApp</label>
            <input
              placeholder="(11) 99999-9999"
              value={cliente.telefone}
              onChange={(e) =>
                setCliente({ ...cliente, telefone: e.target.value })
              }
            />

            <label>Entrega ou Retirada</label>
            <select
              value={cliente.entrega}
              onChange={(e) =>
                setCliente({ ...cliente, entrega: e.target.value })
              }
            >
              <option value="">Selecione</option>
              <option value="Retirada no balcão">Retirada no balcão</option>
              <option value="Delivery">Delivery</option>
            </select>

            <label>Observação (opcional)</label>
            <textarea
              placeholder="Alguma observação?"
              value={cliente.observacao}
              onChange={(e) =>
                setCliente({ ...cliente, observacao: e.target.value })
              }
            />
          </div>

          <div className="co-total">
            <span>Total</span>
            <strong>R$ {total.toFixed(2)}</strong>
          </div>

          <button className="co-finish" onClick={finalizarWhatsApp}>
            <MessageCircle size={20} />
            Finalizar pedido via WhatsApp
          </button>

          <div className="co-safe">
            <ShieldCheck />
            <div>
              <strong>Compra 100% Segura</strong>
              <span>Seus dados protegidos e pedido seguro.</span>
            </div>
          </div>
        </aside>
      </main>

<section className="co-duvidas" ref={duvidasRef}>
  <h2>Dúvidas Frequentes</h2>

  <div className="co-duvidas-grid">
    <div>
      <strong>Como faço meu pedido?</strong>
      <p>Escolha os produtos, preencha seus dados e finalize pelo WhatsApp.</p>
    </div>

    <div>
      <strong>O pagamento é online?</strong>
      <p>Não. A confirmação e o pagamento são combinados diretamente pelo WhatsApp.</p>
    </div>

    <div>
      <strong>Tem retirada no balcão?</strong>
      <p>Sim. Você pode escolher retirada ou delivery no campo do pedido.</p>
    </div>
  </div>
</section>

      <footer className="co-footer">
        <div>
          <Leaf />
          <strong>Ingredientes Selecionados</strong>
          <span>Sempre frescos e de alta qualidade</span>
        </div>

        <div>
          <ChefHat />
          <strong>Receitas Exclusivas</strong>
          <span>Desenvolvidas pela nossa equipe</span>
        </div>

        <div>
          <Truck />
          <strong>Entrega Rápida</strong>
          <span>Seu pedido com agilidade</span>
        </div>

        <div>
          <ShieldCheck />
          <strong>Satisfação Garantida</strong>
          <span>Atendimento com excelência</span>
        </div>
      </footer>
    </div>
  );
}

export default CardapioOnline;