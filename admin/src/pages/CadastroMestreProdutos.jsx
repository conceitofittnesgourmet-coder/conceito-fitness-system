import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaBoxes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSearch,
  FaEdit,
  FaTag,
  FaIndustry,
  FaWarehouse,
  FaFileInvoice,
  FaUtensils,
  FaSave,
} from "react-icons/fa";

import toast from "react-hot-toast";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import "../styles/cadastro-mestre-produtos.css";

const criarFormVazio = () => ({
  dadosProduto: {
    nome: "",
    categoria: "",
    sku: "",
    codigoBarras: "",
    ativo: true,
    preco: "",
    custo: "",
    estoque: "",
  },

  dadosFiscais: {
    ncm: "",
    cest: "",
    cfopInterno: "5102",
    cfopInterestadual: "6102",
    origemMercadoria: "0",
    csosn: "102",
    cstIcms: "",
    cstPis: "99",
    cstCofins: "99",
    unidadeComercial: "UN",
    unidadeTributavel: "UN",
    emitirNfce: true,
  },

  cadastroMestre: {
    marca: "",
    fabricante: "",
    referenciaInterna: "",

    comercial: {
      precoPromocional: "",
      vendaMinima: 1,
      permiteDesconto: true,
    },

    producao: {
      controlaProducao: false,
      rendimentoPadrao: 1,
      unidadeRendimento: "UN",
      pesoFinalGramas: "",
      perdaPercentual: "",
    },

    estoque: {
      controlaEstoque: true,
      estoqueMaximo: "",
      localizacao: "",
    },

    cardapio: {
      nomePublico: "",
      descricaoCurta: "",
      ordemExibicao: 0,
    },

    marketplaces: {
      ifoodCodigo: "",
      aiqfomeCodigo: "",
    },
  },
});

function CadastroMestreProdutos() {
  const [dados, setDados] = useState({
    resumo: {},
    produtos: [],
  });

  const [busca, setBusca] = useState("");
  const [status, setStatus] =
    useState("todos");

  const [loading, setLoading] =
    useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const [editando, setEditando] =
    useState(null);

  const [form, setForm] =
    useState(criarFormVazio());

  async function carregar() {
    setLoading(true);

    try {
      const { data } = await api.get(
        "/produtos/mestre/cadastro",
        {
          params: {
            search: busca,
            status,
          },
        }
      );

      setDados(data);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erro ao carregar cadastro mestre"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(
      carregar,
      250
    );

    return () =>
      clearTimeout(timer);
  }, [busca, status]);

  const cards = useMemo(
    () => [
      [
        "Total",
        dados.resumo?.total || 0,
      ],
      [
        "Completos",
        dados.resumo?.completo || 0,
      ],
      [
        "Atenção",
        dados.resumo?.atencao || 0,
      ],
      [
        "Incompletos",
        dados.resumo?.incompleto || 0,
      ],
      [
        "Qualidade média",
        `${
          dados.resumo
            ?.percentualMedio || 0
        }%`,
      ],
    ],
    [dados]
  );

  function abrir(produto) {
    const vazio = criarFormVazio();

    setEditando(produto);

    setForm({
      dadosProduto: {
        nome:
          produto.nome || "",
        categoria:
          produto.categoria || "",
        sku:
          produto.sku || "",
        codigoBarras:
          produto.codigoBarras || "",
        ativo:
          produto.ativo !== false,
        preco:
          produto.preco ?? "",
        custo:
          produto.custo ?? "",
        estoque:
          produto.estoque ?? "",
      },

      dadosFiscais: {
        ...vazio.dadosFiscais,
        ...(produto.dadosFiscais ||
          {}),
      },

      cadastroMestre: {
        ...vazio.cadastroMestre,
        ...(produto.cadastroMestre ||
          {}),

        comercial: {
          ...vazio.cadastroMestre
            .comercial,
          ...(produto
            .cadastroMestre
            ?.comercial || {}),
        },

        producao: {
          ...vazio.cadastroMestre
            .producao,
          ...(produto
            .cadastroMestre
            ?.producao || {}),
        },

        estoque: {
          ...vazio.cadastroMestre
            .estoque,
          ...(produto
            .cadastroMestre
            ?.estoque || {}),
        },

        cardapio: {
          ...vazio.cadastroMestre
            .cardapio,
          ...(produto
            .cadastroMestre
            ?.cardapio || {}),
        },

        marketplaces: {
          ...vazio.cadastroMestre
            .marketplaces,
          ...(produto
            .cadastroMestre
            ?.marketplaces || {}),
        },
      },
    });
  }

  function setProduto(
    campo,
    valor
  ) {
    setForm((atual) => ({
      ...atual,

      dadosProduto: {
        ...atual.dadosProduto,
        [campo]: valor,
      },
    }));
  }

  function setFiscal(
    campo,
    valor
  ) {
    setForm((atual) => ({
      ...atual,

      dadosFiscais: {
        ...atual.dadosFiscais,
        [campo]: valor,
      },
    }));
  }

  function setMestre(
    campo,
    valor
  ) {
    setForm((atual) => ({
      ...atual,

      cadastroMestre: {
        ...atual.cadastroMestre,
        [campo]: valor,
      },
    }));
  }

  function setGrupo(
    grupo,
    campo,
    valor
  ) {
    setForm((atual) => ({
      ...atual,

      cadastroMestre: {
        ...atual.cadastroMestre,

        [grupo]: {
          ...atual
            .cadastroMestre[
              grupo
            ],

          [campo]: valor,
        },
      },
    }));
  }

  async function salvar(event) {
    event.preventDefault();

    if (!editando?._id) {
      return;
    }

    if (
      !form.dadosProduto.nome.trim()
    ) {
      toast.error(
        "Informe o nome do produto."
      );

      return;
    }

    setSalvando(true);

    try {
      await api.patch(
        `/produtos/${editando._id}/mestre`,
        form
      );

      toast.success(
        "Cadastro mestre atualizado com sucesso"
      );

      setEditando(null);

      await carregar();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erro ao salvar cadastro mestre"
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AdminLayout
      title="Cadastro Mestre de Produtos"
      subtitle="Base única para comercial, produção, estoque, cardápio e marketplaces"
    >
      <div className="mestre-page">
        <div className="mestre-cards">
          {cards.map(
            ([label, valor]) => (
              <div
                className="mestre-card"
                key={label}
              >
                <span>
                  {label}
                </span>

                <strong>
                  {valor}
                </strong>
              </div>
            )
          )}
        </div>

        <div className="mestre-toolbar">
          <div className="mestre-search">
            <FaSearch />

            <input
              value={busca}
              onChange={(e) =>
                setBusca(
                  e.target.value
                )
              }
              placeholder="Buscar por nome, SKU ou código de barras"
            />
          </div>

          <select
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value
              )
            }
          >
            <option value="todos">
              Todos os status
            </option>

            <option value="completo">
              Completo
            </option>

            <option value="atencao">
              Atenção
            </option>

            <option value="incompleto">
              Incompleto
            </option>
          </select>
        </div>

        <div className="mestre-table-wrap">
          <table className="mestre-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>SKU</th>
                <th>Preço</th>
                <th>Custo</th>
                <th>Estoque</th>
                <th>Qualidade</th>
                <th>Pendências</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8">
                    Carregando...
                  </td>
                </tr>
              ) : (
                dados.produtos?.map(
                  (produto) => (
                    <tr
                      key={
                        produto._id
                      }
                    >
                      <td>
                        <strong>
                          {
                            produto.nome
                          }
                        </strong>

                        <small>
                          {produto.categoria ||
                            "Sem categoria"}
                        </small>
                      </td>

                      <td>
                        {produto.sku ||
                          "—"}
                      </td>

                      <td>
                        R${" "}
                        {Number(
                          produto.preco ||
                            0
                        ).toFixed(2)}
                      </td>

                      <td>
                        R${" "}
                        {Number(
                          produto.custo ||
                            0
                        ).toFixed(2)}
                      </td>

                      <td>
                        {produto.estoque ??
                          0}
                      </td>

                      <td>
                        <span
                          className={`mestre-status ${produto.diagnosticoCadastro.status}`}
                        >
                          {produto
                            .diagnosticoCadastro
                            .status ===
                          "completo" ? (
                            <FaCheckCircle />
                          ) : (
                            <FaExclamationTriangle />
                          )}

                          {
                            produto
                              .diagnosticoCadastro
                              .percentual
                          }
                          %
                        </span>
                      </td>

                      <td className="mestre-pendencias">
                        {produto
                          .diagnosticoCadastro
                          .pendencias
                          .join(", ") ||
                          "Nenhuma"}
                      </td>

                      <td>
                        <button
                          className="mestre-edit-btn"
                          onClick={() =>
                            abrir(
                              produto
                            )
                          }
                        >
                          <FaEdit />
                          Editar
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editando && (
        <div className="mestre-overlay">
          <form
            className="mestre-modal"
            onSubmit={salvar}
          >
            <header className="mestre-modal-header">
              <div className="mestre-modal-title">
                <span className="mestre-modal-icon">
                  <FaBoxes />
                </span>

                <div>
                  <h2>
                    Cadastro Mestre
                  </h2>

                  <p>
                    Complete as
                    informações do
                    produto para manter
                    comercial, estoque,
                    fiscal e canais
                    sincronizados.
                  </p>
                </div>
              </div>

              <button
                className="mestre-close"
                type="button"
                onClick={() =>
                  setEditando(null)
                }
              >
                ×
              </button>
            </header>

            <div className="mestre-modal-body">
              <section className="mestre-section">
                <div className="mestre-section-title">
                  <span>
                    <FaTag />
                  </span>

                  <div>
                    <h3>
                      1.
                      Identificação
                    </h3>

                    <p>
                      Dados principais
                      utilizados em todo
                      o sistema.
                    </p>
                  </div>
                </div>

                <div className="mestre-grid mestre-grid-4">
                  <label>
                    <span>
                      Código (SKU)
                    </span>

                    <input
                      value={
                        form
                          .dadosProduto
                          .sku
                      }
                      onChange={(e) =>
                        setProduto(
                          "sku",
                          e.target.value
                        )
                      }
                      placeholder="Ex.: PROD-0001"
                    />
                  </label>

                  <label>
                    <span>
                      Código de barras
                      (EAN)
                    </span>

                    <input
                      value={
                        form
                          .dadosProduto
                          .codigoBarras
                      }
                      onChange={(e) =>
                        setProduto(
                          "codigoBarras",
                          e.target.value
                        )
                      }
                      placeholder="Ex.: 7891234567890"
                    />
                  </label>

                  <label>
                    <span>
                      Unidade de medida
                    </span>

                    <select
                      value={
                        form
                          .dadosFiscais
                          .unidadeComercial
                      }
                      onChange={(e) =>
                        setFiscal(
                          "unidadeComercial",
                          e.target.value
                        )
                      }
                    >
                      <option value="UN">
                        UN - Unidade
                      </option>

                      <option value="KG">
                        KG - Quilograma
                      </option>

                      <option value="G">
                        G - Grama
                      </option>

                      <option value="LT">
                        LT - Litro
                      </option>

                      <option value="ML">
                        ML - Mililitro
                      </option>
                    </select>
                  </label>

                  <label>
                    <span>
                      Status
                    </span>

                    <select
                      value={
                        form
                          .dadosProduto
                          .ativo
                          ? "ativo"
                          : "inativo"
                      }
                      onChange={(e) =>
                        setProduto(
                          "ativo",
                          e.target
                            .value ===
                            "ativo"
                        )
                      }
                    >
                      <option value="ativo">
                        Ativo
                      </option>

                      <option value="inativo">
                        Inativo
                      </option>
                    </select>
                  </label>
                </div>

                <div className="mestre-grid mestre-grid-2">
                  <label>
                    <span>
                      Nome do produto *
                    </span>

                    <input
                      value={
                        form
                          .dadosProduto
                          .nome
                      }
                      onChange={(e) =>
                        setProduto(
                          "nome",
                          e.target.value
                        )
                      }
                      placeholder="Digite o nome do produto"
                    />
                  </label>

                  <label>
                    <span>
                      Categoria
                    </span>

                    <input
                      value={
                        form
                          .dadosProduto
                          .categoria
                      }
                      onChange={(e) =>
                        setProduto(
                          "categoria",
                          e.target.value
                        )
                      }
                      placeholder="Ex.: Sobremesas"
                    />
                  </label>
                </div>
              </section>

              <section className="mestre-section">
                <div className="mestre-section-title">
                  <span>
                    <FaIndustry />
                  </span>

                  <div>
                    <h3>
                      2. Comercial e
                      classificação
                    </h3>

                    <p>
                      Informações de
                      venda,
                      identificação e
                      margem.
                    </p>
                  </div>
                </div>

                <div className="mestre-grid mestre-grid-3">
                  <label>
                    <span>Marca</span>

                    <input
                      value={
                        form
                          .cadastroMestre
                          .marca
                      }
                      onChange={(e) =>
                        setMestre(
                          "marca",
                          e.target.value
                        )
                      }
                      placeholder="Marca"
                    />
                  </label>

                  <label>
                    <span>
                      Fabricante
                    </span>

                    <input
                      value={
                        form
                          .cadastroMestre
                          .fabricante
                      }
                      onChange={(e) =>
                        setMestre(
                          "fabricante",
                          e.target.value
                        )
                      }
                      placeholder="Fabricante"
                    />
                  </label>

                  <label>
                    <span>
                      Referência interna
                    </span>

                    <input
                      value={
                        form
                          .cadastroMestre
                          .referenciaInterna
                      }
                      onChange={(e) =>
                        setMestre(
                          "referenciaInterna",
                          e.target.value
                        )
                      }
                      placeholder="Referência"
                    />
                  </label>

                  <label>
                    <span>
                      Preço de venda
                    </span>

                    <input
                      type="number"
                      step="0.01"
                      value={
                        form
                          .dadosProduto
                          .preco
                      }
                      onChange={(e) =>
                        setProduto(
                          "preco",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Custo / CMV
                    </span>

                    <input
                      type="number"
                      step="0.01"
                      value={
                        form
                          .dadosProduto
                          .custo
                      }
                      onChange={(e) =>
                        setProduto(
                          "custo",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Preço promocional
                    </span>

                    <input
                      type="number"
                      step="0.01"
                      value={
                        form
                          .cadastroMestre
                          .comercial
                          .precoPromocional
                      }
                      onChange={(e) =>
                        setGrupo(
                          "comercial",
                          "precoPromocional",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Venda mínima
                    </span>

                    <input
                      type="number"
                      step="0.001"
                      value={
                        form
                          .cadastroMestre
                          .comercial
                          .vendaMinima
                      }
                      onChange={(e) =>
                        setGrupo(
                          "comercial",
                          "vendaMinima",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label className="mestre-switch-card">
                    <input
                      type="checkbox"
                      checked={
                        form
                          .cadastroMestre
                          .comercial
                          .permiteDesconto
                      }
                      onChange={(e) =>
                        setGrupo(
                          "comercial",
                          "permiteDesconto",
                          e.target.checked
                        )
                      }
                    />

                    <div>
                      <strong>
                        Permite desconto
                      </strong>

                      <small>
                        Autoriza descontos
                        no PDV.
                      </small>
                    </div>
                  </label>
                </div>
              </section>

              <section className="mestre-section">
                <div className="mestre-section-title">
                  <span>
                    <FaWarehouse />
                  </span>

                  <div>
                    <h3>
                      3. Produção e
                      estoque
                    </h3>

                    <p>
                      Controle de
                      rendimento e
                      disponibilidade.
                    </p>
                  </div>
                </div>

                <div className="mestre-grid mestre-grid-3">
                  <label>
                    <span>
                      Rendimento padrão
                    </span>

                    <input
                      type="number"
                      step="0.001"
                      value={
                        form
                          .cadastroMestre
                          .producao
                          .rendimentoPadrao
                      }
                      onChange={(e) =>
                        setGrupo(
                          "producao",
                          "rendimentoPadrao",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Unidade do
                      rendimento
                    </span>

                    <input
                      value={
                        form
                          .cadastroMestre
                          .producao
                          .unidadeRendimento
                      }
                      onChange={(e) =>
                        setGrupo(
                          "producao",
                          "unidadeRendimento",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Peso final (g)
                    </span>

                    <input
                      type="number"
                      value={
                        form
                          .cadastroMestre
                          .producao
                          .pesoFinalGramas
                      }
                      onChange={(e) =>
                        setGrupo(
                          "producao",
                          "pesoFinalGramas",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Perda (%)
                    </span>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={
                        form
                          .cadastroMestre
                          .producao
                          .perdaPercentual
                      }
                      onChange={(e) =>
                        setGrupo(
                          "producao",
                          "perdaPercentual",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Estoque atual
                    </span>

                    <input
                      type="number"
                      value={
                        form
                          .dadosProduto
                          .estoque
                      }
                      onChange={(e) =>
                        setProduto(
                          "estoque",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Estoque máximo
                    </span>

                    <input
                      type="number"
                      value={
                        form
                          .cadastroMestre
                          .estoque
                          .estoqueMaximo
                      }
                      onChange={(e) =>
                        setGrupo(
                          "estoque",
                          "estoqueMaximo",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Localização
                    </span>

                    <input
                      value={
                        form
                          .cadastroMestre
                          .estoque
                          .localizacao
                      }
                      onChange={(e) =>
                        setGrupo(
                          "estoque",
                          "localizacao",
                          e.target.value
                        )
                      }
                      placeholder="Ex.: Freezer 01"
                    />
                  </label>
                </div>

                <div className="mestre-switches">
                  <label className="mestre-switch-card">
                    <input
                      type="checkbox"
                      checked={
                        form
                          .cadastroMestre
                          .producao
                          .controlaProducao
                      }
                      onChange={(e) =>
                        setGrupo(
                          "producao",
                          "controlaProducao",
                          e.target.checked
                        )
                      }
                    />

                    <div>
                      <strong>
                        Controla produção
                      </strong>
                      <small>
                        Produto participa
                        do fluxo de
                        produção.
                      </small>
                    </div>
                  </label>

                  <label className="mestre-switch-card">
                    <input
                      type="checkbox"
                      checked={
                        form
                          .cadastroMestre
                          .estoque
                          .controlaEstoque
                      }
                      onChange={(e) =>
                        setGrupo(
                          "estoque",
                          "controlaEstoque",
                          e.target.checked
                        )
                      }
                    />

                    <div>
                      <strong>
                        Controla estoque
                      </strong>
                      <small>
                        Movimenta saldo
                        automaticamente.
                      </small>
                    </div>
                  </label>
                </div>
              </section>

              <section className="mestre-section">
                <div className="mestre-section-title">
                  <span>
                    <FaFileInvoice />
                  </span>

                  <div>
                    <h3>
                      4. Informações
                      fiscais
                    </h3>

                    <p>
                      Tributação usada
                      na emissão fiscal.
                    </p>
                  </div>
                </div>

                <div className="mestre-grid mestre-grid-4">
                  <label>
                    <span>NCM *</span>

                    <input
                      maxLength="8"
                      value={
                        form
                          .dadosFiscais
                          .ncm
                      }
                      onChange={(e) =>
                        setFiscal(
                          "ncm",
                          e.target.value
                        )
                      }
                      placeholder="Ex.: 19053100"
                    />
                  </label>

                  <label>
                    <span>CEST</span>

                    <input
                      maxLength="7"
                      value={
                        form
                          .dadosFiscais
                          .cest
                      }
                      onChange={(e) =>
                        setFiscal(
                          "cest",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      CFOP interno
                    </span>

                    <input
                      maxLength="4"
                      value={
                        form
                          .dadosFiscais
                          .cfopInterno
                      }
                      onChange={(e) =>
                        setFiscal(
                          "cfopInterno",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>CSOSN</span>

                    <input
                      maxLength="3"
                      value={
                        form
                          .dadosFiscais
                          .csosn
                      }
                      onChange={(e) =>
                        setFiscal(
                          "csosn",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Origem da
                      mercadoria
                    </span>

                    <select
                      value={
                        form
                          .dadosFiscais
                          .origemMercadoria
                      }
                      onChange={(e) =>
                        setFiscal(
                          "origemMercadoria",
                          e.target.value
                        )
                      }
                    >
                      <option value="0">
                        0 - Nacional
                      </option>

                      <option value="1">
                        1 - Estrangeira
                        importação direta
                      </option>

                      <option value="2">
                        2 - Estrangeira
                        mercado interno
                      </option>

                      <option value="3">
                        3 - Nacional com
                        conteúdo importado
                      </option>
                    </select>
                  </label>

                  <label>
                    <span>CST PIS</span>

                    <input
                      maxLength="2"
                      value={
                        form
                          .dadosFiscais
                          .cstPis
                      }
                      onChange={(e) =>
                        setFiscal(
                          "cstPis",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      CST COFINS
                    </span>

                    <input
                      maxLength="2"
                      value={
                        form
                          .dadosFiscais
                          .cstCofins
                      }
                      onChange={(e) =>
                        setFiscal(
                          "cstCofins",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label className="mestre-switch-card">
                    <input
                      type="checkbox"
                      checked={
                        form
                          .dadosFiscais
                          .emitirNfce !==
                        false
                      }
                      onChange={(e) =>
                        setFiscal(
                          "emitirNfce",
                          e.target.checked
                        )
                      }
                    />

                    <div>
                      <strong>
                        Emitir NFC-e
                      </strong>

                      <small>
                        Produto disponível
                        para documento
                        fiscal.
                      </small>
                    </div>
                  </label>
                </div>
              </section>

              <section className="mestre-section">
                <div className="mestre-section-title">
                  <span>
                    <FaUtensils />
                  </span>

                  <div>
                    <h3>
                      5. Cardápio e
                      canais
                    </h3>

                    <p>
                      Informações usadas
                      na apresentação e
                      marketplaces.
                    </p>
                  </div>
                </div>

                <div className="mestre-grid mestre-grid-3">
                  <label>
                    <span>
                      Nome público
                    </span>

                    <input
                      value={
                        form
                          .cadastroMestre
                          .cardapio
                          .nomePublico
                      }
                      onChange={(e) =>
                        setGrupo(
                          "cardapio",
                          "nomePublico",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Ordem de exibição
                    </span>

                    <input
                      type="number"
                      value={
                        form
                          .cadastroMestre
                          .cardapio
                          .ordemExibicao
                      }
                      onChange={(e) =>
                        setGrupo(
                          "cardapio",
                          "ordemExibicao",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Código iFood
                    </span>

                    <input
                      value={
                        form
                          .cadastroMestre
                          .marketplaces
                          .ifoodCodigo
                      }
                      onChange={(e) =>
                        setGrupo(
                          "marketplaces",
                          "ifoodCodigo",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Código aiqfome
                    </span>

                    <input
                      value={
                        form
                          .cadastroMestre
                          .marketplaces
                          .aiqfomeCodigo
                      }
                      onChange={(e) =>
                        setGrupo(
                          "marketplaces",
                          "aiqfomeCodigo",
                          e.target.value
                        )
                      }
                    />
                  </label>
                </div>

                <label className="mestre-textarea-label">
                  <span>
                    Descrição curta
                  </span>

                  <textarea
                    maxLength="240"
                    value={
                      form
                        .cadastroMestre
                        .cardapio
                        .descricaoCurta
                    }
                    onChange={(e) =>
                      setGrupo(
                        "cardapio",
                        "descricaoCurta",
                        e.target.value
                      )
                    }
                    placeholder="Descrição curta para cardápio e canais de venda"
                  />

                  <small>
                    {
                      form
                        .cadastroMestre
                        .cardapio
                        .descricaoCurta
                        .length
                    }
                    /240 caracteres
                  </small>
                </label>
              </section>
            </div>

            <footer className="mestre-modal-footer">
              <button
                type="button"
                className="mestre-btn-secondary"
                onClick={() =>
                  setEditando(null)
                }
              >
                Cancelar
              </button>

              <button
                className="mestre-btn-primary"
                type="submit"
                disabled={salvando}
              >
                <FaSave />

                {salvando
                  ? "Salvando..."
                  : "Salvar cadastro mestre"}
              </button>
            </footer>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}

export default CadastroMestreProdutos;