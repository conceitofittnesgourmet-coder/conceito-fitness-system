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

  return (
    <div className="cupom-page">
      <div className="cupom">

        <h1>
          {empresa?.nomeFantasia ||
            "CONCEITO FITNESS GOURMET"}
        </h1>

        {empresa?.cnpj && (
          <p>
            CNPJ: {empresa.cnpj}
          </p>
        )}

        {empresa?.telefone && (
          <p>
            Tel: {empresa.telefone}
          </p>
        )}

        {empresa?.whatsapp && (
          <p>
            WhatsApp: {empresa.whatsapp}
          </p>
        )}

        <p>Cupom de venda</p>

        <hr />

        <p>
          <strong>Pedido:</strong>{" "}
          #{pedido._id?.slice(-6)}
        </p>

        <p>
          <strong>Cliente:</strong>{" "}
          {pedido.cliente ||
            "Cliente Balcão"}
        </p>

        <p>
          <strong>Telefone:</strong>{" "}
          {pedido.telefone || "-"}
        </p>

        <p>
          <strong>Tipo:</strong>{" "}
          {pedido.tipo ||
            pedido.mesa ||
            "Balcão"}
        </p>

        <p>
          <strong>Pagamento:</strong>{" "}
          {pedido.pagamento || "-"}
        </p>

        <hr />

        {produtos.map(
          (item, index) => (
            <div
              className="cupom-item"
              key={index}
            >
              <span>
                {item.quantidade || 1}x{" "}
                {item.nome ||
                  item.produto}
              </span>

              <strong>
                R${" "}
                {Number(
                  item.subtotal ||
                    Number(
                      item.preco || 0
                    ) *
                      Number(
                        item.quantidade ||
                          1
                      )
                ).toFixed(2)}
              </strong>
            </div>
          )
        )}

        <hr />

        <div className="cupom-total">
          <span>Total</span>

          <strong>
            R${" "}
            {Number(
              pedido.total || 0
            ).toFixed(2)}
          </strong>
        </div>

        {pedido.observacao && (
          <>
            <hr />

            <p>
              <strong>Obs:</strong>{" "}
              {pedido.observacao}
            </p>
          </>
        )}

        <hr />

        {empresa?.endereco && (
          <p
            style={{
              textAlign: "center",
              fontSize: "12px",
            }}
          >
            {empresa.endereco}
          </p>
        )}

        <p className="cupom-footer">
          {empresa?.mensagemCupom ||
            "Obrigado pela preferência! Alimentação saudável com sabor premium."}
        </p>
      </div>
    </div>
  );
}