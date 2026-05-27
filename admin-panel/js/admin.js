const API_URL = "http://localhost:3000";

/* =========================
   ELEMENTOS
========================= */

const formProduto = document.getElementById("form-produto");
const listaProdutos = document.getElementById("lista-produtos");
const selectCategoria = document.getElementById("categoria");

/* =========================
   CARREGAR CATEGORIAS
========================= */

async function carregarCategorias() {

    try {

        const response = await fetch(`${API_URL}/categorias`);

        const categorias = await response.json();

        selectCategoria.innerHTML = `
            <option value="">Selecione categoria</option>
        `;

        categorias.forEach(cat => {

            selectCategoria.innerHTML += `
                <option value="${cat.nome}">
                    ${cat.nome}
                </option>
            `;

        });

    } catch (error) {

        console.log("Erro ao carregar categorias");

    }

}

/* =========================
   CADASTRAR PRODUTO
========================= */

formProduto.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

        const formData = new FormData();

        formData.append(
            "nome",
            document.getElementById("nome").value
        );

        formData.append(
            "preco",
            document.getElementById("preco").value
        );

        formData.append(
            "precoPromocional",
            document.getElementById("precoPromocional").value
        );

        formData.append(
            "estoque",
            document.getElementById("estoque").value
        );

        formData.append(
            "categoria",
            document.getElementById("categoria").value
        );

        formData.append(
            "descricao",
            document.getElementById("descricao").value
        );

        formData.append(
            "destaque",
            document.getElementById("destaque").checked
        );

        formData.append(
            "ativo",
            document.getElementById("ativo").checked
        );

        const imagem = document.getElementById("imagem").files[0];

        if (imagem) {

            formData.append("imagem", imagem);

        }

        const response = await fetch(`${API_URL}/produtos`, {

            method: "POST",

            body: formData

        });

        const data = await response.json();

        console.log(data);

        alert("Produto cadastrado com sucesso!");

        formProduto.reset();

        carregarProdutos();

    } catch (error) {

        console.log(error);

        alert("Erro ao cadastrar produto");

    }

});

/* =========================
   LISTAR PRODUTOS
========================= */

async function carregarProdutos() {

    try {

        const response = await fetch(`${API_URL}/produtos`);

        const produtos = await response.json();

        listaProdutos.innerHTML = "";

        produtos.forEach(produto => {

            listaProdutos.innerHTML += `
    
    <div class="produto-admin-card">

        <img
            src="http://localhost:3000/${produto.imagem}"
            alt="${produto.nome}"
        >

        <h3>
            ${produto.nome}
        </h3>

        <p>
            ${produto.categoria}
        </p>

        <div class="produto-admin-preco">
            R$ ${Number(produto.preco).toFixed(2)}
        </div>

        <div class="produto-admin-acoes">

            <button class="btn-editar">
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

`;

        });

    } catch (error) {

        console.log("Erro ao carregar produtos");

    }

}

/* =========================
   DELETAR
========================= */

async function deletarProduto(id) {

    const confirmar = confirm("Deseja excluir produto?");

    if (!confirmar) return;

    try {

        await fetch(`${API_URL}/produtos/${id}`, {

            method: "DELETE"

        });

        carregarProdutos();

    } catch (error) {

        console.log("Erro ao deletar");

    }

}

/* =========================
   INICIAR
========================= */

carregarCategorias();

carregarProdutos();