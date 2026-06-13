import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import "../styles/cupom.css";

export default function Cupom() {
  const { id } = useParams();

  const [pedido, setPedido] = useState(null);
  const [empresa, setEmpresa] = useState(null);

  useEffect(() => {
    async function carregar() {
      try {
        const [pedidoRes, empresaRes] = await Promise.all([
          api.get(`/pedidos/${id}`),
          api.get("/empresa"),
        ]);

        setPedido(
          pedidoRes.data.pedido || pedidoRes.data
        );

        setEmpresa(
          empresaRes.data.empresa || null
        );

        setTimeout(() => {
          window.print();
        }, 600);
      } catch (error) {
        console.log(error);
      }
    }

    carregar();
  }, [id]);

  if (!pedido) {
    return <div>Carregando cupom...</div>;
  }

  const produtos =
    pedido.produtos ||
    pedido.itens ||
    [];

  const subtotalCalculado = produtos.reduce((acc, item) => {
  const qtd = Number(item.quantidade || 1);
  const preco = Number(item.preco || item.valorUnitario || 0);
  return acc + qtd * preco;
}, 0);

const subtotal = Number(
  pedido.subtotal ||
  pedido.valorProdutos ||
  pedido.totalItens ||
  subtotalCalculado ||
  0
);

const taxaEntrega = Number(
  pedido.taxaEntrega ||
  pedido.taxa ||
  pedido.valorEntrega ||
  0
);

const desconto = Number(pedido.desconto || 0);

const total = Number(
  pedido.total ||
  subtotal + taxaEntrega - desconto
);

return (
  <div className="cupom-page">
    <div className="cupom">
      <h1>Conceito Fitness Gourmet</h1>

      <p className="centro">CUPOM NÃO FISCAL</p>
      <p className="centro">Shopping Palladium - Loja L-111</p>
      <p className="centro">Umuarama - PR</p>
      <p className="centro">WhatsApp: (44) 99128-8775</p>

      <hr />

      <p><strong>Pedido:</strong> #{pedido._id?.slice(-6)}</p>
      <p><strong>Data:</strong> {new Date().toLocaleDateString("pt-BR")}</p>
      <p><strong>Hora:</strong> {new Date().toLocaleTimeString("pt-BR")}</p>
      <p><strong>Cliente:</strong> {pedido.cliente || pedido.clienteNome || "Cliente Balcão"}</p>
      <p><strong>Telefone:</strong> {pedido.telefone || "-"}</p>
      <p><strong>Tipo:</strong> {pedido.tipo || pedido.mesa || "Balcão"}</p>

      {(pedido.endereco || pedido.enderecoEntrega) && (
        <p>
          <strong>Endereço:</strong>{" "}
          {pedido.endereco || pedido.enderecoEntrega}
        </p>
      )}

      <p><strong>Pagamento:</strong> {pedido.pagamento || pedido.formaPagamento || "-"}</p>

      {pedido.observacao && (
        <p><strong>Obs:</strong> {pedido.observacao}</p>
      )}

      <hr />

      {produtos.map((item, index) => {
        const qtd = Number(item.quantidade || 1);
        const preco = Number(item.preco || item.valorUnitario || 0);
        const totalItem = Number(item.subtotal || item.total || qtd * preco);

        return (
          <div className="cupom-item" key={index}>
            <span>{qtd}x {item.nome || item.produtoNome || item.produto}</span>
            <strong>
              {totalItem.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </strong>
          </div>
        );
      })}

      <hr />

      <div className="cupom-linha">
        <span>Subtotal</span>
        <strong>{subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
      </div>

      <div className="cupom-linha">
        <span>Taxa de entrega</span>
        <strong>{taxaEntrega.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
      </div>

      <div className="cupom-linha">
        <span>Desconto</span>
        <strong>- {desconto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
      </div>

      <div className="cupom-total">
        <span>Total</span>
        <strong>{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
      </div>

      <hr />

      <p className="cupom-footer">
        Obrigado pela preferência!<br />
        Alimentação saudável com sabor premium.
      </p>
    </div>
  </div>
);
}