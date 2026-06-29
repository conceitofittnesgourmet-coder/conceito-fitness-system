import { useEffect, useState } from "react";
import {
  FaList,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import toast from "react-hot-toast";

import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";

function OpcoesComponentes() {
  const [grupos, setGrupos] = useState([]);
  const [opcoes, setOpcoes] = useState([]);
  const [editando, setEditando] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    grupo: "",
    nome: "",
    descricao: "",
    precoAdicional: 0,
    custoAdicional: 0,
    imagem: "",
    ordem: 0,
    ativo: true,
  });

  function atualizarCampo(campo, valor) {
    setForm((old) => ({ ...old, [campo]: valor }));
  }

  function limparFormulario() {
    setEditando(null);
    setForm({
      grupo: "",
      nome: "",
      descricao: "",
      precoAdicional: 0,
      custoAdicional: 0,
      imagem: "",
      ordem: 0,
      ativo: true,
    });
  }

  async function carregarGrupos() {
    const response = await api.get("/grupos-componentes");
    setGrupos(response.data.grupos || []);
  }

  async function carregarOpcoes() {
    const response = await api.get("/opcoes-componentes");
    setOpcoes(response.data.opcoes || []);
  }

  async function salvarOpcao(e) {
    e.preventDefault();

    if (!form.grupo) return toast.error("Selecione um grupo");
    if (!form.nome.trim()) return toast.error("Informe o nome da opção");

    try {
      setLoading(true);

      const payload = {
        ...form,
        precoAdicional: Number(form.precoAdicional || 0),
        custoAdicional: Number(form.custoAdicional || 0),
        ordem: Number(form.ordem || 0),
      };

      if (editando) {
        await api.put(`/opcoes-componentes/${editando._id}`, payload);
        toast.success("Opção atualizada!");
      } else {
        await api.post("/opcoes-componentes", payload);
        toast.success("Opção cadastrada!");
      }

      limparFormulario();
      carregarOpcoes();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao salvar opção");
    } finally {
      setLoading(false);
    }
  }

  function editarOpcao(opcao) {
    setEditando(opcao);

    setForm({
      grupo: opcao.grupo?._id || opcao.grupo || "",
      nome: opcao.nome || "",
      descricao: opcao.descricao || "",
      precoAdicional: opcao.precoAdicional || 0,
      custoAdicional: opcao.custoAdicional || 0,
      imagem: opcao.imagem || "",
      ordem: opcao.ordem || 0,
      ativo: opcao.ativo !== false,
    });
  }

  async function excluirOpcao(id) {
    if (!window.confirm("Deseja excluir esta opção?")) return;

    try {
      await api.delete(`/opcoes-componentes/${id}`);
      toast.success("Opção excluída!");
      carregarOpcoes();
    } catch {
      toast.error("Erro ao excluir opção");
    }
  }

  useEffect(() => {
    carregarGrupos();
    carregarOpcoes();
  }, []);

  return (
    <AdminLayout
      title="Opções de Componentes"
      subtitle="Cadastre massas, recheios, coberturas, bebidas, doces e adicionais"
    >
      <div className="produtos-premium-page">
        <section className="produto-form-premium">
          <div className="form-title-premium">
            <FaList />
            <h2>{editando ? "Editar Opção" : "Nova Opção"}</h2>
          </div>

          <form onSubmit={salvarOpcao}>
            <div className="form-row-premium">
              <div className="field-premium">
                <label>Grupo *</label>
                <select
                  value={form.grupo}
                  onChange={(e) => atualizarCampo("grupo", e.target.value)}
                >
                  <option value="">Selecione o grupo</option>
                  {grupos.map((grupo) => (
                    <option key={grupo._id} value={grupo._id}>
                      {grupo.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-premium">
                <label>Nome da opção *</label>
                <input
                  placeholder="Ex.: Chocolate, Ninho, Cappuccino"
                  value={form.nome}
                  onChange={(e) => atualizarCampo("nome", e.target.value)}
                />
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
                <label>Preço adicional</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.precoAdicional}
                  onChange={(e) =>
                    atualizarCampo("precoAdicional", e.target.value)
                  }
                />
              </div>

              <div className="field-premium">
                <label>Custo adicional</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.custoAdicional}
                  onChange={(e) =>
                    atualizarCampo("custoAdicional", e.target.value)
                  }
                />
              </div>

              <div className="field-premium full">
                <label>Descrição</label>
                <input
                  placeholder="Descrição curta da opção"
                  value={form.descricao}
                  onChange={(e) => atualizarCampo("descricao", e.target.value)}
                />
              </div>
            </div>

            <div className="premium-box">
              <h3>Status</h3>

              <div className="mini-grid">
                <label className="premium-switch">
                  <div>
                    <strong>Ativo</strong>
                    <span>Disponível para uso nos produtos</span>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => atualizarCampo("ativo", e.target.checked)}
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
                  ? "Atualizar Opção"
                  : "Cadastrar Opção"}
              </button>
            </div>
          </form>
        </section>

        <section className="produtos-list-premium">
          <div className="list-header-premium">
            <h2>
              <FaList />
              Opções cadastradas
            </h2>
          </div>

          <div className="produtos-grid-premium">
            {opcoes.map((opcao) => (
              <div className="produto-card-premium" key={opcao._id}>
                <div className="produto-body-premium">
                  <h3>{opcao.nome}</h3>
                  <p>{opcao.descricao || "Sem descrição"}</p>

                  <div className="chips-premium">
                    <span>{opcao.grupo?.nome || "Sem grupo"}</span>
                    <span>+ R$ {Number(opcao.precoAdicional || 0).toFixed(2)}</span>
                    <span>Custo R$ {Number(opcao.custoAdicional || 0).toFixed(2)}</span>
                  </div>

                  <div className="chips-premium">
                    <span>Ordem {opcao.ordem || 0}</span>
                    <span>
                      {opcao.ativo ? (
                        <>
                          <FaCheckCircle /> Ativa
                        </>
                      ) : (
                        <>
                          <FaTimesCircle /> Inativa
                        </>
                      )}
                    </span>
                  </div>

                  <div className="card-actions-premium">
                    <button
                      className="edit-premium"
                      onClick={() => editarOpcao(opcao)}
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="delete-premium"
                      onClick={() => excluirOpcao(opcao._id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {opcoes.length === 0 && (
              <div className="empty-preview">
                <FaList />
                <strong>Nenhuma opção cadastrada</strong>
                <span>Cadastre Chocolate, Ninho, Baunilha, Cappuccino...</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default OpcoesComponentes;