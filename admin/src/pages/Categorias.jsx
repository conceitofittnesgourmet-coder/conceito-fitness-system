import { useEffect, useState } from "react";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaTags,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import toast from "react-hot-toast";

import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";

const tipos = [
  { value: "produto", label: "Produto" },
  { value: "combo", label: "Combo" },
  { value: "kit", label: "Kit / Cesta" },
  { value: "bolo", label: "Bolo Personalizado" },
  { value: "sazonal", label: "Sazonal" },
];

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [editando, setEditando] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    icone: "🍰",
    cor: "#22c55e",
    tipo: "produto",
    ordem: 0,
    ativo: true,
    mostrarPdv: true,
    mostrarCardapio: true,
    mostrarDelivery: true,
  });

  function atualizarCampo(campo, valor) {
    setForm((old) => ({
      ...old,
      [campo]: valor,
    }));
  }

  function limparFormulario() {
    setEditando(null);
    setForm({
      nome: "",
      descricao: "",
      icone: "🍰",
      cor: "#22c55e",
      tipo: "produto",
      ordem: 0,
      ativo: true,
      mostrarPdv: true,
      mostrarCardapio: true,
      mostrarDelivery: true,
    });
  }

  async function carregarCategorias() {
    try {
      const response = await api.get("/categorias");
      setCategorias(response.data.categorias || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar categorias");
    }
  }

  async function salvarCategoria(e) {
    e.preventDefault();

    if (!form.nome.trim()) {
      toast.error("Informe o nome da categoria");
      return;
    }

    try {
      setLoading(true);

      if (editando) {
        await api.put(`/categorias/${editando._id}`, form);
        toast.success("Categoria atualizada!");
      } else {
        await api.post("/categorias", form);
        toast.success("Categoria cadastrada!");
      }

      limparFormulario();
      carregarCategorias();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Erro ao salvar categoria");
    } finally {
      setLoading(false);
    }
  }

  function editarCategoria(categoria) {
    setEditando(categoria);
    setForm({
      nome: categoria.nome || "",
      descricao: categoria.descricao || "",
      icone: categoria.icone || "🍰",
      cor: categoria.cor || "#22c55e",
      tipo: categoria.tipo || "produto",
      ordem: categoria.ordem || 0,
      ativo: categoria.ativo !== false,
      mostrarPdv: categoria.mostrarPdv !== false,
      mostrarCardapio: categoria.mostrarCardapio !== false,
      mostrarDelivery: categoria.mostrarDelivery !== false,
    });
  }

  async function excluirCategoria(id) {
    if (!window.confirm("Deseja excluir esta categoria?")) return;

    try {
      await api.delete(`/categorias/${id}`);
      toast.success("Categoria excluída!");
      carregarCategorias();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir categoria");
    }
  }

  async function alternarAtivo(categoria) {
    try {
      await api.put(`/categorias/${categoria._id}`, {
        ativo: !categoria.ativo,
      });

      carregarCategorias();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao alterar status");
    }
  }

  useEffect(() => {
    carregarCategorias();
  }, []);

  return (
    <AdminLayout
      title="Categorias"
      subtitle="Organize produtos, cardápio, PDV, combos, kits e campanhas"
    >
      <div className="produtos-premium-page">
        <section className="produto-form-premium">
          <div className="form-title-premium">
            <FaTags />
            <h2>{editando ? "Editar Categoria" : "Nova Categoria"}</h2>
          </div>

          <form onSubmit={salvarCategoria}>
            <div className="form-row-premium">
              <div className="field-premium">
                <label>Nome da categoria *</label>
                <input
                  placeholder="Ex.: Bolos, Low Carb, Páscoa"
                  value={form.nome}
                  onChange={(e) => atualizarCampo("nome", e.target.value)}
                />
              </div>

              <div className="field-premium">
                <label>Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => atualizarCampo("tipo", e.target.value)}
                >
                  {tipos.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-premium">
                <label>Ordem</label>
                <input
                  type="number"
                  value={form.ordem}
                  onChange={(e) => atualizarCampo("ordem", e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-premium">
              <div className="field-premium">
                <label>Ícone</label>
                <input
                  placeholder="🍰"
                  value={form.icone}
                  onChange={(e) => atualizarCampo("icone", e.target.value)}
                />
              </div>

              <div className="field-premium">
                <label>Cor</label>
                <input
                  type="color"
                  value={form.cor}
                  onChange={(e) => atualizarCampo("cor", e.target.value)}
                />
              </div>

              <div className="field-premium full">
                <label>Descrição</label>
                <input
                  placeholder="Descrição curta da categoria"
                  value={form.descricao}
                  onChange={(e) => atualizarCampo("descricao", e.target.value)}
                />
              </div>
            </div>

            <div className="premium-box">
              <h3>Exibição</h3>

              <div className="mini-grid">
                <label className="premium-switch">
                  <div>
                    <strong>Ativa</strong>
                    <span>Categoria disponível no sistema</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => atualizarCampo("ativo", e.target.checked)}
                  />
                </label>

                <label className="premium-switch">
                  <div>
                    <strong>Mostrar no PDV</strong>
                    <span>Aparece nas vendas internas</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.mostrarPdv}
                    onChange={(e) =>
                      atualizarCampo("mostrarPdv", e.target.checked)
                    }
                  />
                </label>

                <label className="premium-switch">
                  <div>
                    <strong>Mostrar no Cardápio</strong>
                    <span>Aparece no cardápio online</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.mostrarCardapio}
                    onChange={(e) =>
                      atualizarCampo("mostrarCardapio", e.target.checked)
                    }
                  />
                </label>

                <label className="premium-switch">
                  <div>
                    <strong>Mostrar no Delivery</strong>
                    <span>Aparece no delivery</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.mostrarDelivery}
                    onChange={(e) =>
                      atualizarCampo("mostrarDelivery", e.target.checked)
                    }
                  />
                </label>
              </div>
            </div>

            <div className="form-actions-premium">
              <button
                type="button"
                className="clear-btn-premium"
                onClick={limparFormulario}
              >
                Limpar
              </button>

              <button
                type="submit"
                className="save-btn-premium"
                disabled={loading}
              >
                <FaPlus />
                {loading
                  ? "Salvando..."
                  : editando
                  ? "Atualizar Categoria"
                  : "Cadastrar Categoria"}
              </button>
            </div>
          </form>
        </section>

        <section className="produtos-list-premium">
          <div className="list-header-premium">
            <h2>
              <FaTags />
              Categorias cadastradas
            </h2>
          </div>

          <div className="produtos-grid-premium">
            {categorias.map((categoria) => (
              <div className="produto-card-premium" key={categoria._id}>
                <div
                  style={{
                    height: 90,
                    background: categoria.cor || "#22c55e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 42,
                    color: "#fff",
                    borderRadius: "18px 18px 0 0",
                  }}
                >
                  {categoria.icone || "🏷️"}
                </div>

                <div className="produto-body-premium">
                  <h3>{categoria.nome}</h3>

                  <p>{categoria.descricao || "Sem descrição"}</p>

                  <div className="chips-premium">
                    <span>{categoria.tipo}</span>
                    <span>Ordem {categoria.ordem || 0}</span>
                    <span>{categoria.ativo ? "Ativa" : "Inativa"}</span>
                  </div>

                  <div className="chips-premium">
                    {categoria.mostrarPdv && <span>PDV</span>}
                    {categoria.mostrarCardapio && <span>Cardápio</span>}
                    {categoria.mostrarDelivery && <span>Delivery</span>}
                  </div>

                  <div className="card-actions-premium">
                    <button
                      className="edit-premium"
                      onClick={() => editarCategoria(categoria)}
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="edit-premium"
                      onClick={() => alternarAtivo(categoria)}
                    >
                      {categoria.ativo ? <FaEye /> : <FaEyeSlash />}
                    </button>

                    <button
                      className="delete-premium"
                      onClick={() => excluirCategoria(categoria._id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {categorias.length === 0 && (
              <div className="empty-preview">
                <FaTags />
                <strong>Nenhuma categoria cadastrada</strong>
                <span>Cadastre sua primeira categoria acima</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default Categorias;