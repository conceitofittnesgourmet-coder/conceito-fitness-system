const API = {

  base: "http://localhost:3000",

  async getProdutos() {

    const res = await fetch(`${this.base}/produtos`);

    return res.json();
  }

};