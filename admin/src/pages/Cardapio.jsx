import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaShoppingCart, FaSearch, FaPlus } from "react-icons/fa";

import api from "../services/api";
import useCarrinhoStore from "../store/useCarrinhoStore";

const API_URL = "http://localhost:5000";

function getImagemUrl(imagem) {
  if (!imagem) {
    return "https://via.placeholder.com/500x350?text=Conceito+Fitness";
  }

  if (imagem.url) {
    return `${API_URL}${imagem.url}`;
  }

  return "https://via.placeholder.com/500x350?text=Conceito+Fitness";
}

function Cardapio() {
  const navigate = useNavigate();

  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  const carrinho = useCarrinhoStore((state) => state.carrinho);
  const adicionarProduto = useCarrinhoStore((state) => state.adicionarProduto);

  async function carregarProdutos() {
    try {
      setLoading(true);

      const response = await api.get("/produtos");

      setProdutos(response.data.produtos || []);
    } catch (error) {
      console.log(error);
      toast.error("Erro ao carregar cardápio");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const termo = busca.toLowerCase();

      return (
        produto.nome?.toLowerCase().includes(termo) ||
        produto.descricao?.toLowerCase().includes(termo) ||
        produto.categoria?.toLowerCase().includes(termo)
      );
    });
  }, [produtos, busca]);

  function adicionarAoCarrinho(produto) {
    adicionarProduto(produto);
    toast.success(`${produto.nome} adicionado ao carrinho`);
  }

  return (
    <div className="cardapio">
      <header className="cardapio-hero">
        <div>
          <span className="cardapio-label">Conceito Fitness Gourmet</span>

          <h1>Cardápio Saudável Gourmet</h1>

          <p>
            Produtos sem glúten, sem lactose e zero açúcar com experiência
            premium.
          </p>
        </div>

        <button className="cart-floating" onClick={() => navigate("/carrinho")}>
          <FaShoppingCart />
          Carrinho
          <strong>{carrinho.length}</strong>
        </button>
      </header>

      <div className="cardapio-search">
        <FaSearch />

        <input
          type="text"
          placeholder="Buscar produto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {loading && (
        <div className="card">
          <h2>Carregando cardápio...</h2>
        </div>
      )}

      {!loading && produtosFiltrados.length === 0 && (
        <div className="card">
          <h2>Nenhum produto encontrado</h2>
          <p>Cadastre produtos no painel administrativo.</p>
        </div>
      )}

      <div className="cardapio-grid">
        {produtosFiltrados.map((produto) => {
  const imagem = getImagemUrl(
  produto.imagens?.[0]
);

  return (
    <div key={produto._id} className="produto-card cliente-card">
      <div className="produto-imagem-box">
        <img src={imagem} alt={produto.nome} />

        {produto.estoque <= 0 && (
          <span className="produto-esgotado">Esgotado</span>
        )}
      </div>

              <div className="produto-card-body">
                <span className="produto-categoria">
                  {produto.categoria || "Gourmet"}
                </span>

                <h2>{produto.nome}</h2>

                <p>{produto.descricao || "Produto especial da casa."}</p>

                <div className="produto-card-footer">
                  <strong>R$ {Number(produto.preco || 0).toFixed(2)}</strong>

                  <button
                    disabled={produto.estoque <= 0}
                    onClick={() => adicionarAoCarrinho(produto)}
                  >
                    <FaPlus />
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Cardapio;