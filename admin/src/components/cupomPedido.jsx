import React from "react";

const CupomPedido = React.forwardRef(({ pedido }, ref) => {
  if (!pedido) return null;

  const total = Number(pedido.total || 0);

  return (
    <div
      ref={ref}
      className="cupom-impressao"
      style={{
        width: "72mm",
        maxWidth: "72mm",
        padding: "4mm 3mm",
        fontFamily: "Arial, monospace",
        fontSize: "11px",
        lineHeight: "1.25",
        color: "#000",
        background: "#fff",
        margin: "0 auto",
      }}
    >
      <style>
        {`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }

            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 80mm !important;
              height: auto !important;
              background: #fff !important;
            }

            body * {
              visibility: hidden;
            }

            .cupom-impressao,
            .cupom-impressao * {
              visibility: visible;
            }

            .cupom-impressao {
              position: absolute;
              left: 0;
              top: 0;
              width: 72mm !important;
              max-width: 72mm !important;
              margin: 0 !important;
              padding: 4mm 3mm !important;
              page-break-after: avoid !important;
              page-break-before: avoid !important;
              break-after: avoid !important;
            }
          }
        `}
      </style>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "13px", fontWeight: "bold" }}>
          CONCEITO FITNESS
        </div>
        <div style={{ fontSize: "13px", fontWeight: "bold" }}>
          GOURMET
        </div>
        <div style={{ marginTop: "4px" }}>Cupom de venda</div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      <div>Pedido: {pedido._id?.slice(-6)}</div>
      <div>Cliente: {pedido.cliente}</div>
      <div>Telefone: {pedido.telefone || "-"}</div>
      <div>Tipo: {pedido.tipo || pedido.mesa || "Balcão"}</div>
      <div>Pagamento: {pedido.pagamento || "-"}</div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {pedido.produtos?.map((produto, index) => {
        const quantidade = Number(produto.quantidade || 1);
        const preco = Number(produto.preco || 0);
        const subtotal = quantidade * preco;

        return (
          <div key={index} style={{ marginBottom: "4px" }}>
            <div>
              {quantidade}x {produto.nome}
            </div>
            <div style={{ textAlign: "right" }}>
              R$ {subtotal.toFixed(2)}
            </div>
          </div>
        );
      })}

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "13px",
          fontWeight: "bold",
        }}
      >
        <span>Total</span>
        <span>R$ {total.toFixed(2)}</span>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      <div style={{ textAlign: "center", fontSize: "10px" }}>
        Obrigado pela preferência!
        <br />
        Alimentação saudável com sabor premium.
      </div>
    </div>
  );
});

export default CupomPedido;