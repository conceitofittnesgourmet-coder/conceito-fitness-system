import React from "react";

const CupomPedido =
React.forwardRef(

({ pedido }, ref) => {

  if (!pedido) return null;

  return (

    <div
      ref={ref}
      style={{
        width:"300px",
        padding:"20px",
        fontFamily:"monospace",
        color:"#000",
        background:"#fff"
      }}
    >

      <h2>
        CONCEITO FITNESS
      </h2>

      <hr />

      <p>
        Pedido:
        {" "}
        {pedido._id?.slice(-6)}
      </p>

      <p>
        Cliente:
        {" "}
        {pedido.cliente}
      </p>

      <p>
        Telefone:
        {" "}
        {pedido.telefone}
      </p>

      <hr />

      <h3>
        ITENS
      </h3>

      {

        pedido.produtos?.map(
          (produto,index) => (

            <div key={index}>

              <p>

                {produto.nome}
                {" x"}
                {produto.quantidade}

              </p>

            </div>

          )
        )

      }

      <hr />

      <h2>

        TOTAL:
        {" "}
        R$
        {pedido.total}

      </h2>

      <hr />

      <p>
        Produção Gourmet
      </p>

    </div>

  );

});

export default CupomPedido;