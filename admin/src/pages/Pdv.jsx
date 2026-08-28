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
import ProdutoConfigModal from "../components/PDVConfiguravel/ProdutoConfigModal";

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
  const [cepEntrega, setCepEntrega] =
  useState("");

const [
  numeroEntrega,
  setNumeroEntrega
] = useState("");

const [
  bairroEntrega,
  setBairroEntrega
] = useState("");

const [
  complementoEntrega,
  setComplementoEntrega
] = useState("");
  const [taxaEntregaManual, setTaxaEntregaManual] = useState("");
  const [descontoManual, setDescontoManual] = useState("");
  const [motivoDesconto, setMotivoDesconto] = useState("");
  const [trocoPara, setTrocoPara] = useState("");
  const [buscaProduto, setBuscaProduto] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [produtoPesoModal, setProdutoPesoModal] = useState(null);
  const [quantidadePeso, setQuantidadePeso] = useState("1");
  const [pagamentos, setPagamentos] = useState([
  {
    id: Date.now(),
    forma: "PIX",
    valor: "",
    vencimento: "",
  },
]);
const [produtoConfigModal, setProdutoConfigModal] = useState(null);
  
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

  function buscarProdutoPorCodigo(codigo) {
  const codigoLimpo = String(codigo || "").trim();

  if (!codigoLimpo) return null;

  return produtos.find((produto) => {
    return (
      String(produto.codigoBarras || "").trim() === codigoLimpo ||
      String(produto.sku || "").trim().toLowerCase() ===
        codigoLimpo.toLowerCase()
    );
  });
}

function adicionarProduto(produto) {
  if (produto.gruposComponentes && produto.gruposComponentes.length > 0) {
    setProdutoConfigModal(produto);
    return;
  }

  adicionarProdutoSemConfiguracao(produto);
}

 function adicionarProdutoSemConfiguracao(produto) {
  const produtoId = produto._id || produto.produtoId || produto.id;

  const configuracoes = Array.isArray(produto.configuracoes)
    ? produto.configuracoes
    : [];

  const assinaturaConfiguracao = configuracoes
    .map((config) =>
      [
        String(config.grupoId || ""),
        String(config.opcaoId || ""),
        Number(config.quantidade || 1),
      ].join(":")
    )
    .sort()
    .join("|");

  const id = assinaturaConfiguracao
    ? `${produtoId}::${assinaturaConfiguracao}`
    : String(produtoId);

  const vendaPorPeso = Boolean(produto.vendaPorPeso);
  const permiteFracionado = Boolean(produto.permiteFracionado);
  const unidadeMedida = produto.unidadeMedida || "UN";

  let quantidadeInicial = 1;

 if (vendaPorPeso || permiteFracionado || unidadeMedida === "KG") {
  setProdutoPesoModal(produto);
  setQuantidadePeso("1");
  return;
}

  const precoUnitario = Number(produto.preco || 0);

  const produtoFormatado = {
  id,
  produtoId,

  nome: produto.nome,

  preco: precoUnitario,
  precoUnitario,

  precoOriginal: Number(
    produto.precoOriginal ?? produto.preco ?? 0
  ),

  adicionais: Number(produto.adicionais || 0),

  unidadeMedida,
  vendaPorPeso,
  permiteFracionado,

  quantidade: quantidadeInicial,
  subtotal: precoUnitario * quantidadeInicial,

  imagem: getImagemProduto(produto),

  configuracoes: configuracoes.map((config) => ({
    grupoId: String(config.grupoId || ""),
    grupo: String(config.grupo || ""),
    opcaoId: String(config.opcaoId || ""),
    opcao: String(config.opcao || ""),
    quantidade: Number(config.quantidade || 1),
    valorUnitario: Number(config.valorUnitario || 0),
    valor: Number(config.valor || 0),
  })),
};

console.log(
  "ITEM FORMATADO PARA O CARRINHO:",
  produtoFormatado
);

  setComandas((anteriores) => {
  const carrinhoAtual =
    anteriores[comandaAtiva] || [];

  const existente = carrinhoAtual.find(
    (item) => item.id === id
  );

  let novoCarrinho;

  if (existente) {
    novoCarrinho = carrinhoAtual.map((item) =>
      item.id === id
        ? {
            ...item,
            quantidade:
              Number(item.quantidade || 0) +
              quantidadeInicial,

            subtotal:
              Number(item.preco || 0) *
              (Number(item.quantidade || 0) +
                quantidadeInicial),
          }
        : item
    );
  } else {
    novoCarrinho = [
      ...carrinhoAtual,
      produtoFormatado,
    ];
  }

  return {
    ...anteriores,
    [comandaAtiva]: novoCarrinho,
  };
});
}
 
  function confirmarProdutoConfigurado({
  produto,
  escolhas,
  precoFinal,
  adicionais,
}) {
  const configuracoesNormalizadas = Array.isArray(escolhas)
    ? escolhas.map((item) => ({
        grupoId: String(item.grupoId || ""),
        grupo: String(item.grupo || ""),
        opcaoId: String(item.opcaoId || ""),
        opcao: String(item.opcao || ""),
        quantidade: Number(item.quantidade || 1),
        valorUnitario: Number(
          item.valorUnitario ?? item.valor ?? 0
        ),
        valor: Number(item.valor || 0),
      }))
    : [];

  const novoProduto = {
    ...produto,

    preco: Number(precoFinal || produto.preco || 0),

    precoOriginal: Number(produto.preco || 0),

    adicionais: Number(adicionais || 0),

    configuracoes: configuracoesNormalizadas,
  };

  console.log(
    "PERSONALIZAÇÃO ADICIONADA AO PDV:",
    novoProduto.nome,
    configuracoesNormalizadas
  );

  setProdutoConfigModal(null);

  adicionarProdutoSemConfiguracao(novoProduto);
}

function confirmarProdutoPeso() {
  if (!produtoPesoModal) return;

  const produto = produtoPesoModal;
  const id = produto._id || produto.id;

  const quantidadeInformada = Number(
    String(quantidadePeso || "0").replace(",", ".")
  );

  if (!quantidadeInformada || quantidadeInformada <= 0) {
    alert("Informe uma quantidade válida.");
    return;
  }

  const existe = cart.find((item) => item.id === id);
  const precoUnitario = Number(produto.preco || 0);

  const itemFormatado = {
    id,
    produtoId: produto._id || produto.id,
    nome: produto.nome,
    preco: precoUnitario,
    precoUnitario,
    unidadeMedida: produto.unidadeMedida || "KG",
    vendaPorPeso: Boolean(produto.vendaPorPeso),
    permiteFracionado: Boolean(produto.permiteFracionado),
    quantidade: quantidadeInformada,
    subtotal: precoUnitario * quantidadeInformada,
    imagem: getImagemProduto(produto),
  };

  if (existe) {
    atualizarCarrinhoComanda(
      cart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantidade: Number(
                (Number(item.quantidade || 0) + quantidadeInformada).toFixed(3)
              ),
              subtotal:
                Number(item.precoUnitario || item.preco || 0) *
                (Number(item.quantidade || 0) + quantidadeInformada),
            }
          : item
      )
    );
  } else {
    atualizarCarrinhoComanda([...cart, itemFormatado]);
  }

  setProdutoPesoModal(null);
  setQuantidadePeso("1");
}

  function removerProduto(id) {
  atualizarCarrinhoComanda(cart.filter((item) => item.id !== id));
}

function aumentarQuantidade(id) {
  atualizarCarrinhoComanda(
    cart.map((item) => {
      if (item.id !== id) return item;

      const incremento =
        item.vendaPorPeso || item.permiteFracionado ? 0.1 : 1;

      const novaQuantidade =
        Number(item.quantidade || 0) + incremento;

      return {
        ...item,
        quantidade: Number(novaQuantidade.toFixed(3)),
        subtotal: Number(item.preco || 0) * novaQuantidade,
      };
    })
  );
}

function diminuirQuantidade(id) {
  atualizarCarrinhoComanda(
    cart
      .map((item) => {
        if (item.id !== id) return item;

        const decremento =
          item.vendaPorPeso || item.permiteFracionado ? 0.1 : 1;

        const novaQuantidade =
          Number(item.quantidade || 0) - decremento;

        return {
          ...item,
          quantidade: Number(novaQuantidade.toFixed(3)),
          subtotal: Number(item.preco || 0) * novaQuantidade,
        };
      })
      .filter((item) => Number(item.quantidade || 0) > 0)
  );
}

function limparPedido() {
  if (!window.confirm("Deseja limpar esta comanda?")) return;

  atualizarCarrinhoComanda([]);
} 

function adicionarPagamento() {
  if (pagamentos.length >= 5) {
    alert("Máximo de 5 formas de pagamento.");
    return;
  }

 setPagamentos((lista) => [
  ...lista,
  {
    id: Date.now(),
    forma: "PIX",
    valor: "",
    vencimento: "",
  },
]);
}

function removerPagamento(id) {
  if (pagamentos.length === 1) return;

  setPagamentos((lista) =>
    lista.filter((p) => p.id !== id)
  );
}

function atualizarPagamento(id, campo, valor) {
  setPagamentos((lista) =>
    lista.map((p) =>
      p.id === id
        ? {
            ...p,
            [campo]: valor,
          }
        : p
    )
  );
}

  function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const subtotalPedido = cart.reduce((acc, item) => {
  const subtotal =
    item.subtotal !== undefined
      ? Number(item.subtotal || 0)
      : Number(item.preco || 0) * Number(item.quantidade || 1);

  return acc + subtotal;
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

  const totalPago = pagamentos.reduce(
  (acc, p) => acc + Number(p.valor || 0),
  0
);

const restante = Math.max(
  0,
  Number(totalPedido || 0) - totalPago
);

const dinheiroRecebido = pagamentos
  .filter((p) => p.forma === "DINHEIRO")
  .reduce(
    (acc, p) => acc + Number(p.valor || 0),
    0
  );

const troco =
  dinheiroRecebido > Number(totalPedido || 0)
    ? dinheiroRecebido - Number(totalPedido || 0)
    : 0;

 async function calcularFretePDV() {
  if (!enderecoEntrega.trim()) {
    alert("Informe o endereço.");
    return;
  }

  try {
  const response = await api.post("/frete/calcular", {
    endereco: enderecoEntrega.trim(),
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

    const pagamentosFinalizados =
  pagamentos.length === 1 && Number(pagamentos[0].valor || 0) <= 0
    ? [
        {
          ...pagamentos[0],
          valor: totalPedido,
        },
      ]
    : pagamentos;

const totalPagoFinal = pagamentosFinalizados.reduce(
  (acc, p) => acc + Number(p.valor || 0),
  0
);

if (totalPagoFinal < totalPedido) {
  alert("Ainda existe valor pendente de pagamento.");
  return;
}

if (pagamentosFinalizados.some((p) => Number(p.valor || 0) <= 0)) {
  alert("Todos os pagamentos precisam possuir um valor.");
  return;
}

const crediarioSemVencimento =
  pagamentosFinalizados.some(
    (p) =>
      p.forma === "CREDIARIO" &&
      !p.vencimento
  );

if (crediarioSemVencimento) {
  alert(
    "Informe a data de vencimento do pagamento a prazo."
  );
  return;
}

if (tipoPedido === "delivery") {
  if (!enderecoEntrega.trim()) {
    alert(
      "Informe o endereço de entrega."
    );
    return;
  }

  if (!bairroEntrega.trim()) {
    alert(
      "Informe o bairro da entrega."
    );
    return;
  }
}

    const novoPedido = {
      cliente,

      telefone,
      cpfNota,
      documentoFiscal: "nfce",
      tipo: tipoPedido,

mesa:
  tipoPedido === "mesa"
    ? numeroMesa
    : "Balcão",

enderecoEntrega,

referenciaEntrega,

cep: cepEntrega,

numeroEntrega,

bairroEntrega,

complementoEntrega,

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

      pagamentos: pagamentosFinalizados.map((p) => ({
  forma: p.forma,
  valor: Number(p.valor || 0),
  vencimento:
    p.forma === "CREDIARIO" && p.vencimento
      ? p.vencimento
      : null,
})),

      produtos: cart.map((item) => ({
  produtoId: item.produtoId,
  nome: item.nome,
  quantidade: Number(item.quantidade || 1),
  preco: Number(item.precoUnitario || item.preco || 0),
  precoUnitario: Number(item.precoUnitario || item.preco || 0),
  unidadeMedida: item.unidadeMedida || "UN",
  vendaPorPeso: Boolean(item.vendaPorPeso),
  permiteFracionado: Boolean(item.permiteFracionado),
  subtotal:
    item.subtotal !== undefined
      ? Number(item.subtotal || 0)
      : Number(item.preco || 0) * Number(item.quantidade || 1),
  imagem: item.imagem,
  configuracoes: Array.isArray(item.configuracoes)
  ? item.configuracoes.map((config) => ({
      grupoId: String(config.grupoId || ""),
      grupo: String(config.grupo || ""),
      opcaoId: String(config.opcaoId || ""),
      opcao: String(config.opcao || ""),
      quantidade: Number(config.quantidade || 1),
      valorUnitario: Number(
        config.valorUnitario ?? config.valor ?? 0
      ),
      valor: Number(config.valor || 0),
    }))
  : [],
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

    const dadosResposta = response?.data || {};
    const pedidoCriado =
      dadosResposta.pedido ||
      dadosResposta.venda ||
      dadosResposta.data?.pedido ||
      dadosResposta.data ||
      dadosResposta;

    const pedidoId =
      pedidoCriado?._id ||
      pedidoCriado?.id ||
      dadosResposta?.pedidoId ||
      dadosResposta?._id ||
      dadosResposta?.id ||
      null;

    const desejaImprimir = window.confirm(
      "Pedido finalizado com sucesso!\n\nClique em OK para imprimir ou Cancelar para finalizar sem imprimir."
    );

    if (desejaImprimir) {
      if (!pedidoId) {
        alert(
          "A venda foi registrada, mas o sistema não recebeu o código do pedido para abrir o cupom. Verifique o pedido na tela de Pedidos."
        );
      } else {
        const janela = window.open(
          `/cupom/${pedidoId}?print=true`,
          "_blank"
        );

        if (janela) {
          janela.focus();
        } else {
          alert(
            "A venda foi registrada, mas o navegador bloqueou a abertura do cupom. Libere os pop-ups para este site."
          );
        }
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
    setCepEntrega("");
    setNumeroEntrega("");
    setBairroEntrega("");
    setComplementoEntrega("");
    setMotivoDesconto("");
    setTrocoPara("");
    setPagamentos([
  {
    id: crypto.randomUUID(),
    forma: "PIX",
    valor: "",
    vencimento: "",
  },
]);

  } catch (error) {
    console.error("Erro ao finalizar pedido:", error);

    const mensagem =
      error.response?.data?.message ||
      error.response?.data?.erro ||
      error.message ||
      "Erro ao finalizar pedido.";

    alert(mensagem);
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
  placeholder="Buscar produto ou ler código de barras..."
  value={buscaProduto}
  onChange={(e) => setBuscaProduto(e.target.value)}
  onKeyDown={(e) => {
    if (e.key !== "Enter") return;

    const produtoEncontrado = buscarProdutoPorCodigo(buscaProduto);

    if (!produtoEncontrado) {
      alert("Produto não encontrado para este código.");
      return;
    }

    adicionarProduto(produtoEncontrado);
    setBuscaProduto("");
  }}
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

  {Array.isArray(item.configuracoes) &&
  item.configuracoes.length > 0 && (
    <div
      style={{
        fontSize: "12px",
        marginTop: "4px",
        fontWeight: "600",
      }}
    >
      {item.configuracoes.map((config, index) => (
        <div key={`${config.grupoId}-${config.opcaoId}-${index}`}>
          {config.grupo || "Personalização"}:{" "}
          {config.opcao || "Opção"}
        </div>
      ))}
    </div>
  )}

  <div className="controle-quantidade">
    <button
      type="button"
      onClick={() => diminuirQuantidade(item.id)}
    >
      -
    </button>

    <strong>
  {item.vendaPorPeso || item.permiteFracionado
    ? Number(item.quantidade || 0).toFixed(3)
    : item.quantidade}
  {" "}
  {item.unidadeMedida || "UN"}
</strong>

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
  R$ {Number(
  item.subtotal !== undefined
    ? item.subtotal
    : Number(item.preco || 0) * Number(item.quantidade || 1)
).toFixed(2)}
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

  <div className="pdv-documento-fiscal">

</div>

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

<div className="delivery-address-grid">
  <div>
    <label>Número</label>

    <input
      value={numeroEntrega}
      onChange={(e) =>
        setNumeroEntrega(
          e.target.value
        )
      }
      placeholder="Ex.: 1250"
    />
  </div>

  <div>
    <label>Bairro</label>

    <input
      value={bairroEntrega}
      onChange={(e) =>
        setBairroEntrega(
          e.target.value
        )
      }
      placeholder="Ex.: Zona III"
    />
  </div>

  <div>
    <label>CEP</label>

    <input
      value={cepEntrega}
      onChange={(e) =>
        setCepEntrega(
          e.target.value
        )
      }
      placeholder="87500-000"
    />
  </div>

  <div>
    <label>Complemento</label>

    <input
      value={complementoEntrega}
      onChange={(e) =>
        setComplementoEntrega(
          e.target.value
        )
      }
      placeholder="Apto, bloco..."
    />
  </div>
</div>

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

            <div className="pagamento-title">
  Pagamentos
</div>

<div className="pagamentos-box">

  {pagamentos.map((pagamentoItem) => (

    <div
      key={pagamentoItem.id}
      className="pagamento-item"
    >

      <select
        value={pagamentoItem.forma}
        onChange={(e) =>
          atualizarPagamento(
            pagamentoItem.id,
            "forma",
            e.target.value
          )
        }
      >

        <option value="DINHEIRO">
          Dinheiro
        </option>

        <option value="PIX">
          PIX
        </option>

        <option value="CREDITO">
          Cartão Crédito
        </option>

        <option value="DEBITO">
          Cartão Débito
        </option>

        <option value="CREDIARIO">
          Crediário / A Prazo
        </option>

      </select>

      <input
        type="number"
        step="0.01"
        value={pagamentoItem.valor}
        placeholder="0,00"
        onChange={(e) =>
          atualizarPagamento(
            pagamentoItem.id,
            "valor",
            e.target.value
          )
        }
      />

      {pagamentoItem.forma === "CREDIARIO" && (
  <input
    type="date"
    value={pagamentoItem.vencimento || ""}
    onChange={(e) =>
      atualizarPagamento(
        pagamentoItem.id,
        "vencimento",
        e.target.value
      )
    }
    required
    title="Data de vencimento do crediário"
  />
)}

      <button
        type="button"
        onClick={() =>
          removerPagamento(
            pagamentoItem.id
          )
        }
      >
        ×
      </button>

    </div>

  ))}

</div>

<button
  type="button"
  className="btn-adicionar-pagamento"
  onClick={adicionarPagamento}
>
  + Adicionar pagamento
</button>

<div className="resumo-pagamento">

  <p>
    <span>Total</span>
    <strong>
      {moeda(totalPedido)}
    </strong>
  </p>

  <p>
    <span>Pago</span>
    <strong>
      {moeda(totalPago)}
    </strong>
  </p>

  <p>
    <span>Restante</span>
    <strong>
      {moeda(restante)}
    </strong>
  </p>

  {troco > 0 && (
    <p>
      <span>Troco</span>
      <strong>
        {moeda(troco)}
      </strong>
    </p>
  )}

  {restante === 0 && totalPago > 0 && (
  <div className="pagamento-ok">
    ✅ Pagamento completo
  </div>
)}

</div>

           <button
  className="finalizar-pedido"
  onClick={finalizarPedido}
  disabled={
    pagamentos.length > 1 && restante > 0
  }
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

           {produtoPesoModal && (
  <div className="modal-overlay">
    <div className="modal">
      <h2>{produtoPesoModal.nome}</h2>

      <p>
        Unidade: <strong>{produtoPesoModal.unidadeMedida || "KG"}</strong>
      </p>

      <p>
        Preço:{" "}
        <strong>
          {moeda(produtoPesoModal.preco)} / {produtoPesoModal.unidadeMedida || "KG"}
        </strong>
      </p>

      
      <input
        type="text"
        inputMode="decimal"
        value={quantidadePeso}
        onChange={(e) => setQuantidadePeso(e.target.value)}
        placeholder="Ex.: 1,375"
      />

      <h3>
        Total:{" "}
        {moeda(
          Number(produtoPesoModal.preco || 0) *
            Number(String(quantidadePeso || 0).replace(",", "."))
        )}
        
      </h3>

        

      <div className="modal-buttons">
        <button className="btn-save" onClick={confirmarProdutoPeso}>
          Adicionar
        </button>

        <button
          className="btn-cancel"
          onClick={() => {
            setProdutoPesoModal(null);
            setQuantidadePeso("1");
          }}
        >
          
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}  

{produtoConfigModal && (
  <ProdutoConfigModal
    produto={produtoConfigModal}
    onClose={() => setProdutoConfigModal(null)}
    onConfirmar={confirmarProdutoConfigurado}
  />
)}

          </div>
        </AdminLayout>
    );
}