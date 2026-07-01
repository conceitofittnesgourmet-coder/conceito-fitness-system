import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import "../styles/cupom.css";

export default function Cupom() {
  const { id } = useParams();

  const [pedido, setPedido] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [nfce, setNfce] = useState(null);
  const [carregado, setCarregado] = useState(false);
  const jaImprimiu = useRef(false);

  useEffect(() => {
    async function carregar() {
      try {
        const [pedidoRes, empresaRes, nfceRes] = await Promise.all([
          api.get(`/pedidos/${id}`),
          api.get("/empresa"),
          api.get("/nfce"),
        ]);

        const pedidoCarregado = pedidoRes.data.pedido || pedidoRes.data;
        const empresaCarregada = empresaRes.data.empresa || null;

        const listaNfce =
          nfceRes.data.nfces ||
          nfceRes.data.notas ||
          nfceRes.data ||
          [];

        const nfceDoPedido = Array.isArray(listaNfce)
          ? listaNfce.find((nota) => {
              const pedidoNota =
                nota.pedido?._id ||
                nota.pedido ||
                nota.pedidoId;

              return String(pedidoNota) === String(id);
            })
          : null;

        setPedido(pedidoCarregado);
        setEmpresa(empresaCarregada);
        setNfce(nfceDoPedido || null);
      } catch (error) {
        console.log("Erro ao carregar cupom:", error);
      } finally {
        setCarregado(true);
      }
    }

    carregar();
  }, [id]);

  useEffect(() => {
    if (!carregado || !pedido || jaImprimiu.current) return;

    jaImprimiu.current = true;

    const timer = setTimeout(() => {
      window.focus();
      window.print();
    }, 1200);

    return () => clearTimeout(timer);
  }, [carregado, pedido]);

  const produtos = useMemo(() => {
    return pedido?.produtos || pedido?.itens || [];
  }, [pedido]);

  const subtotal = useMemo(() => {
    return produtos.reduce((acc, item) => {
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
  }, [produtos]);

  function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function dataAtual() {
    return new Date().toLocaleDateString("pt-BR");
  }

  function horaAtual() {
    return new Date().toLocaleTimeString("pt-BR");
  }

  if (!carregado) {
    return <div>Carregando cupom...</div>;
  }

  if (!pedido) {
    return <div>Pedido não encontrado.</div>;
  }

  const taxaEntrega = Number(pedido.taxaEntrega || 0);
  const desconto = Number(pedido.desconto || 0);
  const total = Number(
    pedido.total || subtotal + taxaEntrega - desconto
  );

  const nfceAutorizada = nfce?.status === "autorizada";

  return (
    <div className="cupom-page">
      <div className="cupom">
        <h1>
          {empresa?.nomeFantasia ||
            empresa?.nome ||
            "Conceito Fitness Gourmet"}
        </h1>

        <p className="centro">
          {nfceAutorizada ? "DANFE NFC-e" : "CUPOM NÃO FISCAL"}
        </p>

        <p className="centro">Shopping Palladium</p>
        <p className="centro">Loja L-111</p>
        <p className="centro">Umuarama - PR</p>
        <p className="centro">WhatsApp: (44) 99128-8775</p>
        <p className="centro">CNPJ: 67.199.298/0001-81</p>

        <hr />

        <p>
          <strong>Pedido Nº:</strong>{" "}
          {String(pedido.numeroPedido || 1).padStart(6, "0")}
        </p>

        <p>
          <strong>Data:</strong> {dataAtual()}
        </p>

        <p>
          <strong>Hora:</strong> {horaAtual()}
        </p>

        <p>
          <strong>Cliente:</strong>{" "}
          {pedido.cliente ||
            pedido.clienteNome ||
            "Cliente Balcão"}
        </p>

        <p>
          <strong>Telefone:</strong> {pedido.telefone || "-"}
        </p>

        {pedido.cpfNota && (
          <p>
            <strong>CPF/CNPJ na nota:</strong> {pedido.cpfNota}
          </p>
        )}

        <p>
          <strong>Tipo:</strong>{" "}
          {pedido.tipo || pedido.mesa || "Balcão"}
        </p>

        <p>
          <strong>Pagamento:</strong>{" "}
          {pedido.pagamento || pedido.formaPagamento || "-"}
        </p>

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
              <p>{pedido.enderecoEntrega}</p>

              {pedido.numeroEntrega && (
                <p>Número: {pedido.numeroEntrega}</p>
              )}

              {pedido.bairroEntrega && (
                <p>Bairro: {pedido.bairroEntrega}</p>
              )}

              {pedido.complementoEntrega && (
                <p>Complemento: {pedido.complementoEntrega}</p>
              )}

              {pedido.referenciaEntrega && (
                <p>{pedido.referenciaEntrega}</p>
              )}
            </div>
          </>
        )}

        <hr />

        {produtos.map((item, index) => {
          const qtd = Number(item.quantidade || 1);
          const preco = Number(item.preco || item.valorUnitario || 0);
          const totalItem = Number(
            item.subtotal || item.total || qtd * preco
          );

          return (
            <div className="cupom-item" key={index}>
              <span>
                {qtd}x{" "}
                {item.nome ||
                  item.produtoNome ||
                  item.produto ||
                  "Produto"}
              </span>

              <strong>{moeda(totalItem)}</strong>
            </div>
          );
        })}

        {produtos.length === 0 && (
          <p className="centro">Nenhum item encontrado.</p>
        )}

        <hr />

        <div className="cupom-linha">
          <span>Subtotal</span>
          <strong>{moeda(subtotal)}</strong>
        </div>

        <div className="cupom-linha">
          <span>Taxa de entrega</span>
          <strong>{moeda(taxaEntrega)}</strong>
        </div>

        <div className="cupom-linha">
          <span>Desconto</span>
          <strong>- {moeda(desconto)}</strong>
        </div>

        <div className="cupom-total">
          <span>Total</span>
          <strong>{moeda(total)}</strong>
        </div>

        {nfceAutorizada && (
          <>
            <hr />

            <p className="centro">
              <strong>NFC-e Nº:</strong> {nfce.numero}
            </p>

            <p className="centro">
              <strong>Série:</strong> {nfce.serie}
            </p>

            <p className="centro">
              <strong>Protocolo:</strong> {nfce.protocolo || "-"}
            </p>

            <p className="centro">
              <strong>Chave de acesso:</strong>
              <br />
              {nfce.chaveAcesso}
            </p>

            {nfce.qrCodeUrl && (
              <div className="centro">
                <img
                  alt="QR Code NFC-e"
                  style={{
                    width: 180,
                    height: 180,
                    margin: "10px auto",
                    display: "block",
                  }}
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    nfce.qrCodeUrl
                  )}`}
                />

                <p>Consulte pela chave de acesso ou pelo QR Code.</p>
              </div>
            )}
          </>
        )}

        <hr />

        <p className="cupom-footer">
          Obrigado pela preferência!
          <br />
          Alimentação saudável com sabor premium.
        </p>
      </div>
    </div>
  );
}