async function initDashboard() {
  const produtos = await API.getProdutos();

  const total = produtos.length;

  const totalEl = document.getElementById("total-produtos");

  if (totalEl) {
    totalEl.innerText = total;
  }
}

document.addEventListener("DOMContentLoaded", initDashboard);