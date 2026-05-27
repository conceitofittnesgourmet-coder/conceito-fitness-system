function scrollParaProdutos() {
    const secao = document.querySelector("#produtos");

    if (secao) {
        secao.scrollIntoView({ behavior: "smooth" });
    }
}