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

  const subtotal = produtos.reduce((acc, item) => {
  const qtd = Number(item.quantidade || 1);

  const preco = Number(
    item.preco ||
    item.valorUnitario ||
    item.valor ||
    0
  );

  const totalItem = Number(
    item.subtotal ||
    item.total ||
    item.valorTotal ||
    qtd * preco
  );

  return acc + totalItem;
}, 0);

const taxaEntrega = Number(pedido.taxaEntrega || 0);
const desconto = Number(pedido.desconto || 0);
const total = Number(pedido.total || subtotal + taxaEntrega - desconto);

return (
  <div className="cupom-page">
    <div className="cupom">
      
      <h1>Conceito Fitness Gourmet</h1>

<p className="centro">
CUPOM NÃO FISCAL
</p>

<p className="centro">
Shopping Palladium
</p>

<p className="centro">
Loja L-111
</p>

<p className="centro">
Umuarama - PR
</p>

<p className="centro">
WhatsApp: (44) 99128-8775
</p>

<p className="centro">
CNPJ: 67.199.298/0001-81
</p>
      

      <hr />

      <p>
  <strong>Pedido Nº:</strong>{" "}
  {String(pedido.numeroPedido || 1).padStart(6, "0")}
</p>
      <p><strong>Data:</strong> {new Date().toLocaleDateString("pt-BR")}</p>
      <p><strong>Hora:</strong> {new Date().toLocaleTimeString("pt-BR")}</p>
      <p><strong>Cliente:</strong> {pedido.cliente || pedido.clienteNome || "Cliente Balcão"}</p>
      <p><strong>Telefone:</strong> {pedido.telefone || "-"}</p>
      <p><strong>Tipo:</strong> {pedido.tipo || pedido.mesa || "Balcão"}</p>        
      <p><strong>Pagamento:</strong> {pedido.pagamento || pedido.formaPagamento || "-"}</p>
      {pedido.observacao && (
  <>
    <hr />

    <div className="cupom-observacao">
      <strong>Observação:</strong>
      <p>{pedido.observacao}</p>
    </div>
  </>
)}

{(pedido.tipo === "delivery" || pedido.tipo === "entrega") && (
  <>
    <hr />

    <div className="cupom-entrega">
      <strong>ENTREGA</strong>

      <p>
  {pedido.enderecoEntrega}
</p>

{pedido.numeroEntrega && (
  <p>Número: {pedido.numeroEntrega}</p>
)}

{pedido.bairroEntrega && (
  <p>Bairro: {pedido.bairroEntrega}</p>
)}

{pedido.complementoEntrega && (
  <p>Complemento: {pedido.complementoEntrega}</p>
)}

      <p>{pedido.referenciaEntrega}</p>
    </div>
  </>
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