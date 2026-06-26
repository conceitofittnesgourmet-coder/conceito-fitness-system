import { useEffect, useState } from "react";
import {
  FaLayerGroup,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import toast from "react-hot-toast";

import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";

const tipos = [
  { value: "massa", label: "Massa" },
  { value: "recheio", label: "Recheio" },
  { value: "cobertura", label: "Cobertura" },
  { value: "bebida", label: "Bebida" },
  { value: "doce", label: "Doce" },
  { value: "salgado", label: "Salgado" },
  { value: "adicional", label: "Adicional" },
  { value: "tamanho", label: "Tamanho" },
  { value: "personalizado", label: "Personalizado" },
];

function GruposComponentes() {
  const [grupos, setGrupos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    tipo: "personalizado",
    obrigatorio: false,
    minimoEscolhas: 0,
    maximoEscolhas: 1,
    ordem: 0,
    ativo: true,
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
      tipo: "personalizado",
      obrigatorio: false,
      minimoEscolhas: 0,
      maximoEscolhas: 1,
      ordem: 0,
      ativo: true,
    });
  }

  async function carregarGrupos() {
    try {
      const response = await api.get("/grupos-componentes");
      setGrupos(response.data.grupos || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar grupos");
    }
  }

  async function salvarGrupo(e) {
    e.preventDefault();

    if (!form.nome.trim()) {
      toast.error("Informe o nome do grupo");
      return;
    }

    try {
      setLoading(true);

      if (editando) {
        await api.put(`/grupos-componentes/${editando._id}`, form);
        toast.success("Grupo atualizado!");
      } else {
        await api.post("/grupos-componentes", form);
        toast.success("Grupo cadastrado!");
      }

      limparFormulario();
      carregarGrupos();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Erro ao salvar grupo");
    } finally {
      setLoading(false);
    }
  }

  function editarGrupo(grupo) {
    setEditando(grupo);

    setForm({
      nome: grupo.nome || "",
      descricao: grupo.descricao || "",
      tipo: grupo.tipo || "personalizado",
      obrigatorio: Boolean(grupo.obrigatorio),
      minimoEscolhas: grupo.minimoEscolhas || 0,
      maximoEscolhas: grupo.maximoEscolhas || 1,
      ordem: grupo.ordem || 0,
      ativo: grupo.ativo !== false,
    });
  }

  async function excluirGrupo(id) {
    if (!window.confirm("Deseja excluir este grupo?")) return;

    try {
      await api.delete(`/grupos-componentes/${id}`);
      toast.success("Grupo excluído!");
      carregarGrupos();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir grupo");
    }
  }

  useEffect(() => {
    carregarGrupos();
  }, []);

  return (
    <AdminLayout
      title="Grupos de Componentes"
      subtitle="Base para combos, kits, cestas e bolos personalizados"
    >
      <div className="produtos-premium-page">
        <section className="produto-form-premium">
          <div className="form-title-premium">
            <FaLayerGroup />
            <h2>{editando ? "Editar Grupo" : "Novo Grupo"}</h2>
          </div>

          <form onSubmit={salvarGrupo}>
            <div className="form-row-premium">
              <div className="field-premium">
                <label>Nome do grupo *</label>
                <input
                  placeholder="Ex.: Massas, Recheios, Bebidas"
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
              <div className="field-premium full">
                <label>Descrição</label>
                <input
                  placeholder="Ex.: Escolha a massa do bolo"
                  value={form.descricao}
                  onChange={(e) =>
                    atualizarCampo("descricao", e.target.value)
                  }
                />
              </div>

              <div className="field-premium">
                <label>Mínimo de escolhas</label>
                <input
                  type="number"
                  value={form.minimoEscolhas}
                  onChange={(e) =>
                    atualizarCampo("minimoEscolhas", e.target.value)
                  }
                />
              </div>

              <div className="field-premium">
                <label>Máximo de escolhas</label>
                <input
                  type="number"
                  value={form.maximoEscolhas}
                  onChange={(e) =>
                    atualizarCampo("maximoEscolhas", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="premium-box">
              <h3>Regras do grupo</h3>

              <div className="mini-grid">
                <label className="premium-switch">
                  <div>
                    <strong>Obrigatório</strong>
                    <span>Cliente precisa escolher esta etapa</span>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.obrigatorio}
                    onChange={(e) =>
                      atualizarCampo("obrigatorio", e.target.checked)
                    }
                  />
                </label>

                <label className="premium-switch">
                  <div>
                    <strong>Ativo</strong>
                    <span>Disponível para uso nos produtos</span>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) =>
                      atualizarCampo("ativo", e.target.checked)
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
                  ? "Atualizar Grupo"
                  : "Cadastrar Grupo"}
              </button>
            </div>
          </form>
        </section>

        <section className="produtos-list-premium">
          <div className="list-header-premium">
            <h2>
              <FaLayerGroup />
              Grupos cadastrados
            </h2>
          </div>

          <div className="produtos-grid-premium">
            {grupos.map((grupo) => (
              <div className="produto-card-premium" key={grupo._id}>
                <div className="produto-body-premium">
                  <h3>{grupo.nome}</h3>

                  <p>{grupo.descricao || "Sem descrição"}</p>

                  <div className="chips-premium">
                    <span>{grupo.tipo}</span>
                    <span>Ordem {grupo.ordem || 0}</span>
                    <span>
                      {grupo.minimoEscolhas || 0} até{" "}
                      {grupo.maximoEscolhas || 1} escolha(s)
                    </span>
                  </div>

                  <div className="chips-premium">
                    <span>
                      {grupo.obrigatorio ? "Obrigatório" : "Opcional"}
                    </span>

                    <span>
                      {grupo.ativo ? (
                        <>
                          <FaCheckCircle /> Ativo
                        </>
                      ) : (
                        <>
                          <FaTimesCircle /> Inativo
                        </>
                      )}
                    </span>
                  </div>

                  <div className="card-actions-premium">
                    <button
                      className="edit-premium"
                      onClick={() => editarGrupo(grupo)}
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="delete-premium"
                      onClick={() => excluirGrupo(grupo._id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {grupos.length === 0 && (
              <div className="empty-preview">
                <FaLayerGroup />
                <strong>Nenhum grupo cadastrado</strong>
                <span>Cadastre Massas, Recheios, Bebidas, Doces...</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default GruposComponentes;