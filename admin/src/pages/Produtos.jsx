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

import DadosNutricionaisProduto from "../components/ProdutoForm/DadosNutricionaisProduto";
import AlergenosProduto from "../components/ProdutoForm/AlergenosProduto";
import SelosProduto from "../components/ProdutoForm/SelosProduto";
import WizardProduto from "../components/ProdutoForm/WizardProduto";
import TemplatePreview from "../components/ProdutoForm/TemplatePreview";
import ProdutoStepper from "../components/ProdutoForm/ProdutoStepper";
import ProdutoBasico from "../components/ProdutoForm/ProdutoBasico";
import ProdutoVenda from "../components/ProdutoForm/ProdutoVenda";
import ProdutoCardapio from "../components/ProdutoForm/ProdutoCardapio";
import ProdutoNutricional from "../components/ProdutoForm/ProdutoNutricional";
import ProdutoFiscal from "../components/ProdutoForm/ProdutoFiscal";
import ProdutoImagem from "../components/ProdutoForm/ProdutoImagem";
import ProdutoConfigEngine from "../components/ProdutoConfig/ProdutoConfigEngine";

const API_URL = "https://conceito-fitness-system.onrender.com";

const DADOS_FISCAIS_INICIAIS = {
  ncm: "",
  cest: "",
  origemMercadoria: "0",
  codigoBeneficioFiscal: "",
  cfopInterno: "5102",
  cfopInterestadual: "6102",
  csosn: "102",
  cstIcms: "",
  aliquotaIcms: "",
  aliquotaFcp: "",
  cstPis: "99",
  aliquotaPis: "",
  cstCofins: "99",
  aliquotaCofins: "",
  cstIpi: "",
  aliquotaIpi: "",
  gtin: "",
  gtinTributavel: "",
  unidadeComercial: "UN",
  unidadeTributavel: "UN",
  cstIbsCbs: "",
  cClassTrib: "",
  aliquotaIbs: "",
  aliquotaCbs: "",
  produtoTributavel: true,
  emitirNfce: true,
};

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
  const [configuracaoGrupos, setConfiguracaoGrupos] = useState([]);
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

const [dadosFiscais, setDadosFiscais] = useState({
  ...DADOS_FISCAIS_INICIAIS,
});

const [editDadosFiscais, setEditDadosFiscais] = useState({
  ...DADOS_FISCAIS_INICIAIS,
});

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [abaCadastro, setAbaCadastro] = useState("basico");
  const [tipoWizard, setTipoWizard] = useState("simples");
  const templatesProduto = {
  simples: [],

  bolo: [
    "Tamanho",
    "Massa",
    "Recheio",
    "Cobertura",
    "Decoração",
    "Adicionais",
  ],

  torta: [
    "Tamanho",
    "Massa",
    "Recheio",
    "Cobertura",
  ],

  cafe: [
    "Tamanho",
    "Leite",
    "Temperatura",
    "Calda",
    "Extras",
  ],

  combo: [
    "Itens",
    "Bebidas",
    "Sobremesas",
  ],

  kit: [
    "Produtos",
    "Embalagem",
    "Cartão",
  ],

  cesta: [
    "Produtos",
    "Embalagem",
    "Mensagem",
    "Laço",
  ],

  peso: [
    "Peso",
  ],
};

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
  const [editConfiguracaoGrupos, setEditConfiguracaoGrupos] = useState([]);
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
formData.append(
  "configuracaoGrupos",
  JSON.stringify(configuracaoGrupos)
);
formData.append("informacoesNutricionais", JSON.stringify(informacoesNutricionais));
formData.append("alergenos", JSON.stringify(alergenos));
formData.append("selos", JSON.stringify(selos));
formData.append(
  "dadosFiscais",
  JSON.stringify(dadosFiscais)
);
      
      

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

    setEditConfiguracaoGrupos(produto.configuracaoGrupos || []);
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

setEditDadosFiscais({
  ...DADOS_FISCAIS_INICIAIS,
  ...(produto.dadosFiscais || {}),
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

formData.append(
  "configuracaoGrupos",
  JSON.stringify(editConfiguracaoGrupos)
);

      formData.append("informacoesNutricionais", JSON.stringify(editInformacoesNutricionais));
formData.append("alergenos", JSON.stringify(editAlergenos));
formData.append("selos", JSON.stringify(editSelos));
formData.append(
  "dadosFiscais",
  JSON.stringify(editDadosFiscais)
);

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
    setConfiguracaoGrupos([]);
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

 setDadosFiscais({
  ...DADOS_FISCAIS_INICIAIS,
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

  const etapasConcluidas = useMemo(() => {
  const concluidas = [];

  if (nome.trim() && categoria) {
    concluidas.push("basico");
  }

  if (
    String(preco).trim() !== "" &&
    String(estoque).trim() !== ""
  ) {
    concluidas.push("venda");
  }

  if (
    tipoProduto ||
    destaque ||
    gruposSelecionados.length > 0
  ) {
    concluidas.push("cardapio");
  }

  const temNutricional = Object.values(
    informacoesNutricionais
  ).some((valor) => String(valor || "").trim() !== "");

  const temSelos = Object.values(selos).some(Boolean);
  const temAlergenos = Object.values(alergenos).some(Boolean);

  if (temNutricional || temSelos || temAlergenos) {
    concluidas.push("nutricional");
  }

  if (
  String(dadosFiscais.ncm || "").length === 8 &&
  dadosFiscais.cfopInterno &&
  dadosFiscais.origemMercadoria !== "" &&
  (dadosFiscais.csosn || dadosFiscais.cstIcms)
) {
  concluidas.push("fiscal");
}

  if (imagens.length > 0) {
    concluidas.push("midia");
  }

  return concluidas;
}, [
  nome,
  categoria,
  preco,
  estoque,
  tipoProduto,
  destaque,
  gruposSelecionados,
  informacoesNutricionais,
  selos,
  alergenos,
  dadosFiscais,
  imagens,
  ]);

const progressoCadastro =
  (etapasConcluidas.length / 8) * 100;

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

          <WizardProduto
  tipoWizard={tipoWizard}
  setTipoWizard={setTipoWizard}
  templatesProduto={templatesProduto}
  gruposComponentes={gruposComponentes}
  setGruposSelecionados={setGruposSelecionados}
  setUnidadeMedida={setUnidadeMedida}
  setVendaPorPeso={setVendaPorPeso}
  setPermiteFracionado={setPermiteFracionado}
  setTipoProduto={setTipoProduto}
  setAbaCadastro={setAbaCadastro}
/>

<TemplatePreview
  tipoWizard={tipoWizard}
  templatesProduto={templatesProduto}
  gruposSelecionados={gruposSelecionados}
/>

<ProdutoStepper
  abaCadastro={abaCadastro}
  setAbaCadastro={setAbaCadastro}
  progresso={progressoCadastro}
  etapasConcluidas={etapasConcluidas}
/>

{abaCadastro === "basico" && (
  <ProdutoBasico
    nome={nome}
    setNome={setNome}
    categoria={categoria}
    setCategoria={setCategoria}
    categorias={categorias}
    setCategorias={setCategorias}
    categoriasDisponiveis={categoriasDisponiveis}
    descricao={descricao}
    setDescricao={setDescricao}
  />
)}

{abaCadastro === "venda" && (
  <ProdutoVenda
    tipoWizard={tipoWizard}
    preco={preco}
    setPreco={setPreco}
    custo={custo}
    setCusto={setCusto}
    estoque={estoque}
    setEstoque={setEstoque}
    peso={peso}
    setPeso={setPeso}
    unidadeMedida={unidadeMedida}
    setUnidadeMedida={setUnidadeMedida}
    vendaPorPeso={vendaPorPeso}
    setVendaPorPeso={setVendaPorPeso}
    permiteFracionado={permiteFracionado}
    setPermiteFracionado={setPermiteFracionado}
    codigoBarras={codigoBarras}
    setCodigoBarras={setCodigoBarras}
    sku={sku}
    setSku={setSku}
  />
)}

{abaCadastro === "cardapio" && (
  <ProdutoCardapio
  tipoWizard={tipoWizard}
  destaque={destaque}
  setDestaque={setDestaque}
  tipoProduto={tipoProduto}
  setTipoProduto={setTipoProduto}
  tempoPreparo={tempoPreparo}
  setTempoPreparo={setTempoPreparo}
  restricoes={restricoes}
  setRestricoes={setRestricoes}
  gruposComponentes={gruposComponentes}
  gruposSelecionados={gruposSelecionados}
  setGruposSelecionados={setGruposSelecionados}
  configuracaoGrupos={configuracaoGrupos}
  setConfiguracaoGrupos={setConfiguracaoGrupos}
/>
)}

{abaCadastro === "nutricional" && (
  <ProdutoNutricional
    informacoesNutricionais={informacoesNutricionais}
    setInformacoesNutricionais={setInformacoesNutricionais}
    alergenos={alergenos}
    setAlergenos={setAlergenos}
    selos={selos}
    setSelos={setSelos}
  />
)}

{abaCadastro === "fiscal" && (
  <ProdutoFiscal
    dadosFiscais={dadosFiscais}
    setDadosFiscais={setDadosFiscais}
  />
)}

{abaCadastro === "midia" && (
  <ProdutoImagem
    getRootProps={getRootProps}
    getInputProps={getInputProps}
    isDragActive={isDragActive}
    previewCadastro={previewCadastro}
  />
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

              <ProdutoConfigEngine
  gruposComponentes={gruposComponentes}
  gruposSelecionados={editGruposSelecionados}
  setGruposSelecionados={setEditGruposSelecionados}
  configuracaoGrupos={editConfiguracaoGrupos}
  setConfiguracaoGrupos={setEditConfiguracaoGrupos}
/>

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