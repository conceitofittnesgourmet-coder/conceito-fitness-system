async function carregarProdutos() {

  const container = document.getElementById("products-grid");

  if (!container) return;

  try {

    const produtos = await API.getProdutos();

        container.innerHTML = "";

    produtos.forEach(produto => {

      container.innerHTML += `

        <div class="produto-card">

          <img 
            src="${produto.imagem || './assets/imagens/produtos/default.png'}" 
            alt="${produto.nome}"
          >

          <h3>${produto.nome}</h3>

          <p class="preco">
            R$ ${Number(produto.preco).toFixed(2)}
          </p>

          <button class="btn-adicionar">
            Adicionar
          </button>

        </div>

      `;
    });

  } catch (erro) {

    console.log("ERRO:", erro);

  }

}

document.addEventListener("DOMContentLoaded", carregarProdutos);

async function carregarCategorias() {

    try {

        const response = await fetch("http://localhost:3000/categorias");
        const categorias = await response.json();

        const container = document.getElementById("categorias");

        if (!container) return;

        container.innerHTML = `
            <button class="categoria-filtro active">
                TODOS
            </button>
        `;

        categorias.forEach(categoria => {

            container.innerHTML += `
                <button class="categoria-btn">
   ${categoria.nome}
</button>
            `;

        });

    } catch (error) {

        console.log("Erro categorias:", error);

    }

}

carregarCategorias();