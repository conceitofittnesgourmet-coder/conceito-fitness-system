import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaImage,
  FaBoxOpen,
  FaSearch,
  FaStar,
  FaInfoCircle,
  FaClock,
  FaWeightHanging,
  FaShieldAlt,
  FaCloudUploadAlt,
  FaFilter,
} from "react-icons/fa";
import toast from "react-hot-toast";

import AdminLayout from "../layouts/AdminLayout";
import socket from "../services/socket";
import api from "../services/api";

const API_URL = "https://conceito-fitness-system.onrender.com";

function getImagemUrl(imagem) {
  if (!imagem) return null;

  if (typeof imagem === "string") {
    if (imagem.startsWith("http")) return imagem;
    if (imagem.startsWith("/uploads")) return `${API_URL}${imagem}`;
    if (imagem.startsWith("uploads")) return `${API_URL}/${imagem}`;
    return `${API_URL}/uploads/${imagem}`;
  }

  if (imagem.url) {
    if (imagem.url.startsWith("http")) return imagem.url;
    if (imagem.url.startsWith("/uploads")) return `${API_URL}${imagem.url}`;
    if (imagem.url.startsWith("uploads")) return `${API_URL}/${imagem.url}`;
    return `${API_URL}/uploads/${imagem.url}`;
  }

  return null;
}

function Produtos() {
  const [produtos, setProdutos] = useState([]);

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [categorias, setCategorias] = useState("");
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState([]);
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [custo, setCusto] = useState("");
  const [tipoProduto, setTipoProduto] = useState("producao");
  const [estoque, setEstoque] = useState("");
  const [tempoPreparo, setTempoPreparo] = useState("");
  const [restricoes, setRestricoes] = useState("");
  const [peso, setPeso] = useState("");
  const [destaque, setDestaque] = useState(false);
  const [imagens, setImagens] = useState([]);
  const [loading, setLoading] = useState(false);

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);

  const [editNome, setEditNome] = useState("");
  const [editCategoria, setEditCategoria] = useState("");
  const [editCategorias, setEditCategorias] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editPreco, setEditPreco] = useState("");
  const [editCusto, setEditCusto] = useState("");
  const [editTipoProduto, setEditTipoProduto] = useState("producao");
  const [editEstoque, setEditEstoque] = useState("");
  const [editTempoPreparo, setEditTempoPreparo] = useState("");
  const [editRestricoes, setEditRestricoes] = useState("");
  const [editPeso, setEditPeso] = useState("");
  const [editDestaque, setEditDestaque] = useState(false);
  const [editImagem, setEditImagem] = useState(null);
  const [previewEdit, setPreviewEdit] = useState(null);
  const [loadingEditar, setLoadingEditar] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    onDrop: (acceptedFiles) => {
      const novas = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setImagens((old) => [...old, ...novas]);
    },
  });

  const previewCadastro = imagens?.[0]?.preview || null;

  async function carregarProdutos() {
    try {
      const response = await api.get("/produtos");
      setProdutos(response.data.produtos || []);
    } catch (error) {
      console.log(error);
      toast.error("Erro ao carregar produtos");
    }
  }

  async function carregarCategorias() {
  try {
    const response = await api.get("/categorias");
    setCategoriasDisponiveis(response.data.categorias || []);
  } catch (error) {
    console.log(error);
    toast.error("Erro ao carregar categorias");
  }
}

  async function cadastrarProduto() {
    try {
      if (!nome || !preco || !estoque) {
        toast.error("Preencha nome, preço e estoque");
        return;
      }

      setLoading(true);

      const formData = new FormData();

      formData.append("nome", nome);
      formData.append("categoria", categoria);
      formData.append("categorias", categorias);
      formData.append("descricao", descricao);
      formData.append("preco", preco);
      formData.append("custo", custo);
      formData.append("tipoProduto", tipoProduto);
      formData.append("estoque", estoque);
      formData.append("tempoPreparo", tempoPreparo);
      formData.append("restricoes", restricoes);
      formData.append("peso", peso);
      formData.append("destaque", destaque);
      
      

      imagens.forEach((img) => {
        formData.append("imagens", img);
      });

      await api.post("/produtos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Produto cadastrado!");
      limparFormulario();
      carregarProdutos();
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  async function deletarProduto(id) {
    try {
      const confirmar = window.confirm("Deseja excluir este produto?");

      if (!confirmar) return;

      await api.delete(`/produtos/${id}`);

      toast.success("Produto deletado!");
      carregarProdutos();
    } catch (error) {
      console.log(error);
      toast.error("Erro ao deletar");
    }
  }

  function abrirModal(produto) {
    setProdutoEditando(produto);

    setEditNome(produto.nome || "");
    setEditCategoria(produto.categoria || "");
    setEditCategorias(produto.categorias?.join(", ") || "");
    setEditDescricao(produto.descricao || "");
    setEditPreco(produto.preco || "");
    setEditCusto(produto.custo || "");
    setEditTipoProduto(produto.tipoProduto || "producao");
    setEditEstoque(produto.estoque || "");
    setEditTempoPreparo(produto.tempoPreparo || "");
    setEditRestricoes(produto.restricoes || "");
    setEditPeso(produto.peso || "");
    setEditDestaque(Boolean(produto.destaque));
    setPreviewEdit(getImagemUrl(produto.imagens?.[0]));
    setEditImagem(null);
    setModalOpen(true);
  }

  async function salvarEdicao() {
    try {
      setLoadingEditar(true);

      const formData = new FormData();

      formData.append("nome", editNome);
      formData.append("categoria", editCategoria);
      formData.append("categorias", editCategorias);
      formData.append("descricao", editDescricao);
      formData.append("preco", editPreco);
      formData.append("custo", editCusto);
      formData.append("tipoProduto", editTipoProduto);
      formData.append("estoque", editEstoque);
      formData.append("tempoPreparo", editTempoPreparo);
      formData.append("restricoes", editRestricoes);
      formData.append("peso", editPeso);
      formData.append("destaque", editDestaque);

      if (editImagem) {
        formData.append("imagens", editImagem);
      }

      await api.put(`/produtos/${produtoEditando._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Produto atualizado!");
      setModalOpen(false);
      carregarProdutos();
    } catch (error) {
      console.log(error);
      toast.error("Erro ao atualizar");
    } finally {
      setLoadingEditar(false);
    }
  }

  function limparFormulario() {
    imagens.forEach((img) => {
      if (img.preview) URL.revokeObjectURL(img.preview);
    });

    setNome("");
    setCategoria("");
    setCategorias("");
    setDescricao("");
    setPreco("");
    setEstoque("");
    setTempoPreparo("");
    setRestricoes("");
    setPeso("");
    setDestaque(false);
    setImagens([]);
  }

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const termo = busca.toLowerCase();

      const categoriasTexto = [
  produto.categoria,
  ...(produto.categorias || []),
]
  .join(" ")
  .toLowerCase();

const bateBusca =
  produto.nome?.toLowerCase().includes(termo) ||
  categoriasTexto.includes(termo);

      if (!bateBusca) return false;

      if (filtro === "destaques") return produto.destaque;
      if (filtro === "estoque-baixo") return Number(produto.estoque || 0) <= 5;

      return true;
    });
  }, [produtos, busca, filtro]);

  useEffect(() => {
    carregarProdutos();
    carregarCategorias();

    socket.on("produto-criado", carregarProdutos);
    socket.on("produto-atualizado", carregarProdutos);
    socket.on("produto-deletado", carregarProdutos);

    return () => {
      socket.off("produto-criado", carregarProdutos);
      socket.off("produto-atualizado", carregarProdutos);
      socket.off("produto-deletado", carregarProdutos);
    };
  }, []);

  return (
    <AdminLayout title="Produtos" subtitle="Gerencie seu catálogo gourmet">
      <div className="produtos-premium-page">
        <div className="produtos-top-actions">
          <div></div>

          <div className="produtos-search-box">
            <FaSearch />
            <input
              placeholder="Buscar produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <button className="novo-produto-btn">
            <FaPlus />
            Novo produto
          </button>
        </div>

        <section className="produto-form-premium">
          <div className="form-title-premium">
            <FaBoxOpen />
            <h2>Cadastro de Produto</h2>
          </div>

          <div className="form-row-premium">
            <div className="field-premium">
              <label>Nome do produto *</label>
              <input
                placeholder="Ex.: Bolo de Cacau 100%"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="field-premium">
              <label>Categoria *</label>
              <input
                placeholder="Ex.: Bolos, Bebidas, Snacks"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              />
            </div>

            <div className="field-premium">
  <label>Categorias extras</label>

  <div className="chips-premium">
    {categoriasDisponiveis.map((cat) => (
      <label key={cat._id}>
        <input
          type="checkbox"
          checked={categorias
            .split(",")
            .map((c) => c.trim())
            .includes(cat.nome)}
          onChange={(e) => {
            const atuais = categorias
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean);

            const novas = e.target.checked
              ? [...atuais, cat.nome]
              : atuais.filter((c) => c !== cat.nome);

            setCategorias(novas.join(", "));
          }}
        />
        {cat.nome}
      </label>
    ))}
  </div>
</div>
          </div>

          <div className="field-premium full">
            <label>Descrição do produto</label>
            <textarea
              placeholder="Descreva os ingredientes, benefícios e diferenciais..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="form-blocks-premium">
            <div className="premium-box">
              <h3>
                <FaInfoCircle />
                Informações principais
              </h3>

              <div className="mini-grid">
                <div className="field-premium">
                  <label>Preço *</label>
                <input
  type="number"
  step="0.01"
  min="0"
  inputMode="decimal"
  placeholder="Ex: 15.90"
  value={preco}
  onChange={(e) =>
    setPreco(e.target.value.replace(",", "."))
  }
/>
                </div>
                <div className="field-premium">
  <label>Custo Produção</label>

  <input
    type="number"
    step="0.01"
    min="0"
    value={custo}
    onChange={(e) =>
      setCusto(e.target.value.replace(",", "."))
    }
  />
</div>

<div className="field-premium">
  <label>Tipo Produto</label>

  <select
    value={tipoProduto}
    onChange={(e) =>
      setTipoProduto(e.target.value)
    }
  >
    <option value="producao">
      Produção Própria
    </option>

    <option value="revenda">
      Revenda
    </option>

    <option value="insumo">
      Insumo
    </option>
  </select>
</div>

                <div className="field-premium">
                  <label>Estoque *</label>
                  <input
                    placeholder="0"
                    value={estoque}
                    onChange={(e) => setEstoque(e.target.value)}
                  />
                </div>

                <div className="field-premium">
                  <label>Tempo de preparo</label>
                  <input
                    placeholder="0 min"
                    value={tempoPreparo}
                    onChange={(e) => setTempoPreparo(e.target.value)}
                  />
                </div>

                <div className="field-premium">
                  <label>Peso / porção</label>
                  <input
                    placeholder="Ex.: 120g"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                  />
                </div>
              </div>

              <div className="field-premium full">
                <label>Restrições</label>
                <input
                  placeholder="Ex.: Sem glúten, Sem lactose"
                  value={restricoes}
                  onChange={(e) => setRestricoes(e.target.value)}
                />
              </div>
            </div>

            <div className="premium-box">
              <h3>
                <FaStar />
                Destaque e imagem
              </h3>

              <label className="premium-switch">
                <div>
                  <strong>Produto em destaque</strong>
                  <span>Marque para destacar no cardápio</span>
                </div>

                <input
                  type="checkbox"
                  checked={destaque}
                  onChange={(e) => setDestaque(e.target.checked)}
                />
              </label>

              <div
                {...getRootProps()}
                className={`upload-premium ${isDragActive ? "active" : ""}`}
              >
                <input {...getInputProps()} />
                <FaCloudUploadAlt />
                <strong>Clique ou arraste a imagem aqui</strong>
                <span>PNG, JPG até 5MB</span>
              </div>
            </div>

            <div className="premium-box preview-premium">
              <h3>
                <FaImage />
                Prévia da imagem
              </h3>

              {previewCadastro ? (
                <img src={previewCadastro} alt="Prévia" />
              ) : (
                <div className="empty-preview">
                  <FaImage />
                  <strong>Nenhuma imagem</strong>
                  <span>A imagem do produto aparecerá aqui</span>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions-premium">
            <button className="clear-btn-premium" onClick={limparFormulario}>
              Limpar
            </button>

            <button
              className="save-btn-premium"
              onClick={cadastrarProduto}
              disabled={loading}
            >
              {loading ? "Cadastrando..." : "Cadastrar produto"}
            </button>
          </div>
        </section>

        <section className="produtos-list-premium">
          <div className="list-header-premium">
            <h2>
              <FaBoxOpen />
              Produtos cadastrados
            </h2>

            <div className="list-actions-premium">
              <button
                className={filtro === "todos" ? "active" : ""}
                onClick={() => setFiltro("todos")}
              >
                Todos
              </button>

              <button
                className={filtro === "destaques" ? "active" : ""}
                onClick={() => setFiltro("destaques")}
              >
                Destaques
              </button>

              <button
                className={filtro === "estoque-baixo" ? "active" : ""}
                onClick={() => setFiltro("estoque-baixo")}
              >
                Estoque baixo
              </button>

              <button>
                <FaFilter />
                Filtros
              </button>
            </div>
          </div>

          <div className="produtos-grid-premium">
            {produtosFiltrados.map((produto) => {
              const imagem = getImagemUrl(
  produto.imagem || produto.imagens?.[0]
);

              return (
                <div className="produto-card-premium" key={produto._id}>
                  <div className="produto-img-premium">
                    {imagem ? (
                      <img src={imagem} alt={produto.nome} />
                    ) : (
                      <div className="sem-imagem-premium">
                        <FaImage />
                      </div>
                    )}

                    {produto.destaque && (
                      <span className="destaque-badge">Destaque</span>
                    )}
                  </div>

                  <div className="produto-body-premium">
                    <h3>{produto.nome}</h3>
                    <strong>R$ {Number(produto.preco || 0).toFixed(2)}</strong>

                    <div className="chips-premium">
  <span>{produto.categoria}</span>

  {produto.categorias?.map((cat) => (
    <span key={cat}>{cat}</span>
  ))}
</div>

                    {produto.categorias?.length > 0 && (
  <div className="chips-premium">
    {produto.categorias.map((cat) => (
      <span key={cat}>{cat}</span>
    ))}
  </div>
)}

                    <p>
  Custo:
  <strong>
    R$ {Number(produto.custo || 0).toFixed(2)}
  </strong>
</p>

<p style={{ color: "#22c55e" }}>
  Lucro:
  <strong>
    R$ {Number(produto.lucro || 0).toFixed(2)}
  </strong>
</p>

<p style={{ color: "#3b82f6" }}>
  Margem:
  <strong>
    {Number(produto.margem || 0).toFixed(2)}%
  </strong>
</p>
                    <p
  style={{
    color:
      Number(produto.estoque) <=
      Number(produto.estoqueMinimo || 5)
        ? "#dc2626"
        : "#16a34a",
    fontWeight: 700,
  }}
>
  Estoque: {produto.estoque} unidades
</p>

                    <div className="chips-premium">
                      {produto.tempoPreparo && (
                        <span>
                          <FaClock />
                          {produto.tempoPreparo} min
                        </span>
                      )}

                      {produto.peso && (
                        <span>
                          <FaWeightHanging />
                          {produto.peso}
                        </span>
                      )}

                      {produto.restricoes && (
                        <span>
                          <FaShieldAlt />
                          {produto.restricoes}
                        </span>
                      )}
                    </div>

                    <div className="card-actions-premium">
                      <button
                        className="edit-premium"
                        onClick={() => abrirModal(produto)}
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="delete-premium"
                        onClick={() => deletarProduto(produto._id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Editar Produto</h2>

              <input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
              <input value={editCategoria} onChange={(e) => setEditCategoria(e.target.value)} />
              <div className="field-premium">
  <label>Categorias extras</label>

  <div className="chips-premium">
    {categoriasDisponiveis.map((cat) => (
      <label key={cat._id}>
        <input
          type="checkbox"
          checked={editCategorias
            .split(",")
            .map((c) => c.trim())
            .includes(cat.nome)}
          onChange={(e) => {
            const atuais = editCategorias
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean);

            const novas = e.target.checked
              ? [...atuais, cat.nome]
              : atuais.filter((c) => c !== cat.nome);

            setEditCategorias(novas.join(", "));
          }}
        />
        {cat.nome}
      </label>
    ))}
  </div>
</div>
              <textarea value={editDescricao} onChange={(e) => setEditDescricao(e.target.value)} />
              <input value={editPreco} onChange={(e) => setEditPreco(e.target.value)} />
              <input
  placeholder="Custo"
  value={editCusto}
  onChange={(e) =>
    setEditCusto(e.target.value)
  }
/>

<select
  value={editTipoProduto}
  onChange={(e) =>
    setEditTipoProduto(e.target.value)
  }
>
  <option value="producao">
    Produção Própria
  </option>

  <option value="revenda">
    Revenda
  </option>

  <option value="insumo">
    Insumo
  </option>
</select>
              <input value={editEstoque} onChange={(e) => setEditEstoque(e.target.value)} />
              <input value={editTempoPreparo} onChange={(e) => setEditTempoPreparo(e.target.value)} />
              <input value={editRestricoes} onChange={(e) => setEditRestricoes(e.target.value)} />
              <input value={editPeso} onChange={(e) => setEditPeso(e.target.value)} />

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editDestaque}
                  onChange={(e) => setEditDestaque(e.target.checked)}
                />
                Produto em destaque
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setEditImagem(file || null);
                  if (file) setPreviewEdit(URL.createObjectURL(file));
                }}
              />

              {previewEdit && <img src={previewEdit} alt="" className="preview-image" />}

              <div className="modal-buttons">
                <button className="btn-save" onClick={salvarEdicao}>
                  {loadingEditar ? "Salvando..." : "Salvar"}
                </button>

                <button className="btn-cancel" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Produtos;