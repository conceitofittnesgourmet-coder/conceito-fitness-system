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
import AdminLayout from "../layouts/AdminLayout";

const COMANDAS_INICIAIS = [
  { id: "balcao", nome: "Balcão", tipo: "balcao" },
  { id: "delivery", nome: "Delivery", tipo: "delivery" },
  { id: "retirada", nome: "Retirada", tipo: "retirada" },
  { id: "mesa01", nome: "Mesa 01", tipo: "mesa", numero: "01" },
  { id: "mesa02", nome: "Mesa 02", tipo: "mesa", numero: "02" },
  { id: "mesa03", nome: "Mesa 03", tipo: "mesa", numero: "03" },
  { id: "mesa04", nome: "Mesa 04", tipo: "mesa", numero: "04" },
  { id: "mesa05", nome: "Mesa 05", tipo: "mesa", numero: "05" },
  { id: "mesa06", nome: "Mesa 06", tipo: "mesa", numero: "06" },
  { id: "mesa07", nome: "Mesa 07", tipo: "mesa", numero: "07" },
  { id: "mesa08", nome: "Mesa 08", tipo: "mesa", numero: "08" },
  { id: "mesa09", nome: "Mesa 09", tipo: "mesa", numero: "09" },
];

function criarComandasVazias() {
  return COMANDAS_INICIAIS.reduce((acc, comanda) => {
    acc[comanda.id] = [];
    return acc;
  }, {});
}

export default function Pdv() {
  const [comandaAtiva, setComandaAtiva] = useState("balcao");
  const [comandas, setComandas] = useState(() => {
  const salvas = localStorage.getItem("pdvComandas");

  if (salvas) {
    try {
      return JSON.parse(salvas);
    } catch {
      return criarComandasVazias();
    }
  }

  return criarComandasVazias();
});

  const cart = comandas[comandaAtiva] || [];
  const [pagamento, setPagamento] = useState("PIX");
  const [produtos, setProdutos] = useState([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [mesa, setMesa] = useState("Balcão");
  const [cliente, setCliente] = useState("Cliente Balcão");
  const [telefone, setTelefone] = useState("");
  const [cpfNota, setCpfNota] = useState("");
  const [observacao, setObservacao] = useState("");
  const [clientes, setClientes] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [tipoPedido, setTipoPedido] = useState("balcao");
  const [numeroMesa, setNumeroMesa] = useState("");
  const [enderecoEntrega, setEnderecoEntrega] = useState("");
  const [distanciaEntrega, setDistanciaEntrega] = useState("");
  const [referenciaEntrega, setReferenciaEntrega] = useState("");
  const [taxaEntregaManual, setTaxaEntregaManual] = useState("");
  const [descontoManual, setDescontoManual] = useState("");
  const [motivoDesconto, setMotivoDesconto] = useState("");
  const [trocoPara, setTrocoPara] = useState("");
  const [buscaProduto, setBuscaProduto] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");

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

useEffect(() => {
  localStorage.setItem("pdvComandas", JSON.stringify(comandas));
}, [comandas]);

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

function atualizarCarrinhoComanda(novoCarrinho) {
  setComandas((anteriores) => ({
    ...anteriores,
    [comandaAtiva]: novoCarrinho,
  }));
}

function selecionarComanda(comanda) {
  setComandaAtiva(comanda.id);
  setTipoPedido(comanda.tipo);

  if (comanda.tipo === "mesa") {
    setNumeroMesa(comanda.numero);
    setMesa(`Mesa ${comanda.numero}`);
    setCliente(`Mesa ${comanda.numero}`);
  }

  if (comanda.tipo === "balcao") {
    setNumeroMesa("");
    setMesa("Balcão");
    setCliente("Cliente Balcão");
  }

  if (comanda.tipo === "delivery") {
    setNumeroMesa("");
    setMesa("Delivery");
    setCliente("Cliente Delivery");
  }

  if (comanda.tipo === "retirada") {
    setNumeroMesa("");
    setMesa("Retirada");
    setCliente("Cliente Retirada");
  }
}

function resumoComanda(id) {
  const itens = comandas[id] || [];

  const quantidade = itens.reduce(
    (acc, item) => acc + Number(item.quantidade || 1),
    0
  );

  const total = itens.reduce(
    (acc, item) =>
      acc + Number(item.preco || 0) * Number(item.quantidade || 1),
    0
  );

  return { quantidade, total };
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
    atualizarCarrinhoComanda(
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
    atualizarCarrinhoComanda([...cart, produtoFormatado]);
  }
}

  function removerProduto(id) {
  atualizarCarrinhoComanda(cart.filter((item) => item.id !== id));
}

function aumentarQuantidade(id) {
  atualizarCarrinhoComanda(
    cart.map((item) =>
      item.id === id
        ? {
            ...item,
            quantidade: Number(item.quantidade || 1) + 1,
          }
        : item
    )
  );
}

function diminuirQuantidade(id) {
  atualizarCarrinhoComanda(
    cart
      .map((item) =>
        item.id === id
          ? {
              ...item,
              quantidade: Number(item.quantidade || 1) - 1,
            }
          : item
      )
      .filter((item) => item.quantidade > 0)
  );
}

function limparPedido() {
  if (!window.confirm("Deseja limpar esta comanda?")) return;

  atualizarCarrinhoComanda([]);
} 

  function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const subtotalPedido = cart.reduce((acc, item) => {
  const preco = Number(
    String(item.preco || 0).replace(",", ".")
  );

  const quantidade = Number(item.quantidade || 1);

  return acc + preco * quantidade;
}, 0);

const taxaEntregaPedido = Number(
  String(taxaEntregaManual || 0).replace(",", ".")
);

const descontoPedido = Number(
  String(descontoManual || 0).replace(",", ".")
);

const totalPedido = Math.max(
  0,
  subtotalPedido + taxaEntregaPedido - descontoPedido
);

const produtosFiltrados = produtos.filter((produto) => {
  const nome = produto.nome?.toLowerCase() || "";
  const categoria = produto.categoria || "";

  const passaBusca = nome.includes(buscaProduto.toLowerCase());

  const passaCategoria =
    categoriaAtiva === "Todos" ||
    categoria.toLowerCase() === categoriaAtiva.toLowerCase();

  return passaBusca && passaCategoria;
});

  const troco =
  pagamento === "DINHEIRO"
    ? Math.max(
        0,
        Number(trocoPara || 0) - totalPedido
      )
    : 0;

 async function calcularFretePDV() {
  if (!enderecoEntrega.trim()) {
    alert("Informe o endereço.");
    return;
  }

  const enderecoCompleto = `${enderecoEntrega}, Umuarama, Paraná, Brasil`;

  try {
    const response = await api.post("/frete/calcular", {
      endereco: enderecoCompleto,
    });

    const frete = Number(response.data.frete || 0);
    const distancia = Number(response.data.distanciaKm || 0);

    setTaxaEntregaManual(frete);
    setDistanciaEntrega(distancia);
  } catch (error) {
    console.log("Erro ao calcular frete:", error);

    alert(
      error.response?.data?.message ||
        "Não conseguimos localizar esse endereço. Tente informar rua e número."
    );
  }
}

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
      cpfNota,

      tipo: tipoPedido,

mesa:
  tipoPedido === "mesa"
    ? numeroMesa
    : "Balcão",

enderecoEntrega,

referenciaEntrega,

taxaEntrega:
  Number(taxaEntregaManual || 0),

desconto:
  Number(descontoManual || 0),

motivoDesconto,

trocoPara: Number(trocoPara || 0),
troco: Number(troco || 0),

      observacao,

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
motivoDesconto,
observacao,
tipo: tipoPedido,

enderecoEntrega,

referenciaEntrega,

total: totalPedido,
};

        
    const response = await api.post("/pedidos", novoPedido);

const pedidoCriado = response.data.pedido || response.data;

const desejaImprimir = window.confirm(
  "Pedido finalizado com sucesso!\n\nClique em OK para imprimir ou Cancelar para finalizar sem imprimir."
);

if (desejaImprimir) {
  const janela = window.open(`/cupom/${pedidoCriado._id}?print=true`, "_blank");

  if (janela) {
    janela.focus();
  }
}

    atualizarCarrinhoComanda([]);

    setCliente("Cliente Balcão");

    setTelefone("");

    setCpfNota("");

    setObservacao("");

    setMesa("Balcão");
    setTaxaEntregaManual(0);
    setDescontoManual(0);
    setTipoPedido("balcao");
    setNumeroMesa("");
    setEnderecoEntrega("");
    setReferenciaEntrega("");
    setMotivoDesconto("");
    setTrocoPara("");

  } catch (error) {
    console.log(error);

    alert("Erro ao finalizar pedido.");
  }
}

  return (
    <AdminLayout> 
         <div className="pdv-page">
      
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
              <input
  placeholder="Buscar produto..."
  value={buscaProduto}
  onChange={(e) => setBuscaProduto(e.target.value)}
/>
              <span>F2</span>
            </div>

            <button>
              <Users size={18} />
              Clientes
              <span>F3</span>
            </button>
          </div>
        </header>

        <section className="pdv-comandas-premium">
  <div className="pdv-comandas-header">
    <div>
      <span>Atendimento simultâneo</span>
      <h2>Mesas e Comandas</h2>
    </div>

    <strong>
      Comanda ativa:{" "}
      {COMANDAS_INICIAIS.find((c) => c.id === comandaAtiva)?.nome}
    </strong>
  </div>

  <div className="pdv-comandas-grid">
    {COMANDAS_INICIAIS.map((comanda) => {
      const resumo = resumoComanda(comanda.id);
      const ativa = comandaAtiva === comanda.id;
      const ocupada = resumo.quantidade > 0;

      return (
        <button
          key={comanda.id}
          type="button"
          className={`pdv-comanda-card ${ativa ? "active" : ""} ${
            ocupada ? "ocupada" : "livre"
          }`}
          onClick={() => selecionarComanda(comanda)}
        >
          <div>
            <span>{ocupada ? "Ocupada" : "Livre"}</span>
            <strong>{comanda.nome}</strong>
          </div>

          <small>{resumo.quantidade} item(ns)</small>
          <b>{moeda(resumo.total)}</b>
        </button>
      );
    })}
  </div>
</section>

        <section className="pdv-workspace">
          <div className="pdv-products-panel">
            <div className="pdv-categories-premium">
             {[
  "Todos",
  ...Array.from(
    new Set(
      produtos
        .map((produto) => produto.categoria)
        .filter(Boolean)
    )
  ),
].map((cat) => (
  <button
    key={cat}
    className={categoriaAtiva === cat ? "active" : ""}
    onClick={() => setCategoriaAtiva(cat)}
  >
    {cat}
  </button>
))}
            </div>

            <div className="pdv-products-grid">
              {loadingProdutos && (
                <div className="pdv-loading-produtos">
                  Carregando produtos...
                </div>
              )}

              {!loadingProdutos &&
                produtosFiltrados.map((produto) => (
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
                <h2>
  Pedido Atual
  <span>
    {COMANDAS_INICIAIS.find((c) => c.id === comandaAtiva)?.nome}
  </span>
</h2>
                
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
  <span>{item.nome}</span>

  <div className="controle-quantidade">
    <button
      type="button"
      onClick={() => diminuirQuantidade(item.id)}
    >
      -
    </button>

    <strong>{item.quantidade}</strong>

    <button
      type="button"
      onClick={() => aumentarQuantidade(item.id)}
    >
      +
    </button>
  </div>
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

  <input
  placeholder="CPF/CNPJ na nota - opcional"
  value={cpfNota}
  onChange={(e) => setCpfNota(e.target.value)}
/>

  <div className="tipo-pedido-card">
  <label>Tipo do pedido</label>

  <select
    value={tipoPedido}
    onChange={(e) => setTipoPedido(e.target.value)}
  >
    <option value="balcao">Balcão</option>
    <option value="mesa">Mesa</option>
    <option value="delivery">Delivery</option>
    <option value="retirada">Retirada</option>
  </select>
</div>

{tipoPedido === "mesa" && (
  <div className="delivery-card">
    <input
      placeholder="Número da mesa"
      value={numeroMesa}
      onChange={(e) => setNumeroMesa(e.target.value)}
    />
  </div>
)}

{tipoPedido === "delivery" && (
  <div className="delivery-card">

    <input
  placeholder="Ex: Rua Bahia 1624 Centro"
  value={enderecoEntrega}
  onChange={(e) =>
    setEnderecoEntrega(e.target.value)
  }
/>

    <input
      placeholder="Ponto de referência"
      value={referenciaEntrega}
      onChange={(e) =>
        setReferenciaEntrega(e.target.value)
      }
    />

    <button
      type="button"
      className="btn-calcular-frete"
      onClick={calcularFretePDV}
    >
      Calcular frete
    </button>

  </div>
)}

   {distanciaEntrega && (
  <div className="frete-info">
    <strong>
      Distância: {Number(distanciaEntrega).toFixed(2)} km
    </strong>

    <strong>
      Frete: {moeda(taxaEntregaManual)}
    </strong>
  </div>
)}
    
  <textarea
    placeholder="+ Observação do pedido"
    value={observacao}
    onChange={(e) => setObservacao(e.target.value)}
  />
 </div>

<div className="pdv-ajustes-pedido">

  <div className="pdv-ajuste-item">
    <label>Taxa de entrega</label>

    <input
      type="number"
      min="0"
      value={taxaEntregaManual}
      onChange={(e) =>
        setTaxaEntregaManual(e.target.value)
      }
      placeholder="0,00"
    />
  </div>

  <div className="pdv-ajuste-item">
    <label>Desconto</label>

    <input
      type="number"
      min="0"
      value={descontoManual}
      onChange={(e) =>
        setDescontoManual(e.target.value)
      }
      placeholder="0,00"
    />
  </div>

  <div className="pdv-ajuste-item">
    <label>Motivo do desconto</label>

    <textarea
      value={motivoDesconto}
      onChange={(e) =>
        setMotivoDesconto(e.target.value)
      }
      placeholder="Ex: Cliente VIP, cortesia, promoção..."
    />
  </div>

</div>

             <div className="pdv-total-box">
              <div>

                <span>Subtotal</span>
                <strong>{moeda(subtotalPedido)}</strong>
             </div> 
            
              <div>
                <span>Taxa de entrega</span>
                <strong>{moeda(taxaEntregaPedido)}</strong>
              </div>

              <div>
                <span>Desconto</span>
                <strong className="desconto">- {moeda(descontoPedido)}</strong>
              </div>

              <div className="total-final">
                <span>Total</span>
                <strong>
  {moeda(totalPedido)}
</strong>
              </div>
            </div>

            <div className="pagamento-title">Forma de Pagamento</div>

            <div className="payment-grid">

              {pagamento === "DINHEIRO" && (
  <div className="pdv-ajuste-item">
    <label>Troco para</label>

    <input
      type="number"
      min="0"
      value={trocoPara}
      onChange={(e) => setTrocoPara(e.target.value)}
      placeholder="Valor recebido"
    />

    <small>
      Troco: {moeda(troco)}
    </small>
  </div>
)}

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
        </AdminLayout>
    );
}