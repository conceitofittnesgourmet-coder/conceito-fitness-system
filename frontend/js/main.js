document.addEventListener("DOMContentLoaded", async () => {

    console.log("🚀 Sistema iniciado");

    await carregarProdutos();

});


/* =========================
   API BASE
========================= */

const API_URL = "http://localhost:3000";


/* =========================
   CARREGAR PRODUTOS
========================= */

async function carregarProdutos() {

    try {

        const resposta = await fetch(`${API_URL}/produtos`);

        const produtos = await resposta.json();

        console.log("📦 Produtos recebidos:", produtos);

        renderizarProdutos(produtos);

        atualizarContadores(produtos);

    } catch (erro) {

        console.error("❌ Erro ao carregar produtos:", erro);

    }

}


/* =========================
   RENDERIZAR PRODUTOS
========================= */

function renderizarProdutos(produtos) {

    const container =
        document.getElementById("products-grid") ||
        document.getElementById("produtos-container") ||
        document.getElementById("lista-produtos");

    if (!container) {

        console.warn("⚠️ Container de produtos não encontrado");
        return;

    }

    container.innerHTML = "";

    if (!produtos.length) {

        container.innerHTML = `

            <div class="sem-produtos">

                <h3>
                    Nenhum produto cadastrado
                </h3>

                <p>
                    Cadastre produtos no painel administrativo.
                </p>

            </div>

        `;

        return;

    }

    produtos.forEach(produto => {

        const imagem = produto.imagem
            ? `${API_URL}/${produto.imagem}`
            : "./assets/imagens/produtos/sem-imagem.jpg";

        const preco = Number(produto.preco || 0).toFixed(2);

        const precoPromocional =
            produto.precoPromocional &&
            Number(produto.precoPromocional) > 0;

        const card = document.createElement("div");

        card.className = "produto-card";

        card.innerHTML = `

            <div class="produto-imagem">

                <img
                    src="${imagem}"
                    alt="${produto.nome}"
                    loading="lazy"
                >

                ${produto.destaque ? `
                    <span class="badge-destaque">
                        Destaque
                    </span>
                ` : ""}

            </div>

            <div class="produto-info">

                <span class="produto-categoria">
                    ${produto.categoria || "Produtos"}
                </span>

                <h3>
                    ${produto.nome}
                </h3>

                <p class="produto-descricao">
                    ${produto.descricao || ""}
                </p>

                <div class="produto-precos">

                    ${precoPromocional ? `

                        <span class="preco-antigo">
                            R$ ${preco}
                        </span>

                        <span class="preco-promocional">
                            R$ ${Number(produto.precoPromocional).toFixed(2)}
                        </span>

                    ` : `

                        <span class="preco-normal">
                            R$ ${preco}
                        </span>

                    `}

                </div>

                <button class="btn-comprar">

                    Pedir Agora

                </button>

            </div>

        `;

        container.appendChild(card);

    });

}


/* =========================
   CONTADORES
========================= */

function atualizarContadores(produtos) {

    const totalProdutos =
        document.getElementById("total-produtos");

    if (totalProdutos) {

        totalProdutos.textContent = produtos.length;

    }

}


/* =========================
   FILTROS
========================= */

async function filtrarCategoria(categoria) {

    try {

        const resposta = await fetch(`${API_URL}/produtos`);

        let produtos = await resposta.json();

        if (categoria !== "todos") {

            produtos = produtos.filter(produto =>
                produto.categoria &&
                produto.categoria.toLowerCase() === categoria.toLowerCase()
            );

        }

        renderizarProdutos(produtos);

        atualizarBotoesFiltro(categoria);

    } catch (erro) {

        console.error("Erro ao filtrar:", erro);

    }

}


/* =========================
   BOTÕES FILTRO
========================= */

function atualizarBotoesFiltro(categoria) {

    const botoes =
        document.querySelectorAll(".categoria-btn");

    botoes.forEach(btn => {

        btn.classList.remove("ativo");

        if (
            btn.dataset.categoria === categoria
        ) {

            btn.classList.add("ativo");

        }

    });

}


/* =========================
   PESQUISA
========================= */

async function pesquisarProdutos(texto) {

    try {

        const resposta = await fetch(`${API_URL}/produtos`);

        let produtos = await resposta.json();

        produtos = produtos.filter(produto =>

            produto.nome
                .toLowerCase()
                .includes(texto.toLowerCase())

        );

        renderizarProdutos(produtos);

    } catch (erro) {

        console.error("Erro na pesquisa:", erro);

    }

}


/* =========================
   SCROLL SUAVE
========================= */

document.querySelectorAll('a[href^="#"]').forEach(link => {

    link.addEventListener("click", e => {

        e.preventDefault();

        const destino =
            document.querySelector(
                link.getAttribute("href")
            );

        if (destino) {

            destino.scrollIntoView({

                behavior: "smooth"

            });

        }

    });

});


/* =========================
   SISTEMA ONLINE
========================= */

console.log("✅ Frontend carregado com sucesso");