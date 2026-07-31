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
  Menu,
  X,
  Heart,
  Sparkles,
  UserRound,
  SlidersHorizontal,
  Trash2,
  Pencil,
  UtensilsCrossed,
  Store,
  MapPin,
} from "lucide-react";

import api from "../services/api";
import socket from "../services/socket";
import "../styles/CardapioOnline.css";
import ProdutoModal from "../components/CardapioOnline/ProdutoModal";
import MinhaContaModal from "../components/CardapioOnline/MinhaContaModal";

function CardapioOnline() {
  const WHATSAPP_LOJA = "5544991288775";

  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState(["Todos"]);
  const [carrinho, setCarrinho] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("conceito-cardapio-carrinho") || "[]");
    } catch {
      return [];
    }
  });
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [filtroDietario, setFiltroDietario] = useState("Todos");
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [frete, setFrete] = useState(0);
  const [distanciaKm, setDistanciaKm] = useState(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [itemEmEdicao, setItemEmEdicao] = useState(null);
  const [contaAberta, setContaAberta] = useState(false);
  const [sessaoCliente, setSessaoCliente] = useState(() => {
    try { return JSON.parse(localStorage.getItem("conceito-cardapio-sessao") || "null"); } catch { return null; }
  });
  const [favoritos, setFavoritos] = useState(() => {
    try { return JSON.parse(localStorage.getItem("conceito-cardapio-favoritos") || "[]"); } catch { return []; }
  });
  const [quantidadeModal, setQuantidadeModal] = useState(1);
  const [cliente, setCliente] = useState(() => {
    try {
      return {
        nome: "",
        telefone: "",
        entrega: "",
        endereco: "",
        referencia: "",
        observacao: "",
        ...(JSON.parse(localStorage.getItem("conceito-cardapio-cliente") || "{}")),
      };
    } catch {
      return { nome: "", telefone: "", entrega: "", endereco: "", referencia: "", observacao: "" };
    }
  });
const [gruposComponentes, setGruposComponentes] = useState([]);
const [opcoesComponentes, setOpcoesComponentes] = useState([]);

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
    setCarregando(true);
    setErroCarregamento("");
    const [produtosRes, gruposRes, opcoesRes] = await Promise.all([
      api.get("/produtos/cardapio"),
      api.get("/grupos-componentes"),
      api.get("/opcoes-componentes"),
    ]);

    const lista = produtosRes.data.produtos || [];

    console.log("PRODUTOS CARDAPIO:", lista);
    console.log("PRODUTO COMPLETO:", JSON.stringify(lista[0], null, 2));

    setProdutos(lista);
    setCategorias([
    "Todos",
    ...(produtosRes.data.categorias || [])
]);
    setGruposComponentes(gruposRes.data.grupos || []);
    setOpcoesComponentes(opcoesRes.data.opcoes || []);
  } catch (error) {
    console.log("Erro ao carregar cardápio online:", error);
    setErroCarregamento("Não foi possível carregar o cardápio agora. Tente novamente em instantes.");
  } finally {
    setCarregando(false);
  }
}

  useEffect(() => {
    localStorage.setItem("conceito-cardapio-carrinho", JSON.stringify(carrinho));
  }, [carrinho]);

  useEffect(() => {
    localStorage.setItem("conceito-cardapio-cliente", JSON.stringify(cliente));
  }, [cliente]);

  useEffect(() => {
    localStorage.setItem("conceito-cardapio-favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  useEffect(() => {
    const mesa = new URLSearchParams(window.location.search).get("mesa");
    if (mesa) {
      setCliente((atual) => ({ ...atual, entrega: "Consumo no local", mesa }));
    }
  }, []);

  useEffect(() => {
    carregarProdutos();

    const atualizarCardapio = () => carregarProdutos();
    socket.on("produto-criado", atualizarCardapio);
    socket.on("produto-atualizado", atualizarCardapio);
    socket.on("produto-publicacao-atualizada", atualizarCardapio);

    return () => {
      socket.off("produto-criado", atualizarCardapio);
      socket.off("produto-atualizado", atualizarCardapio);
      socket.off("produto-publicacao-atualizada", atualizarCardapio);
    };
  }, []);

  function abrirProduto(produto) {
    setItemEmEdicao(null);
    setProdutoSelecionado(produto);
    setQuantidadeModal(1);
  }

  function editarItemCarrinho(item) {
    const produto = produtos.find(
      (p) => String(p._id || p.id) === String(item.id)
    );

    if (!produto) {
      alert("Este produto não está mais disponível no cardápio.");
      return;
    }

    setItemEmEdicao(item);
    setProdutoSelecionado(produto);
    setQuantidadeModal(Number(item.quantidade || 1));
  }

  function corrigirUrlImagem(valor) {
  const backendURL = "https://conceito-fitness-system.onrender.com";

  if (!valor) return "/sem-imagem.png";

  let url = "";

  if (typeof valor === "object") {
    url =
      valor.url ||
      valor.secure_url ||
      valor.path ||
      valor.filename ||
      valor.name ||
      "";
  } else {
    url = String(valor);
  }

  url = url.trim().replaceAll("\\", "/");

  if (!url) return "/sem-imagem.png";

  if (url.includes("res.cloudinary.com")) {
    const parte = url.substring(url.indexOf("res.cloudinary.com"));
    return `https://${parte}`;
  }

  url = url
    .replace("https//", "https://")
    .replace("http//", "http://")
    .replace("https:/", "https://")
    .replace("http:/", "http://");

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("/uploads")) {
    return `${backendURL}${url}`;
  }

  if (url.startsWith("uploads")) {
    return `${backendURL}/${url}`;
  }

  return `${backendURL}/uploads/${url}`;
}

  function getImagemProduto(produto) {
  const possiveisImagens = [
    produto?.imagens?.[0]?.url,
    produto?.imagens?.[0]?.secure_url,
    produto?.imagens?.[0]?.path,
    produto?.imagens?.[0]?.filename,
    produto?.imagens?.[0]?.name,
    produto?.imagens?.[0],
    produto?.imagem?.url,
    produto?.imagem?.secure_url,
    produto?.imagem?.path,
    produto?.imagem?.filename,
    produto?.imagem,
    produto?.foto,
    produto?.image,
    produto?.urlImagem,
    produto?.imagemUrl,
    produto?.imageUrl,
    produto?.fotoUrl,
    produto?.thumbnail,
  ];

  const imagemValida = possiveisImagens.find(Boolean);

  return corrigirUrlImagem(imagemValida);
}

  function adicionarProduto(produto, configuracao = {}) {
    const id = produto._id || produto.id;
    const selecoes = configuracao.selecoes || {};
    const configuracoes = configuracao.configuracoes || [];
    const resumoConfiguracoes = configuracao.resumoConfiguracoes || [];
    const precoUnitario =
      configuracao.precoUnitario !== undefined
        ? Number(configuracao.precoUnitario)
        : Number(produto.precoExibicao ?? produto.preco ?? 0);
    const quantidade = Number(configuracao.quantidade || 1);
    const observacaoItem = String(configuracao.observacaoItem || "").trim();

    const assinaturaConfiguracao = configuracoes
      .map(
        (config) =>
          `${config.grupoId}:${config.opcaoId}:${Number(config.quantidade || 1)}`
      )
      .sort()
      .join("|");

    const chaveCarrinho = `${id}-${assinaturaConfiguracao}-${observacaoItem}`;
    const resumoConfig = resumoConfiguracoes
      .map((item) => `${item.grupo}: ${item.texto}`)
      .join(" · ");

    const novoItem = {
      id,
      chaveCarrinho,
      nome: produto.nome,
      configuracao: resumoConfig,
      resumoConfiguracoes,
      configuracoes,
      selecoes,
      preco: precoUnitario,
      precoBase: Number(produto.precoExibicao ?? produto.preco ?? 0),
      adicionais: Number(configuracao.adicionais || 0),
      imagem: getImagemProduto(produto),
      quantidade,
      observacaoItem,
    };

    if (configuracao.chaveOriginal) {
      setCarrinho((atual) =>
        atual.map((item) =>
          item.chaveCarrinho === configuracao.chaveOriginal ? novoItem : item
        )
      );
      return;
    }

    const existe = carrinho.find((item) => item.chaveCarrinho === chaveCarrinho);

    if (existe) {
      setCarrinho(
        carrinho.map((item) =>
          item.chaveCarrinho === chaveCarrinho
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        )
      );
    } else {
      setCarrinho([...carrinho, novoItem]);
    }
  }

  function alterarQuantidade(chaveCarrinho, quantidade) {
    if (quantidade <= 0) {
      setCarrinho((atual) => atual.filter((item) => item.chaveCarrinho !== chaveCarrinho));
      return;
    }

    setCarrinho((atual) =>
      atual.map((item) =>
        item.chaveCarrinho === chaveCarrinho ? { ...item, quantidade } : item
      )
    );
  }

  function alterarObservacaoItem(chaveCarrinho, observacaoItem) {
    setCarrinho((atual) =>
      atual.map((item) =>
        item.chaveCarrinho === chaveCarrinho ? { ...item, observacaoItem } : item
      )
    );
  }

  function removerItem(chaveCarrinho) {
    setCarrinho((atual) => atual.filter((item) => item.chaveCarrinho !== chaveCarrinho));
  }

  function limparCarrinho() {
    if (carrinho.length === 0 || window.confirm("Deseja limpar todo o carrinho?")) {
      setCarrinho([]);
      setFrete(0);
      setDistanciaKm(null);
    }
  }

  const filtrosDietarios = [
    "Todos",
    "Sem glúten",
    "Zero lactose",
    "Zero açúcar",
    "Low carb",
    "Vegano",
    "Proteico",
  ];

  function textoPesquisaProduto(produto) {
    const restricoes = Array.isArray(produto.restricoes)
      ? produto.restricoes.join(" ")
      : String(produto.restricoes || "");
    const selos = Array.isArray(produto.selos) ? produto.selos.join(" ") : String(produto.selos || "");
    return [produto.nome, produto.descricao, produto.categoria, ...(produto.categorias || []), restricoes, selos]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  const produtosFiltrados = produtos.filter((produto) => {
    const texto = textoPesquisaProduto(produto);
    const termo = busca.trim().toLowerCase();
    const matchBusca = !termo || texto.includes(termo);

    const categoriasProduto = [produto.categoria, ...(produto.categorias || [])]
      .filter(Boolean)
      .map((item) => String(item).toLowerCase());
    const matchCategoria =
      categoria === "Todos" || categoriasProduto.includes(categoria.toLowerCase());

    const mapaFiltro = {
      "Sem glúten": ["sem glúten", "sem gluten", "sg"],
      "Zero lactose": ["zero lactose", "sem lactose", "sl"],
      "Zero açúcar": ["zero açúcar", "zero acucar", "sem açúcar", "sem acucar", "sa"],
      "Low carb": ["low carb", "lowcarb", "lc"],
      Vegano: ["vegano", "vegan"],
      Proteico: ["proteico", "proteína", "proteina", "whey"],
    };
    const termosFiltro = mapaFiltro[filtroDietario] || [];
    const matchDietario = filtroDietario === "Todos" || termosFiltro.some((item) => texto.includes(item));

    return matchBusca && matchCategoria && matchDietario && produto.ativo !== false;
  });

  const destaques = produtosFiltrados.filter(
    p =>
        p.publicacao?.destaque === true ||
        p.destaque === true
);
  const combos = produtosFiltrados.filter(produto => {

    const categorias = [
        produto.categoria,
        ...(produto.categorias || [])
    ];

    return categorias.some(c =>
        String(c).toUpperCase().includes("COMBO")
    );

});
  const novidades = produtosFiltrados.filter(
    p => p.publicacao?.novidade === true
);

  const subtotal = carrinho.reduce(
  (acc, item) => acc + item.preco * item.quantidade,
  0
);

const total = subtotal + Number(frete || 0);

async function calcularFreteEntrega() {
  try {
    if (!cliente.endereco) {
      alert("Digite o endereço de entrega antes de calcular o frete.");
      return;
    }

    setCalculandoFrete(true);

    const response = await api.post("/frete/calcular", {
      endereco: cliente.endereco,
    });

    setFrete(Number(response.data.frete || 0));
    setDistanciaKm(Number(response.data.distanciaKm || 0));
  } catch (error) {
    console.log(error);
    alert(
      error.response?.data?.message ||
        "Não foi possível calcular o frete. Confira o endereço."
    );
  } finally {
    setCalculandoFrete(false);
  }
}

  function finalizarWhatsApp() {
    if (carrinho.length === 0) {
      alert("Adicione pelo menos um produto ao pedido.");
      return;
    }

    if (!cliente.nome || !cliente.telefone) {
      alert("Preencha seu nome e WhatsApp.");
      return;
    }

    if (
  cliente.entrega === "Delivery" &&
  !cliente.endereco
) {
  alert("Informe o endereço de entrega.");
  return;
}

if (
  cliente.entrega === "Delivery" &&
  distanciaKm === null
) {
  alert(
    "Calcule o frete antes de finalizar o pedido."
  );
  return;
}

    const itens = carrinho
      .map((item) => {
        const detalhes =
          Array.isArray(item.resumoConfiguracoes) &&
          item.resumoConfiguracoes.length > 0
            ? `
${item.resumoConfiguracoes
                .map((config) => `   ${config.grupo}: ${config.texto}`)
                .join("\n")}`
            : item.configuracao
              ? `
   Opções: ${item.configuracao}`
              : "";

        return `• ${item.nome} x${item.quantidade} - R$ ${(
          item.preco * item.quantidade
        ).toFixed(2)}${detalhes}${
          item.observacaoItem
            ? `
   Observação: ${item.observacaoItem}`
            : ""
        }`;
      })
      .join("\n");

    const mensagem = `
Olá! Quero fazer um pedido pelo cardápio online da Conceito Fitness Gourmet.

🛒 *Pedido:*
${itens}

💰 *Subtotal:* R$ ${subtotal.toFixed(2)}
🚚 *Frete:* R$ ${Number(frete || 0).toFixed(2)}
💵 *Total:* R$ ${total.toFixed(2)}

👤 *Cliente:* ${cliente.nome}
📱 *WhatsApp:* ${cliente.telefone}
📍 *Entrega/Retirada:* ${cliente.entrega || "Não informado"}
🪑 *Mesa:* ${cliente.mesa || "-"}
🏠 *Endereço:* ${cliente.endereco || "-"}
📌 *Referência:* ${cliente.referencia || "-"}
📝 *Observação:* ${cliente.observacao || "Nenhuma"}

Aguardo confirmação.
`;
    window.open(
      `https://wa.me/${WHATSAPP_LOJA}?text=${encodeURIComponent(mensagem)}`,
      "_blank"
    );
  }

  async function acessarConta(dados) {
    const response = await api.post("/clientes/cardapio/acessar", dados);
    const novaSessao = response.data?.cliente || null;
    setSessaoCliente(novaSessao);
    localStorage.setItem("conceito-cardapio-sessao", JSON.stringify(novaSessao));
    setCliente((atual) => ({ ...atual, nome: novaSessao?.nome || dados.nome, telefone: novaSessao?.telefone || dados.telefone }));
    const favoritosServidor = novaSessao?.favoritosCardapio || [];
    setFavoritos(favoritosServidor.length ? favoritosServidor : favoritos);
  }

  function sairConta() {
    setSessaoCliente(null);
    localStorage.removeItem("conceito-cardapio-sessao");
  }

  async function alternarFavorito(produtoId) {
    const id = String(produtoId);
    const novos = favoritos.includes(id) ? favoritos.filter((item) => item !== id) : [...favoritos, id];
    setFavoritos(novos);
    if (sessaoCliente?.telefone) {
      try {
        await api.put("/clientes/cardapio/favoritos", { telefone: sessaoCliente.telefone, favoritos: novos });
      } catch (error) {
        console.log("Não foi possível sincronizar favoritos:", error);
      }
    }
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
          <button
            type="button"
            className={`co-favorite-button ${favoritos.includes(String(produto._id || produto.id)) ? "active" : ""}`}
            onClick={(event) => { event.stopPropagation(); alternarFavorito(produto._id || produto.id); }}
            aria-label="Favoritar produto"
          >
            <Heart size={18} fill={favoritos.includes(String(produto._id || produto.id)) ? "currentColor" : "none"} />
          </button>

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
            <>
    {produto.promocaoAtiva && (

        <small className="preco-antigo">

            R$ {Number(produto.precoOriginal || 0)
                .toFixed(2)}

        </small>

    )}

    {!produto.disponivel &&
produto.motivoIndisponibilidade && (

    <small className="produto-indisponivel">

        {produto.motivoIndisponibilidade}

    </small>

)}

    <strong>

        R$ {Number(
            produto.precoExibicao ??
            produto.preco ??
            0
        ).toFixed(2)}

    </strong>

</>

            <button
              disabled={!produto.disponivel}
              onClick={() => abrirProduto(produto)}
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
        <button
          className="co-menu-button"
          type="button"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMenuAberto((aberto) => !aberto)}
        >
          {menuAberto ? <X /> : <Menu />}
        </button>

        <button className="co-logo" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <img src="/logo-conceito.png" alt="Conceito Fitness Gourmet" className="co-logo-image" />
        </button>

        <nav className={`co-nav ${menuAberto ? "is-open" : ""}`}>
          <button onClick={() => { irPara(destaquesRef); setMenuAberto(false); }} className="active">Cardápio</button>
          <button onClick={() => { irPara(combosRef); setMenuAberto(false); }}>Combos</button>
          <button onClick={() => { irPara(novidadesRef); setMenuAberto(false); }}>Novidades</button>
          <button onClick={() => { filtrarCategoria("Bebidas"); setMenuAberto(false); }}>Bebidas</button>
          <button onClick={() => { filtrarCategoria("DOCES"); setMenuAberto(false); }}>Doces</button>
          <button onClick={() => { irPara(duvidasRef); setMenuAberto(false); }}>Dúvidas</button>
        </nav>

        <div className="co-header-actions">
          <button className="co-account-button" type="button" onClick={() => setContaAberta(true)} aria-label="Área do cliente">
            <UserRound size={20} />
            <span>{sessaoCliente?.nome ? sessaoCliente.nome.split(" ")[0] : "Minha conta"}</span>
          </button>
          <button
            className="co-header-cart"
            type="button"
            onClick={() => document.querySelector(".co-cart")?.scrollIntoView({ behavior: "smooth" })}
            aria-label="Abrir carrinho"
          >
            <ShoppingBag size={21} />
            <span>{carrinho.reduce((totalItens, item) => totalItens + item.quantidade, 0)}</span>
          </button>
        </div>
      </header>

      <section className="co-hero">
        <div className="co-hero-text">
          <span className="co-eyebrow"><Sparkles size={16} /> Cafeteria inclusiva premium</span>
          <h1>
            Alimentação que <span>transforma.</span>
          </h1>

          <p>
            Sabor de verdade, cuidado em cada detalhe e opções para diferentes escolhas alimentares.
          </p>

          <div className="co-hero-actions">
            <button type="button" onClick={() => irPara(destaquesRef)}>Explorar cardápio</button>
            <a href={`https://wa.me/${WHATSAPP_LOJA}`} target="_blank" rel="noreferrer">
              <MessageCircle size={18} /> Falar com a loja
            </a>
          </div>

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

            <div className="co-category-heading">
              <div><Gift size={18} /><strong>Categorias</strong></div>
              <span>{produtosFiltrados.length} produto(s)</span>
            </div>
            <div className="co-category-grid">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  className={categoria === cat ? "active" : ""}
                  onClick={() => filtrarCategoria(cat)}
                >
                  <Gift />
                  <span>{cat}</span>
                </button>
              ))}
            </div>

            <div className="co-dietary-filter">
              <div className="co-category-heading">
                <div><SlidersHorizontal size={18} /><strong>Filtros alimentares</strong></div>
                {(filtroDietario !== "Todos" || busca || categoria !== "Todos") && (
                  <button type="button" onClick={() => { setBusca(""); setCategoria("Todos"); setFiltroDietario("Todos"); }}>Limpar filtros</button>
                )}
              </div>
              <div className="co-filter-chips">
                {filtrosDietarios.map((filtro) => (
                  <button
                    type="button"
                    key={filtro}
                    className={filtroDietario === filtro ? "active" : ""}
                    onClick={() => setFiltroDietario(filtro)}
                  >
                    {filtro === "Todos" ? <Sparkles size={15} /> : <Leaf size={15} />}
                    {filtro}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {carregando && (
            <div className="co-loading-grid" aria-label="Carregando produtos">
              {Array.from({ length: 6 }).map((_, index) => <div className="co-skeleton-card" key={index} />)}
            </div>
          )}

          {!carregando && erroCarregamento && (
            <div className="co-state-card">
              <strong>Não conseguimos abrir o cardápio.</strong>
              <span>{erroCarregamento}</span>
              <button type="button" onClick={carregarProdutos}>Tentar novamente</button>
            </div>
          )}

          {!carregando && !erroCarregamento && produtosFiltrados.length === 0 && (
            <div className="co-state-card">
              <Search size={28} />
              <strong>Nenhum produto encontrado.</strong>
              <span>Tente outra busca ou remova algum filtro.</span>
              <button type="button" onClick={() => { setBusca(""); setCategoria("Todos"); setFiltroDietario("Todos"); }}>Ver todo o cardápio</button>
            </div>
          )}

          {!carregando && !erroCarregamento && destaques.length > 0 && (
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
          )}

          {combos.length > 0 && (
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
          )}

          {novidades.length > 0 && (
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
                  <img
  src={getImagemProduto(produto)}
  alt={produto.nome}
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "/sem-imagem.png";
  }}
/>

                    <strong>{produto.nome}</strong>
                  <small>R$ {Number(

    produto.precoExibicao ??

    produto.preco ??

    0

).toFixed(2)}</small>
                </div>
              ))}
            </div>
          </section>
          )}

          {!carregando && !erroCarregamento && produtosFiltrados.length > 0 && (
            <section className="co-section co-all-products">
              <div className="co-section-title">
                <div>
                  <h2><Heart /> {categoria === "Todos" ? "Todo o cardápio" : categoria}</h2>
                  <p>Escolha com calma. Cada produto foi preparado para uma experiência especial.</p>
                </div>
              </div>
              <div className="co-products-grid">
                {produtosFiltrados.map((produto) => (
                  <ProdutoCard key={`todos-${produto._id || produto.id}`} produto={produto} />
                ))}
              </div>
            </section>
          )}
        </section>

        <aside className="co-cart" id="pedido">
          <div className="co-cart-heading">
            <h2><ShoppingBag size={22} /> Seu Pedido</h2>
            {carrinho.length > 0 && (
              <button type="button" onClick={limparCarrinho}>Limpar</button>
            )}
          </div>

          <p className="co-cart-sub">Entrega ou Retirada</p>

          {carrinho.length === 0 ? (
            <div className="co-empty-cart">
              <ShoppingBag />
              <strong>Nenhum produto adicionado ainda.</strong>
              <span>
Seu carrinho está esperando por algo delicioso ☕
</span>
            </div>
          ) : (
            <div className="co-cart-list">
              {carrinho.map((item) => (
                <div className="co-cart-item" key={item.chaveCarrinho || item.id}>
                  <img src={item.imagem} alt={item.nome} />

                  <div>
                    <strong>{item.nome}</strong>
                    {Array.isArray(item.resumoConfiguracoes) && item.resumoConfiguracoes.length > 0 ? (
                      <div className="co-cart-config-list">
                        {item.resumoConfiguracoes.map((config) => (
                          <small key={`${config.grupoId}-${config.grupo}`}>
                            <strong>{config.grupo}:</strong> {config.texto}
                          </small>
                        ))}
                      </div>
                    ) : item.configuracao ? (
                      <small className="co-cart-config">{item.configuracao}</small>
                    ) : null}
                    <span>R$ {item.preco.toFixed(2)}</span>

                    <div className="co-qty">
                      <button
                        type="button"
                        aria-label={`Diminuir ${item.nome}`}
                        onClick={() => alterarQuantidade(item.chaveCarrinho, item.quantidade - 1)}
                      >
                        -
                      </button>

                      <span>{item.quantidade}</span>

                      <button
                        type="button"
                        aria-label={`Aumentar ${item.nome}`}
                        onClick={() => alterarQuantidade(item.chaveCarrinho, item.quantidade + 1)}
                      >
                        +
                      </button>
                    </div>
                    <textarea
                      className="co-item-note"
                      placeholder="Observação deste item..."
                      value={item.observacaoItem || ""}
                      onChange={(e) => alterarObservacaoItem(item.chaveCarrinho, e.target.value)}
                    />
                  </div>
                  <div className="co-cart-item-actions">
                    <button
                      type="button"
                      className="co-edit-item"
                      aria-label={`Editar ${item.nome}`}
                      onClick={() => editarItemCarrinho(item)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="co-remove-item"
                      aria-label={`Remover ${item.nome}`}
                      onClick={() => removerItem(item.chaveCarrinho)}
                    >
                      <Trash2 size={17} />
                    </button>
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

            <label>Como você deseja receber?</label>
            <div className="co-service-options">
              {[
                { value: "Consumo no local", label: "Consumir no local", icon: UtensilsCrossed },
                { value: "Retirada no balcão", label: "Retirar na loja", icon: Store },
                { value: "Delivery", label: "Delivery", icon: MapPin },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  type="button"
                  key={value}
                  className={cliente.entrega === value ? "active" : ""}
                  onClick={() => {
                    if (value !== "Delivery") {
                      setFrete(0);
                      setDistanciaKm(null);
                    }
                    setCliente({
                      ...cliente,
                      entrega: value,
                      endereco: value === "Delivery" ? cliente.endereco : "",
                      referencia: value === "Delivery" ? cliente.referencia : "",
                    });
                  }}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {cliente.entrega === "Consumo no local" && cliente.mesa && (
              <div className="co-table-identification">Mesa identificada pelo QR Code: <strong>{cliente.mesa}</strong></div>
            )}

{cliente.entrega === "Delivery" && (
  <>
    <label>Endereço de entrega</label>

    <input
      placeholder="Rua, número e bairro"
      value={cliente.endereco}
      onChange={(e) =>
        setCliente({
          ...cliente,
          endereco: e.target.value,
        })
      }
    />

    <label>Ponto de referência</label>

    <input
      placeholder="Ex.: próximo ao mercado..."
      value={cliente.referencia}
      onChange={(e) =>
  setCliente({
    ...cliente,
          referencia: e.target.value,
        })
      }
    />
  </>
)}

{cliente.entrega === "Delivery" && (
  <>
    <button
      type="button"
      className="co-calc-frete"
      onClick={calcularFreteEntrega}
    >
      {calculandoFrete ? "Calculando..." : "Calcular frete"}
    </button>

    {distanciaKm !== null && (
      <div className="co-frete-info">
        <span>Distância: {distanciaKm.toFixed(2)} km</span>
        <strong>
          Frete: R$ {Number(frete || 0).toFixed(2)}
        </strong>
      </div>
    )}
  </>
)}


            <label>Observação (opcional)</label>
            <textarea
  placeholder="Alguma observação?"
  value={cliente.observacao}
  onChange={(e) =>
    setCliente({
      ...cliente,
      observacao: e.target.value,
    })
  }
/>
            </div>

          <div className="co-total-box">
  <div>
    <span>Subtotal</span>
    <strong>R$ {subtotal.toFixed(2)}</strong>
  </div>

  {cliente.entrega === "Delivery" && (
    <div>
      <span>Frete</span>
      <strong>R$ {Number(frete || 0).toFixed(2)}</strong>
    </div>
  )}

  <div className="co-total-final">
    <span>Total</span>
    <strong>R$ {total.toFixed(2)}</strong>
  </div>
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

{carrinho.length > 0 && (
  <button
    className="co-cart-float"
    onClick={() =>
      document
        .querySelector(".co-cart")
        ?.scrollIntoView({
          behavior: "smooth",
        })
    }
  >
    🛒 {carrinho.length} item(s)
  </button>
)}

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

      <MinhaContaModal
        aberto={contaAberta}
        onClose={() => setContaAberta(false)}
        sessao={sessaoCliente}
        onEntrar={acessarConta}
        onSair={sairConta}
        favoritos={favoritos}
      />

      {produtoSelecionado && (
        <ProdutoModal
          produto={produtoSelecionado}
          imagem={getImagemProduto(produtoSelecionado)}
          quantidade={quantidadeModal}
          setQuantidade={setQuantidadeModal}
          onFechar={() => {
            setProdutoSelecionado(null);
            setItemEmEdicao(null);
          }}
          grupos={gruposComponentes}
          opcoes={opcoesComponentes}
          configuracaoInicial={itemEmEdicao}
          onAdicionar={({
            selecoes,
            configuracoes,
            resumoConfiguracoes,
            adicionais,
            precoUnitario,
            observacaoItem,
          }) => {
            adicionarProduto(produtoSelecionado, {
              quantidade: quantidadeModal,
              selecoes,
              configuracoes,
              resumoConfiguracoes,
              adicionais,
              precoUnitario,
              observacaoItem,
              chaveOriginal: itemEmEdicao?.chaveCarrinho,
            });

            setProdutoSelecionado(null);
            setItemEmEdicao(null);
          }}
        />
      )}
    </div>
  );
}
export default CardapioOnline;