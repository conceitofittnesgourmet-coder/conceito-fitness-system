const form = document.getElementById(
  "produto-form"
);

const lista = document.getElementById(
  "lista-produtos"
);

async function carregarProdutos() {

  const produtos = await API.getProdutos();

  App.setProdutos(produtos);

  renderizarProdutos();

  atualizarDashboard();

}

function atualizarDashboard() {

  const produtos = App.getProdutos();

  document.getElementById(
    "total-produtos"
  ).innerText = produtos.length;

  const categorias = [
    ...new Set(
      produtos.map(p => p.categoria)
    )
  ];

  document.getElementById(
    "total-categorias"
  ).innerText = categorias.length;

}

function renderizarProdutos() {

  lista.innerHTML = "";

  App.getProdutos().forEach(produto => {

    lista.innerHTML += `

      <div class="produto-card">

        <img
          src="${
            produto.imagem ||
            'https://via.placeholder.com/300'
          }"
        >

        <div class="produto-info">

          <h3>
            ${produto.nome}
          </h3>

          <p>
            ${produto.descricao || ""}
          </p>

          <div class="preco">
            R$ ${Number(produto.preco).toFixed(2)}
          </div>

          <div class="card-actions">

            <button
              class="btn-editar"
              onclick="editarProduto('${produto._id}')"
            >
              Editar
            </button>

            <button
              class="btn-excluir"
              onclick="deletarProduto('${produto._id}')"
            >
              Excluir
            </button>

          </div>

        </div>

      </div>

    `;

  });

}

form.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    const data = {

      nome:
        document.getElementById("nome").value,

      preco:
        Number(
          document.getElementById("preco").value
        ),

      precoPromocional:
        Number(
          document.getElementById(
            "precoPromocional"
          ).value
        ),

      estoque:
        Number(
          document.getElementById("estoque").value
        ),

      categoria:
        document.getElementById("categoria").value,

      imagem:
        document.getElementById("imagem").value,

      descricao:
        document.getElementById("descricao").value,

      destaque:
        document.getElementById("destaque").checked,

      ativo:
        document.getElementById("ativo").checked

    };

    await API.criarProduto(data);

    form.reset();

    carregarProdutos();

    alert("Produto cadastrado!");

  }
);

async function deletarProduto(id) {

  const confirmar = confirm(
    "Deseja excluir este produto?"
  );

  if (!confirmar) return;

  await API.deletarProduto(id);

  carregarProdutos();

}

async function editarProduto(id) {

  const produto = App
    .getProdutos()
    .find(p => p._id === id);

  const novoNome = prompt(
    "Novo nome:",
    produto.nome
  );

  if (!novoNome) return;

  const novoPreco = prompt(
    "Novo preço:",
    produto.preco
  );

  await API.atualizarProduto(
    id,
    {
      nome: novoNome,
      preco: Number(novoPreco)
    }
  );

  carregarProdutos();

}

carregarProdutos();