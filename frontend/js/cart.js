let carrinho = [];

function adicionarAoCarrinho(id) {
    const produto = listaProdutos.find(p => p.id === id);

    if (!produto) return;

    carrinho.push(produto);

    atualizarCarrinho();
}

function atualizarCarrinho() {
    const contador = document.querySelector("#cart-count");

    if (contador) {
        contador.textContent = carrinho.length;
    }

    console.log("Carrinho:", carrinho);
}

function gerarPedidoWhatsApp() {
    if (carrinho.length === 0) {
        alert("Carrinho vazio");
        return;
    }

    let mensagem = "Olá, gostaria de fazer um pedido:%0A";

    carrinho.forEach(item => {
        mensagem += `- ${item.nome} (R$ ${item.preco})%0A`;
    });

    const telefone = "5544999999999"; // ALTERA AQUI
    const url = `https://wa.me/${telefone}?text=${mensagem}`;

    window.open(url, "_blank");
}