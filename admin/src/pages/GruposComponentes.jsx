import { useEffect, useMemo, useState } from "react";
import {
  FaLayerGroup,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaCopy,
  FaSearch,
  FaGripVertical,
  FaSave,
} from "react-icons/fa";
import toast from "react-hot-toast";

import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import "../styles/grupos-componentes.css";

const tipos = [
  { value: "massa", label: "Massa" },
  { value: "recheio", label: "Recheio" },
  { value: "cobertura", label: "Cobertura" },
  { value: "tamanho", label: "Tamanho" },
  { value: "fruta", label: "Fruta" },
  { value: "calda", label: "Calda" },
  { value: "decoracao", label: "Decoração" },
  { value: "bebida", label: "Bebida" },
  { value: "doce", label: "Doce" },
  { value: "salgado", label: "Salgado" },
  { value: "adicional", label: "Adicional" },
  { value: "personalizado", label: "Personalizado" },
];

const formularioInicial = {
  nome: "",
  descricao: "",
  textoAjuda: "",
  tipo: "personalizado",
  tipoSelecao: "unica",
  visualizacao: "lista",
  obrigatorio: false,
  minimoEscolhas: 0,
  maximoEscolhas: 1,
  permiteQuantidadePorOpcao: false,
  quantidadeMaximaPorOpcao: 1,
  ordem: 0,
  canais: {
    pdv: true,
    cardapio: true,
    pwa: true,
    ifood: false,
  },
  ativo: true,
};

function GruposComponentes() {
  const [grupos, setGrupos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [form, setForm] = useState(formularioInicial);

  const gruposFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return grupos.filter((grupo) => {
      const combinaBusca =
        !termo ||
        grupo.nome?.toLowerCase().includes(termo) ||
        grupo.descricao?.toLowerCase().includes(termo) ||
        grupo.tipo?.toLowerCase().includes(termo);
      const combinaStatus =
        filtroStatus === "todos" ||
        (filtroStatus === "ativos" && grupo.ativo) ||
        (filtroStatus === "inativos" && !grupo.ativo);
      return combinaBusca && combinaStatus;
    });
  }, [grupos, busca, filtroStatus]);

  function atualizarCampo(campo, valor) {
    setForm((old) => ({ ...old, [campo]: valor }));
  }

  function atualizarCanal(canal, valor) {
    setForm((old) => ({
      ...old,
      canais: { ...old.canais, [canal]: valor },
    }));
  }

  function limparFormulario() {
    setEditando(null);
    setForm(formularioInicial);
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

  function validarFormulario() {
    if (!form.nome.trim()) return "Informe o nome do grupo";
    const minimo = Number(form.minimoEscolhas || 0);
    const maximo = Number(form.maximoEscolhas || 1);
    if (minimo < 0) return "O mínimo não pode ser negativo";
    if (maximo < 1) return "O máximo precisa ser pelo menos 1";
    if (minimo > maximo) return "O mínimo não pode ser maior que o máximo";
    return "";
  }

  async function salvarGrupo(e) {
    e.preventDefault();
    const erro = validarFormulario();
    if (erro) return toast.error(erro);

    const payload = {
      ...form,
      minimoEscolhas: Number(form.minimoEscolhas || 0),
      maximoEscolhas:
        form.tipoSelecao === "unica" ? 1 : Number(form.maximoEscolhas || 1),
      quantidadeMaximaPorOpcao: Number(form.quantidadeMaximaPorOpcao || 1),
      ordem: Number(form.ordem || 0),
    };

    try {
      setLoading(true);
      if (editando) {
        await api.put(`/grupos-componentes/${editando._id}`, payload);
        toast.success("Grupo atualizado!");
      } else {
        await api.post("/grupos-componentes", payload);
        toast.success("Grupo cadastrado!");
      }
      limparFormulario();
      await carregarGrupos();
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
      textoAjuda: grupo.textoAjuda || "",
      tipo: grupo.tipo || "personalizado",
      tipoSelecao: grupo.tipoSelecao || "unica",
      visualizacao: grupo.visualizacao || "lista",
      obrigatorio: Boolean(grupo.obrigatorio),
      minimoEscolhas: grupo.minimoEscolhas ?? 0,
      maximoEscolhas: grupo.maximoEscolhas ?? 1,
      permiteQuantidadePorOpcao: Boolean(grupo.permiteQuantidadePorOpcao),
      quantidadeMaximaPorOpcao: grupo.quantidadeMaximaPorOpcao ?? 1,
      ordem: grupo.ordem ?? 0,
      canais: {
        pdv: grupo.canais?.pdv !== false,
        cardapio: grupo.canais?.cardapio !== false,
        pwa: grupo.canais?.pwa !== false,
        ifood: Boolean(grupo.canais?.ifood),
      },
      ativo: grupo.ativo !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function duplicarGrupo(grupo) {
    try {
      await api.post(`/grupos-componentes/${grupo._id}/duplicar`);
      toast.success("Grupo duplicado como inativo");
      await carregarGrupos();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao duplicar grupo");
    }
  }

  async function alternarStatus(grupo) {
    try {
      await api.put(`/grupos-componentes/${grupo._id}`, {
        ...grupo,
        ativo: !grupo.ativo,
      });
      toast.success(grupo.ativo ? "Grupo desativado" : "Grupo ativado");
      await carregarGrupos();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao alterar status");
    }
  }

  async function excluirGrupo(grupo) {
    if (!window.confirm(`Deseja excluir o grupo “${grupo.nome}”?`)) return;
    try {
      await api.delete(`/grupos-componentes/${grupo._id}`);
      toast.success("Grupo excluído!");
      await carregarGrupos();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao excluir grupo");
    }
  }

  function moverGrupo(indice, direcao) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= grupos.length) return;
    setGrupos((atuais) => {
      const copia = [...atuais];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia.map((grupo, ordem) => ({ ...grupo, ordem }));
    });
  }

  async function salvarOrdem() {
    try {
      setSalvandoOrdem(true);
      await api.put("/grupos-componentes/ordem", {
        itens: grupos.map((grupo, ordem) => ({ id: grupo._id, ordem })),
      });
      toast.success("Ordem salva!");
      await carregarGrupos();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao salvar ordem");
    } finally {
      setSalvandoOrdem(false);
    }
  }

  useEffect(() => {
    carregarGrupos();
  }, []);

  return (
    <AdminLayout
      title="Grupos de Componentes"
      subtitle="Configure massas, recheios, coberturas, tamanhos e adicionais reutilizáveis"
    >
      <div className="grupos-config-page">
        <section className="produto-form-premium grupos-form-card">
          <div className="form-title-premium">
            <FaLayerGroup />
            <div>
              <h2>{editando ? "Editar grupo" : "Novo grupo"}</h2>
              <p>Defina a regra que será usada no Cardápio, PDV, PWA e iFood.</p>
            </div>
          </div>

          <form onSubmit={salvarGrupo}>
            <div className="form-row-premium">
              <div className="field-premium">
                <label>Nome do grupo *</label>
                <input
                  placeholder="Ex.: Recheios"
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
                  placeholder="Ex.: Escolha o recheio principal do bolo"
                  value={form.descricao}
                  onChange={(e) => atualizarCampo("descricao", e.target.value)}
                />
              </div>
              <div className="field-premium full">
                <label>Texto de ajuda ao cliente</label>
                <input
                  placeholder="Ex.: Você pode escolher até dois sabores"
                  value={form.textoAjuda}
                  onChange={(e) => atualizarCampo("textoAjuda", e.target.value)}
                />
              </div>
            </div>

            <div className="grupos-rule-grid">
              <div className="premium-box">
                <h3>Seleção</h3>
                <div className="form-row-premium compact">
                  <div className="field-premium">
                    <label>Tipo de escolha</label>
                    <select
                      value={form.tipoSelecao}
                      onChange={(e) => {
                        const tipo = e.target.value;
                        atualizarCampo("tipoSelecao", tipo);
                        if (tipo === "unica") atualizarCampo("maximoEscolhas", 1);
                      }}
                    >
                      <option value="unica">Escolha única</option>
                      <option value="multipla">Múltipla escolha</option>
                    </select>
                  </div>
                  <div className="field-premium">
                    <label>Visualização</label>
                    <select
                      value={form.visualizacao}
                      onChange={(e) => atualizarCampo("visualizacao", e.target.value)}
                    >
                      <option value="lista">Lista</option>
                      <option value="cards">Cards</option>
                      <option value="seletor">Seletor compacto</option>
                    </select>
                  </div>
                </div>
                <div className="form-row-premium compact">
                  <div className="field-premium">
                    <label>Mínimo</label>
                    <input
                      type="number"
                      min="0"
                      max={form.tipoSelecao === "unica" ? 1 : undefined}
                      value={form.minimoEscolhas}
                      onChange={(e) => atualizarCampo("minimoEscolhas", e.target.value)}
                    />
                  </div>
                  <div className="field-premium">
                    <label>Máximo</label>
                    <input
                      type="number"
                      min="1"
                      disabled={form.tipoSelecao === "unica"}
                      value={form.tipoSelecao === "unica" ? 1 : form.maximoEscolhas}
                      onChange={(e) => atualizarCampo("maximoEscolhas", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="premium-box">
                <h3>Regras</h3>
                <div className="mini-grid vertical">
                  <label className="premium-switch">
                    <div><strong>Obrigatório</strong><span>Exige uma escolha para continuar</span></div>
                    <input
                      type="checkbox"
                      checked={form.obrigatorio}
                      onChange={(e) => atualizarCampo("obrigatorio", e.target.checked)}
                    />
                  </label>
                  <label className="premium-switch">
                    <div><strong>Quantidade por opção</strong><span>Permite escolher 2x, 3x da mesma opção</span></div>
                    <input
                      type="checkbox"
                      checked={form.permiteQuantidadePorOpcao}
                      onChange={(e) => atualizarCampo("permiteQuantidadePorOpcao", e.target.checked)}
                    />
                  </label>
                  {form.permiteQuantidadePorOpcao && (
                    <div className="field-premium">
                      <label>Máximo por opção</label>
                      <input
                        type="number"
                        min="1"
                        value={form.quantidadeMaximaPorOpcao}
                        onChange={(e) => atualizarCampo("quantidadeMaximaPorOpcao", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="premium-box">
              <h3>Canais de venda</h3>
              <div className="grupos-channel-grid">
                {[
                  ["pdv", "PDV"],
                  ["cardapio", "Cardápio Online"],
                  ["pwa", "Aplicativo/PWA"],
                  ["ifood", "iFood"],
                ].map(([canal, label]) => (
                  <label className="premium-switch" key={canal}>
                    <div><strong>{label}</strong><span>Exibir este grupo no canal</span></div>
                    <input
                      type="checkbox"
                      checked={Boolean(form.canais[canal])}
                      onChange={(e) => atualizarCanal(canal, e.target.checked)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="premium-box status-box">
              <label className="premium-switch">
                <div><strong>Grupo ativo</strong><span>Disponível para associação aos produtos</span></div>
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => atualizarCampo("ativo", e.target.checked)}
                />
              </label>
            </div>

            <div className="form-actions-premium">
              <button type="button" className="clear-btn-premium" onClick={limparFormulario}>
                Limpar
              </button>
              <button type="submit" className="save-btn-premium" disabled={loading}>
                <FaPlus />
                {loading ? "Salvando..." : editando ? "Atualizar grupo" : "Cadastrar grupo"}
              </button>
            </div>
          </form>
        </section>

        <section className="produtos-list-premium grupos-list-card">
          <div className="list-header-premium grupos-list-header">
            <div>
              <h2><FaLayerGroup /> Grupos cadastrados</h2>
              <p>{grupos.length} grupo(s) configurado(s)</p>
            </div>
            <button className="save-order-btn" onClick={salvarOrdem} disabled={salvandoOrdem}>
              <FaSave /> {salvandoOrdem ? "Salvando..." : "Salvar ordem"}
            </button>
          </div>

          <div className="grupos-toolbar">
            <label className="grupos-search">
              <FaSearch />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, descrição ou tipo"
              />
            </label>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </div>

          <div className="grupos-config-list">
            {gruposFiltrados.map((grupo) => {
              const indiceReal = grupos.findIndex((item) => item._id === grupo._id);
              return (
                <article className={`grupo-config-card ${grupo.ativo ? "" : "is-inactive"}`} key={grupo._id}>
                  <div className="grupo-order-controls">
                    <FaGripVertical />
                    <button type="button" onClick={() => moverGrupo(indiceReal, -1)} disabled={indiceReal === 0}>↑</button>
                    <button type="button" onClick={() => moverGrupo(indiceReal, 1)} disabled={indiceReal === grupos.length - 1}>↓</button>
                  </div>

                  <div className="grupo-config-main">
                    <div className="grupo-config-title-row">
                      <div>
                        <h3>{grupo.nome}</h3>
                        <p>{grupo.descricao || "Sem descrição"}</p>
                      </div>
                      <button
                        type="button"
                        className={`grupo-status-button ${grupo.ativo ? "active" : "inactive"}`}
                        onClick={() => alternarStatus(grupo)}
                      >
                        {grupo.ativo ? <FaCheckCircle /> : <FaTimesCircle />}
                        {grupo.ativo ? "Ativo" : "Inativo"}
                      </button>
                    </div>

                    <div className="grupo-badges">
                      <span>{tipos.find((tipo) => tipo.value === grupo.tipo)?.label || grupo.tipo}</span>
                      <span>{grupo.tipoSelecao === "multipla" ? "Múltipla escolha" : "Escolha única"}</span>
                      <span>{grupo.obrigatorio ? "Obrigatório" : "Opcional"}</span>
                      <span>{grupo.minimoEscolhas || 0} a {grupo.maximoEscolhas || 1} escolha(s)</span>
                      <span>{grupo.visualizacao || "lista"}</span>
                    </div>

                    <div className="grupo-metrics">
                      <div><strong>{grupo.contadores?.opcoes || 0}</strong><span>opções</span></div>
                      <div><strong>{grupo.contadores?.opcoesAtivas || 0}</strong><span>ativas</span></div>
                      <div><strong>{grupo.contadores?.produtos || 0}</strong><span>produtos</span></div>
                      <div><strong>{grupo.ordem || 0}</strong><span>ordem</span></div>
                    </div>

                    <div className="grupo-channels">
                      {grupo.canais?.pdv !== false && <span>PDV</span>}
                      {grupo.canais?.cardapio !== false && <span>Cardápio</span>}
                      {grupo.canais?.pwa !== false && <span>PWA</span>}
                      {grupo.canais?.ifood && <span>iFood</span>}
                    </div>
                  </div>

                  <div className="card-actions-premium grupo-actions">
                    <button className="edit-premium" onClick={() => editarGrupo(grupo)} title="Editar"><FaEdit /></button>
                    <button className="copy-premium" onClick={() => duplicarGrupo(grupo)} title="Duplicar"><FaCopy /></button>
                    <button className="delete-premium" onClick={() => excluirGrupo(grupo)} title="Excluir"><FaTrash /></button>
                  </div>
                </article>
              );
            })}

            {gruposFiltrados.length === 0 && (
              <div className="empty-preview">
                <FaLayerGroup />
                <strong>Nenhum grupo encontrado</strong>
                <span>Cadastre ou ajuste os filtros para localizar um grupo.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default GruposComponentes;
