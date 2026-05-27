const API = {

  base: "http://localhost:3000",

  async getProdutos() {

    const res = await fetch(
      `${this.base}/produtos`
    );

    return res.json();

  },

  async criarProduto(data) {

    const res = await fetch(
      `${this.base}/produtos`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(data)
      }
    );

    return res.json();

  },

  async deletarProduto(id) {

    await fetch(
      `${this.base}/produtos/${id}`,
      {
        method: "DELETE"
      }
    );

  },

  async atualizarProduto(id, data) {

    const res = await fetch(
      `${this.base}/produtos/${id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(data)
      }
    );

    return res.json();

  }

};