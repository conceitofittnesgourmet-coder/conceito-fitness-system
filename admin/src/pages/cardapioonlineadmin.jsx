import AdminLayout from "../layouts/AdminLayout";

export default function CardapioOnlineAdmin() {
  const linkCardapio = "https://www.conceitofitgourmet.com.br/cardapio";

  function copiarLink() {
    navigator.clipboard.writeText(linkCardapio);
    alert("Link copiado!");
  }

  return (
    <AdminLayout
      title="Cardápio Online"
      subtitle="Acesse e compartilhe o cardápio com clientes"
    >
      <div className="card-premium">
        <h2>Cardápio Online</h2>

        <p>{linkCardapio}</p>

        <button onClick={copiarLink}>
          Copiar link
        </button>

        <a href={linkCardapio} target="_blank" rel="noreferrer">
          Abrir cardápio
        </a>
      </div>
    </AdminLayout>
  );
}