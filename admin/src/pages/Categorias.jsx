import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [nome, setNome] = useState("");

  async function carregarCategorias() {
    try {
      const response = await api.get("/categorias");

      setCategorias(response.data.categorias || []);
    } catch (error) {
      console.error(error);
    }
  }

  async function salvarCategoria(e) {
    e.preventDefault();

    try {
      await api.post("/categorias", {
        nome,
      });

      setNome("");

      carregarCategorias();
    } catch (error) {
      console.error(error);
    }
  }

  async function excluirCategoria(id) {
    if (!window.confirm("Excluir categoria?")) return;

    try {
      await api.delete(`/categorias/${id}`);

      carregarCategorias();
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    carregarCategorias();
  }, []);

  return (
    <AdminLayout
      title="Categorias"
      subtitle="Gerenciamento de categorias"
    >
      <div className="card">
        <form onSubmit={salvarCategoria}>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da categoria"
          />

          <button type="submit">
            Salvar
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Categorias cadastradas</h3>

        {categorias.map((categoria) => (
          <div
            key={categoria._id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span>{categoria.nome}</span>

            <button
              onClick={() =>
                excluirCategoria(categoria._id)
              }
            >
              Excluir
            </button>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

export default Categorias;