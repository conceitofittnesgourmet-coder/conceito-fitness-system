// ==========================
// CATEGORIAS
// ==========================

async function carregarCategorias() {

    const res = await fetch(
        "http://localhost:3000/categorias"
    );

    const categorias = await res.json();

    const select = document.getElementById(
        "categoria"
    );

    const lista = document.getElementById(
        "lista-categorias"
    );

    if(select){

        select.innerHTML = `
            <option value="">
                Selecione categoria
            </option>
        `;

        categorias.forEach(cat => {

            select.innerHTML += `
                <option value="${cat.nome}">
                    ${cat.nome}
                </option>
            `;

        });

    }

    if(lista){

        lista.innerHTML = "";

        categorias.forEach(cat => {

            lista.innerHTML += `

                <div class="categoria-card">

                    <h3>${cat.nome}</h3>

                    <button onclick="
                        deletarCategoria(
                            '${cat._id}'
                        )
                    ">
                        Excluir
                    </button>

                </div>

            `;

        });

    }

}

async function criarCategoria() {

    const nome = document.getElementById(
        "nova-categoria"
    ).value;

    if(!nome){

        alert("Digite o nome");

        return;
    }

    const slug = nome
        .toLowerCase()
        .replace(/\s/g, "-");

    await fetch(
        "http://localhost:3000/categorias",
        {
            method: "POST",

            headers: {
                "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
                nome,
                slug
            })
        }
    );

    document.getElementById(
        "nova-categoria"
    ).value = "";

    carregarCategorias();

}

async function deletarCategoria(id){

    await fetch(
        `http://localhost:3000/categorias/${id}`,
        {
            method: "DELETE"
        }
    );

    carregarCategorias();

}

carregarCategorias();