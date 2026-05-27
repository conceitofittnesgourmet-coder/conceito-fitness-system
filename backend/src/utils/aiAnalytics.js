function analisarPedidos(
  pedidos
) {

  // ==========================================
  // HORÁRIO PICO
  // ==========================================

  const horas = {};





  pedidos.forEach(
    (pedido) => {

      const hora =
        new Date(

          pedido.createdAt

        ).getHours();





      if (!horas[hora]) {

        horas[hora] = 0;

      }





      horas[hora]++;

    }
  );





  const horarioPico =

    Object.entries(horas)

      .sort(

        (a, b) =>
          b[1] - a[1]

      )[0];





  // ==========================================
  // PRODUTOS
  // ==========================================

  const ranking = {};





  pedidos.forEach(
    (pedido) => {

      pedido.produtos?.forEach(
        (produto) => {

          if (

            !ranking[
              produto.nome
            ]

          ) {

            ranking[
              produto.nome
            ] = 0;

          }





          ranking[
            produto.nome
          ] +=
            produto.quantidade;

        }
      );

    }
  );





  const produtosOrdenados =

    Object.entries(ranking)

      .sort(

        (a, b) =>
          b[1] - a[1]

      );





  const campeao =
    produtosOrdenados[0];





  const fraco =
    produtosOrdenados[
      produtosOrdenados.length - 1
    ];





  // ==========================================
  // INSIGHTS IA
  // ==========================================

  const insights = [];





  if (horarioPico) {

    insights.push(

      `Maior movimento às ${horarioPico[0]}h`

    );

  }





  if (campeao) {

    insights.push(

      `${campeao[0]} lidera vendas`

    );

  }





  if (fraco) {

    insights.push(

      `${fraco[0]} possui baixa saída`

    );

  }





  if (pedidos.length > 20) {

    insights.push(

      "Volume operacional elevado"

    );

  }





  return {

    horarioPico,

    campeao,

    fraco,

    insights

  };

}

module.exports = {
  analisarPedidos
};