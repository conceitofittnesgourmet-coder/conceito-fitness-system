import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  FaArrowLeft,
  FaMinus,
  FaPlus,
  FaTrash,
  FaWhatsapp,
  FaCheckCircle,
} from "react-icons/fa";

import api from "../services/api";
import useCarrinhoStore from "../store/useCarrinhoStore";

function Carrinho() {
  const navigate = useNavigate();

  const {
    carrinho,
    aumentarQuantidade,
    diminuirQuantidade,
    removerProduto,
    limparCarrinho,
  } = useCarrinhoStore();

  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacao, setObservacao] = useState("");
  const [formaEntrega, setFormaEntrega] = useState("retirada");
  const [endereco, setEndereco] = useState("");
  const [loading, setLoading] = useState(false);

  const total = useMemo(() => {
    return carrinho.reduce((acc, item) => {
      return acc + Number(item.preco || 0) * Number(item.quantidade || 1);
    }, 0);
  }, [carrinho]);

  async function finalizarPedido() {
    try {
      if (carrinho.length === 0) {
        toast.error("Seu carrinho está vazio");
        return;
      }

      if (!cliente.trim()) {
        toast.error("Informe o nome do cliente");
        return;
      }

      if (!telefone.trim()) {
        toast.error("Informe o telefone");
        return;
      }

      if (formaEntrega === "entrega" && !endereco.trim()) {
        toast.error("Informe o endereço de entrega");
        return;
      }

      setLoading(true);

      const produtos = carrinho.map((item) => ({
        produto: item._id,
        nome: item.nome,
        quantidade: Number(item.quantidade || 1),
        preco: Number(item.preco || 0),
      }));

      const response = await api.post("/pedidos", {
        cliente,
        telefone,
        observacao,
        formaEntrega,
        endereco,
        produtos,
        total,
        status: "pendente",
      });

      const pedido = response.data.pedido;

      toast.success("Pedido realizado com sucesso!");

      limparCarrinho();

      navigate(`/tracking/${pedido._id}`);
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message || "Erro ao finalizar pedido"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="carrinho-page">
      <button className="voltar-cardapio" onClick={() => navigate("/cardapio")}>
        <FaArrowLeft />
        Voltar ao cardápio
      </button>

      <header className="carrinho-header">
        <div>
          <span>Conceito Fitness Gourmet</span>
          <h1>Finalizar Pedido</h1>
          <p>Confira seus itens e informe seus dados para envio à cozinha.</p>
        </div>
      </header>

      <div className="carrinho-layout">
        <section className="carrinho-itens">
          <h2>Itens do pedido</h2>

          {carrinho.length === 0 && (
            <div className="carrinho-vazio">
              <h3>Carrinho vazio</h3>
              <p>Escolha seus produtos no cardápio.</p>
              <button onClick={() => navigate("/cardapio")}>
                Ver cardápio
              </button>
            </div>
          )}

          {carrinho.map((item) => (
            <div key={item._id} className="carrinho-item">
              <div>
                <h3>{item.nome}</h3>
                <p>R$ {Number(item.preco || 0).toFixed(2)}</p>
              </div>

              <div className="quantidade-box">
                <button onClick={() => diminuirQuantidade(item._id)}>
                  <FaMinus />
                </button>

                <strong>{item.quantidade}</strong>

                <button onClick={() => aumentarQuantidade(item._id)}>
                  <FaPlus />
                </button>
              </div>

              <strong>
                R${" "}
                {(
                  Number(item.preco || 0) *
                  Number(item.quantidade || 1)
                ).toFixed(2)}
              </strong>

              <button
                className="remover-btn"
                onClick={() => removerProduto(item._id)}
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </section>

        <aside className="checkout-card">
          <h2>Dados do cliente</h2>

          <input
            type="text"
            placeholder="Nome do cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />

          <input
            type="text"
            placeholder="Telefone / WhatsApp"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />

          <div className="entrega-toggle">
            <button
              className={formaEntrega === "retirada" ? "active" : ""}
              onClick={() => setFormaEntrega("retirada")}
            >
              Retirada
            </button>

            <button
              className={formaEntrega === "entrega" ? "active" : ""}
              onClick={() => setFormaEntrega("entrega")}
            >
              Entrega
            </button>
          </div>

          {formaEntrega === "entrega" && (
            <input
              type="text"
              placeholder="Endereço de entrega"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />
          )}

          <textarea
            placeholder="Observações do pedido"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />

          <div className="checkout-total">
            <span>Total</span>
            <strong>R$ {total.toFixed(2)}</strong>
          </div>

          <button
            className="finalizar-btn"
            onClick={finalizarPedido}
            disabled={loading || carrinho.length === 0}
          >
            <FaCheckCircle />
            {loading ? "Enviando pedido..." : "Finalizar Pedido"}
          </button>

          <p className="checkout-info">
            <FaWhatsapp />
            Após finalizar, seu pedido será enviado automaticamente para a
            cozinha.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default Carrinho;