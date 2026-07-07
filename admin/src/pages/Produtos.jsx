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
import CategoriasProduto from "../components/ProdutoForm/CategoriasProduto";
import ConstrutorUniversalProduto from "../components/ProdutoForm/ConstrutorUniversalProduto";
import CodigoBarrasProduto from "../components/ProdutoForm/CodigoBarrasProduto";
import UnidadeVendaProduto from "../components/ProdutoForm/UnidadeVendaProduto";
import DadosNutricionaisProduto from "../components/ProdutoForm/DadosNutricionaisProduto";
import AlergenosProduto from "../components/ProdutoForm/AlergenosProduto";
import SelosProduto from "../components/ProdutoForm/SelosProduto";

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
  const [unidadeMedida, setUnidadeMedida] = useState("UN");
  const [vendaPorPeso, setVendaPorPeso] = useState(false);
  const [permiteFracionado, setPermiteFracionado] = useState(false);
  const [destaque, setDestaque] = useState(false);
  const [imagens, setImagens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [codigoBarras, setCodigoBarras] = useState("");
  const [sku, setSku] = useState("");
  const [gruposComponentes, setGruposComponentes] = useState([]);
  const [gruposSelecionados, setGruposSelecionados] = useState([]);
  const [informacoesNutricionais, setInformacoesNutricionais] = useState({
  calorias: "",
  proteinas: "",
  carboidratos: "",
  gorduras: "",
  fibras: "",
  sodio: "",
});

const [alergenos, setAlergenos] = useState({
  contemLeite: false,
  contemOvos: false,
  contemSoja: false,
  contemCastanhas: false,
  contemAmendoim: false,
  contemGluten: false,
});

const [selos, setSelos] = useState({
  semGluten: false,
  zeroLactose: false,
  zeroAcucar: false,
  lowCarb: false,
  vegano: false,
  fit: false,
});


  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [abaCadastro, setAbaCadastro] = useState("basico");
  const [tipoWizard, setTipoWizard] = useState("simples");

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
  const [editUnidadeMedida, setEditUnidadeMedida] = useState("UN");
  const [editVendaPorPeso, setEditVendaPorPeso] = useState(false);
  const [editPermiteFracionado, setEditPermiteFracionado] = useState(false);
  const [editDestaque, setEditDestaque] = useState(false);
  const [editImagem, setEditImagem] = useState(null);
  const [previewEdit, setPreviewEdit] = useState(null);
  const [loadingEditar, setLoadingEditar] = useState(false);
  const [editCodigoBarras, setEditCodigoBarras] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editGruposSelecionados, setEditGruposSelecionados] = useState([]);
  const [editInformacoesNutricionais, setEditInformacoesNutricionais] = useState({
  calorias: "",
  proteinas: "",
  carboidratos: "",
  gorduras: "",
  fibras: "",
  sodio: "",
});

const [editAlergenos, setEditAlergenos] = useState({
  contemLeite: false,
  contemOvos: false,
  contemSoja: false,
  contemCastanhas: false,
  contemAmendoim: false,
  contemGluten: false,
});

const [editSelos, setEditSelos] = useState({
  semGluten: false,
  zeroLactose: false,
  zeroAcucar: false,
  lowCarb: false,
  vegano: false,
  fit: false,
});

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

  async function carregarGruposComponentes() {
  try {
    const response = await api.get("/grupos-componentes");
    setGruposComponentes(response.data.grupos || []);
  } catch (error) {
    console.log(error);
    toast.error("Erro ao carregar grupos de componentes");
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
      formData.append("unidadeMedida", unidadeMedida);
      formData.append("vendaPorPeso", vendaPorPeso);
      formData.append("permiteFracionado", permiteFracionado);
      formData.append("destaque", destaque);
      formData.append("codigoBarras", codigoBarras);
      formData.append("sku", sku);
      formData.append(
  "gruposComponentes",
  JSON.stringify(gruposSelecionados)
);
formData.append("informacoesNutricionais", JSON.stringify(informacoesNutricionais));
formData.append("alergenos", JSON.stringify(alergenos));
formData.append("selos", JSON.stringify(selos));
      
      

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
    setEditUnidadeMedida(produto.unidadeMedida || "UN");
    setEditVendaPorPeso(Boolean(produto.vendaPorPeso));
    setEditPermiteFracionado(Boolean(produto.permiteFracionado));
    setEditDestaque(Boolean(produto.destaque));
    setEditCodigoBarras(produto.codigoBarras || "");
    setEditSku(produto.sku || "");
    setEditGruposSelecionados(
  (produto.gruposComponentes || []).map((grupo) =>
    typeof grupo === "string" ? grupo : grupo._id
  )
);
    setEditInformacoesNutricionais(produto.informacoesNutricionais || {
  calorias: "",
  proteinas: "",
  carboidratos: "",
  gorduras: "",
  fibras: "",
  sodio: "",
});

setEditAlergenos(produto.alergenos || {
  contemLeite: false,
  contemOvos: false,
  contemSoja: false,
  contemCastanhas: false,
  contemAmendoim: false,
  contemGluten: false,
});

setEditSelos(produto.selos || {
  semGluten: false,
  zeroLactose: false,
  zeroAcucar: false,
  lowCarb: false,
  vegano: false,
  fit: false,
});
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
      formData.append("unidadeMedida", editUnidadeMedida);
      formData.append("vendaPorPeso", editVendaPorPeso);
      formData.append("permiteFracionado", editPermiteFracionado);
      formData.append("destaque", editDestaque);
      formData.append("codigoBarras", editCodigoBarras);
      formData.append("sku", editSku);
      formData.append(
  "gruposComponentes",
  JSON.stringify(editGruposSelecionados)
);
      formData.append("informacoesNutricionais", JSON.stringify(editInformacoesNutricionais));
formData.append("alergenos", JSON.stringify(editAlergenos));
formData.append("selos", JSON.stringify(editSelos));

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
    setUnidadeMedida("UN");
    setVendaPorPeso(false);
    setPermiteFracionado(false);
    setDestaque(false);
    setCodigoBarras("");
    setSku("");
    setGruposSelecionados([]);
    setImagens([]);
    setInformacoesNutricionais({
  calorias: "",
  proteinas: "",
  carboidratos: "",
  gorduras: "",
  fibras: "",
  sodio: "",
});

setAlergenos({
  contemLeite: false,
  contemOvos: false,
  contemSoja: false,
  contemCastanhas: false,
  contemAmendoim: false,
  contemGluten: false,
});

setSelos({
  semGluten: false,
  zeroLactose: false,
  zeroAcucar: false,
  lowCarb: false,
  vegano: false,
  fit: false,
});
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
    carregarGruposComponentes();

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

          <div className="produto-wizard">
  <div className="produto-wizard-header">
    <div>
      <span>Assistente de Cadastro</span>
      <h3>Que tipo de produto você está cadastrando?</h3>
      <p>
        O sistema vai organizar os campos conforme o tipo escolhido.
      </p>
    </div>
  </div>

  <div className="produto-wizard-grid">
    {[
      ["simples", "📦", "Produto simples"],
      ["bolo", "🎂", "Bolo / Naked Cake"],
      ["torta", "🥧", "Torta"],
      ["cafe", "☕", "Café / Bebida"],
      ["combo", "🥪", "Combo"],
      ["kit", "🎁", "Kit"],
      ["cesta", "🧺", "Cesta"],
      ["peso", "⚖️", "Produto por peso"],
    ].map(([id, emoji, label]) => (
      <button
        key={id}
        type="button"
        className={tipoWizard === id ? "active" : ""}
        onClick={() => {
          setTipoWizard(id);

          if (id === "peso") {
            setUnidadeMedida("KG");
            setVendaPorPeso(true);
            setPermiteFracionado(true);
            setAbaCadastro("venda");
          }

          if (["bolo", "torta", "combo", "kit", "cesta"].includes(id)) {
            setTipoProduto("producao");
            setAbaCadastro("cardapio");
          }

          if (id === "cafe") {
            setUnidadeMedida("UN");
            setAbaCadastro("basico");
          }

          if (id === "simples") {
            setAbaCadastro("basico");
          }
        }}
      >
        <strong>{emoji}</strong>
        <span>{label}</span>
      </button>
    ))}
  </div>
</div>

          <div className="produto-tabs">
  <button className={abaCadastro === "basico" ? "active" : ""} onClick={() => setAbaCadastro("basico")} type="button">
    1. Básico
  </button>

  <button className={abaCadastro === "venda" ? "active" : ""} onClick={() => setAbaCadastro("venda")} type="button">
    2. Venda
  </button>

  <button className={abaCadastro === "cardapio" ? "active" : ""} onClick={() => setAbaCadastro("cardapio")} type="button">
    3. Cardápio
  </button>

  <button className={abaCadastro === "nutricional" ? "active" : ""} onClick={() => setAbaCadastro("nutricional")} type="button">
    4. Nutricional
  </button>

  <button className={abaCadastro === "imagem" ? "active" : ""} onClick={() => setAbaCadastro("imagem")} type="button">
    5. Imagem
  </button>
</div>

          {abaCadastro === "basico" && (
  <div className="produto-aba-card">
    <div className="form-row-premium">
      <div className="field-premium">
        <label>Nome do produto *</label>
        <input
          placeholder="Ex.: Bolo de Cacau 100%"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>
    </div>

    <CategoriasProduto
      categoria={categoria}
      setCategoria={setCategoria}
      categorias={categorias}
      setCategorias={setCategorias}
      categoriasDisponiveis={categoriasDisponiveis}
    />

    <div className="field-premium full">
      <label>Descrição do produto</label>
      <textarea
        placeholder="Descreva os ingredientes, benefícios e diferenciais..."
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />
    </div>
  </div>
)}

{abaCadastro === "venda" && (
  <div className="produto-aba-card">
    <div className="premium-box">
      <h3>
        <FaInfoCircle />
        Venda, preço e estoque
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
            onChange={(e) => setPreco(e.target.value.replace(",", "."))}
          />
        </div>

        <div className="field-premium">
          <label>Custo Produção</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={custo}
            onChange={(e) => setCusto(e.target.value.replace(",", "."))}
          />
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
          <label>Peso / porção</label>
          <input
            placeholder="Ex.: 120g"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
          />
        </div>
      </div>

      <UnidadeVendaProduto
        unidadeMedida={unidadeMedida}
        setUnidadeMedida={setUnidadeMedida}
        vendaPorPeso={vendaPorPeso}
        setVendaPorPeso={setVendaPorPeso}
        permiteFracionado={permiteFracionado}
        setPermiteFracionado={setPermiteFracionado}
      />

      <CodigoBarrasProduto
        codigoBarras={codigoBarras}
        setCodigoBarras={setCodigoBarras}
        sku={sku}
        setSku={setSku}
      />
    </div>
  </div>
)}

{abaCadastro === "cardapio" && (
  <div className="produto-aba-card">
    <div className="premium-box">
      <h3>
        <FaStar />
        Cardápio Online e Montagem
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

      <div className="field-premium">
        <label>Tipo Produto</label>
        <select
          value={tipoProduto}
          onChange={(e) => setTipoProduto(e.target.value)}
        >
          <option value="producao">Produção Própria</option>
          <option value="revenda">Revenda</option>
          <option value="insumo">Insumo</option>
        </select>
      </div>

      <div className="field-premium">
        <label>Tempo de preparo</label>
        <input
          placeholder="0 min"
          value={tempoPreparo}
          onChange={(e) => setTempoPreparo(e.target.value)}
        />
      </div>

      <div className="field-premium full">
        <label>Restrições</label>
        <input
          placeholder="Ex.: Sem glúten, Sem lactose"
          value={restricoes}
          onChange={(e) => setRestricoes(e.target.value)}
        />
      </div>

      <ConstrutorUniversalProduto
        gruposComponentes={gruposComponentes}
        gruposSelecionados={gruposSelecionados}
        setGruposSelecionados={setGruposSelecionados}
      />
    </div>
  </div>
)}

{abaCadastro === "nutricional" && (
  <div className="produto-aba-card">
    <DadosNutricionaisProduto
      dados={informacoesNutricionais}
      setDados={setInformacoesNutricionais}
    />

    <AlergenosProduto
      alergenos={alergenos}
      setAlergenos={setAlergenos}
    />

    <SelosProduto
      selos={selos}
      setSelos={setSelos}
    />
  </div>
)}

{abaCadastro === "imagem" && (
  <div className="produto-aba-card imagem-grid-produto">
    <div className="premium-box">
      <h3>
        <FaCloudUploadAlt />
        Imagens do Produto
      </h3>

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
)}

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
              <select
  value={editCategoria}
  onChange={(e) => setEditCategoria(e.target.value)}
>
  <option value="">Selecione a categoria principal</option>

  {categoriasDisponiveis.map((cat) => (
    <option key={cat._id} value={cat.nome}>
      {cat.nome}
    </option>
  ))}
</select>
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
              <input
  placeholder="Código de Barras"
  value={editCodigoBarras}
  onChange={(e) => setEditCodigoBarras(e.target.value)}
/>

<input
  placeholder="SKU / Código Interno"
  value={editSku}
  onChange={(e) => setEditSku(e.target.value)}
/>

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

                <DadosNutricionaisProduto
  dados={editInformacoesNutricionais}
  setDados={setEditInformacoesNutricionais}
/>

<AlergenosProduto
  alergenos={editAlergenos}
  setAlergenos={setEditAlergenos}
/>

<SelosProduto
  selos={editSelos}
  setSelos={setEditSelos}
/>

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