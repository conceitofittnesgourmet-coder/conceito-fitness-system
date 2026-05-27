const App = {
  apiUrl: "http://localhost:3001",

  state: {
    produtos: [],
    usuario: null
  },

  setProdutos(data) {
    this.state.produtos = data;
  },

  getProdutos() {
    return this.state.produtos;
  }
};