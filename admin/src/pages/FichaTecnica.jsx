import { useEffect, useMemo, useState } from "react";
import {
  FaClipboardList,
  FaPlus,
  FaSave,
  FaSyncAlt,
} from "react-icons/fa";

import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import IngredienteRow from "../components/FichaTecnica/IngredienteRow";
import VariacaoCard from "../components/FichaTecnica/VariacaoCard";
import ResumoCustos from "../components/FichaTecnica/ResumoCustos";
import "../styles/fichaTecnica.css";

function criarIngredienteVazio() {
  return {
    idLocal: crypto.randomUUID(),
    materiaPrima: "",
    quantidade: "",
    unidade: "g",
  };
}

function criarVariacaoVazia() {
  return {
    idLocal: crypto.randomUUID(),
    grupoComponente: "",
    opcaoComponente: "",
    nomeGrupo: "",
    nomeOpcao: "",
    ativa: true,
    itens: [criarIngredienteVazio()],
  };
}

function FichaTecnica() {
  const [produtos, setProdutos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [opcoes, setOpcoes] = useState([]);
  const [fichas, setFichas] = useState([]);

  const [produtoId, setProdutoId] = useState("");
  const [ingredientesBase, setIngredientesBase] = useState([
    criarIngredienteVazio(),
  ]);
  const [variacoes, setVariacoes] = useState([]);
  const [observacao, setObservacao] = useState("");

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const produtoSelecionado = useMemo(
    () =>
      produtos.find(
        (produto) => String(produto._id) === String(produtoId)
      ),
    [produtos, produtoId]
  );

  const gruposDoProduto = useMemo(() => {
    if (!produtoSelecionado) return [];

    const ids = (produtoSelecionado.gruposComponentes || []).map(
      (grupo) =>
        typeof grupo === "string"
          ? String(grupo)
          : String(grupo?._id || grupo)
    );

    return grupos.filter((grupo) =>
      ids.includes(String(grupo._id))
    );
  }, [produtoSelecionado, grupos]);

  async function carregarDados() {
    try {
      setLoading(true);

      const [
        produtosRes,
        materiasRes,
        gruposRes,
        opcoesRes,
        fichasRes,
      ] = await Promise.all([
        api.get("/produtos"),
        api.get("/materias-primas"),
        api.get("/grupos-componentes"),
        api.get("/opcoes-componentes"),
        api.get("/fichas-tecnicas"),
      ]);

      setProdutos(produtosRes.data.produtos || []);

      setMaterias(
        materiasRes.data.materias ||
          materiasRes.data.materiasPrimas ||
          []
      );

      setGrupos(gruposRes.data.grupos || []);
      setOpcoes(opcoesRes.data.opcoes || []);
      setFichas(fichasRes.data.fichas || []);
    } catch (error) {
      console.log("Erro ao carregar ficha técnica:", error);

      alert(
        error.response?.data?.message ||
          "Não foi possível carregar os dados da ficha técnica."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarFichaProduto(idProduto) {
    setProdutoId(idProduto);

    if (!idProduto) {
      limparEditor(false);
      return;
    }

    try {
      const response = await api.get(
        `/fichas-tecnicas/produto/${idProduto}`
      );

      const ficha = response.data.ficha;

      if (!ficha) {
        setIngredientesBase([criarIngredienteVazio()]);
        setVariacoes([]);
        setObservacao("");
        return;
      }

      setIngredientesBase(
        ficha.itens?.length
          ? ficha.itens.map((item) => ({
              idLocal: item._id || crypto.randomUUID(),
              materiaPrima:
                item.materiaPrima?._id ||
                item.materiaPrima ||
                "",
              quantidade: item.quantidade || "",
              unidade: item.unidade || "g",
            }))
          : [criarIngredienteVazio()]
      );

      setVariacoes(
        (ficha.variacoes || []).map((variacao) => ({
          idLocal: variacao._id || crypto.randomUUID(),

          grupoComponente:
            variacao.grupoComponente?._id ||
            variacao.grupoComponente ||
            "",

          opcaoComponente:
            variacao.opcaoComponente?._id ||
            variacao.opcaoComponente ||
            "",

          nomeGrupo:
            variacao.nomeGrupo ||
            variacao.grupoComponente?.nome ||
            "",

          nomeOpcao:
            variacao.nomeOpcao ||
            variacao.opcaoComponente?.nome ||
            "",

          ativa: variacao.ativa !== false,

          itens: (variacao.itens || []).map((item) => ({
            idLocal: item._id || crypto.randomUUID(),
            materiaPrima:
              item.materiaPrima?._id ||
              item.materiaPrima ||
              "",
            quantidade: item.quantidade || "",
            unidade: item.unidade || "g",
          })),
        }))
      );

      setObservacao(ficha.observacao || "");
    } catch (error) {
      console.log("Erro ao buscar ficha do produto:", error);

      alert(
        error.response?.data?.message ||
          "Não foi possível carregar a ficha deste produto."
      );
    }
  }

  function atualizarIngredienteBase(indice, novoItem) {
    setIngredientesBase((lista) =>
      lista.map((item, index) =>
        index === indice ? novoItem : item
      )
    );
  }

  function removerIngredienteBase(indice) {
    setIngredientesBase((lista) =>
      lista.filter((_, index) => index !== indice)
    );
  }

  function adicionarIngredienteBase() {
    setIngredientesBase((lista) => [
      ...lista,
      criarIngredienteVazio(),
    ]);
  }

  function adicionarVariacao() {
    setVariacoes((lista) => [
      ...lista,
      criarVariacaoVazia(),
    ]);
  }

  function atualizarVariacao(indice, novaVariacao) {
    setVariacoes((lista) =>
      lista.map((variacao, index) =>
        index === indice ? novaVariacao : variacao
      )
    );
  }

  function removerVariacao(indice) {
    setVariacoes((lista) =>
      lista.filter((_, index) => index !== indice)
    );
  }

  function validarFicha() {
    if (!produtoId) {
      alert("Selecione um produto.");
      return false;
    }

    const baseValidos = ingredientesBase.filter(
      (item) =>
        item.materiaPrima &&
        Number(item.quantidade || 0) > 0
    );

    for (const variacao of variacoes) {
      if (
        !variacao.grupoComponente ||
        !variacao.opcaoComponente
      ) {
        alert(
          "Todas as variações precisam possuir grupo e opção."
        );
        return false;
      }

      const itensValidos = variacao.itens.filter(
        (item) =>
          item.materiaPrima &&
          Number(item.quantidade || 0) > 0
      );

      if (itensValidos.length === 0) {
        alert(
          `Adicione pelo menos um ingrediente em ${
            variacao.nomeOpcao || "uma das variações"
          }.`
        );
        return false;
      }
    }

    if (
      baseValidos.length === 0 &&
      variacoes.length === 0
    ) {
      alert(
        "Adicione ingredientes-base ou pelo menos uma variação."
      );
      return false;
    }

    return true;
  }

  async function salvarFicha() {
    if (!validarFicha()) return;

    try {
      setSalvando(true);

      const payload = {
        produto: produtoId,

        itens: ingredientesBase
          .filter(
            (item) =>
              item.materiaPrima &&
              Number(item.quantidade || 0) > 0
          )
          .map((item) => ({
            materiaPrima: item.materiaPrima,
            quantidade: Number(item.quantidade),
            unidade: item.unidade,
          })),

        variacoes: variacoes.map((variacao) => ({
          grupoComponente: variacao.grupoComponente,
          opcaoComponente: variacao.opcaoComponente,
          nomeGrupo: variacao.nomeGrupo,
          nomeOpcao: variacao.nomeOpcao,
          ativa: variacao.ativa !== false,

          itens: variacao.itens
            .filter(
              (item) =>
                item.materiaPrima &&
                Number(item.quantidade || 0) > 0
            )
            .map((item) => ({
              materiaPrima: item.materiaPrima,
              quantidade: Number(item.quantidade),
              unidade: item.unidade,
            })),
        })),

        observacao,
        ativa: true,
      };

      await api.post("/fichas-tecnicas", payload);

      alert("Ficha técnica salva com sucesso.");

      await carregarDados();
      await carregarFichaProduto(produtoId);
    } catch (error) {
      console.log("Erro ao salvar ficha:", error);

      alert(
        error.response?.data?.message ||
          "Não foi possível salvar a ficha técnica."
      );
    } finally {
      setSalvando(false);
    }
  }

  function limparEditor(limparProduto = true) {
    if (limparProduto) {
      setProdutoId("");
    }

    setIngredientesBase([criarIngredienteVazio()]);
    setVariacoes([]);
    setObservacao("");
  }

  return (
    <AdminLayout
      title="Ficha Técnica Inteligente"
      subtitle="Ingredientes, variações, custos e CMV"
    >
      <div className="ficha-page">
        <section className="ficha-hero">
          <div>
            <span>Engenharia de produtos</span>
            <h1>Ficha Técnica Inteligente</h1>
            <p>
              Cadastre ingredientes-base e receitas específicas para cada
              massa, recheio, cobertura, tamanho ou adicional.
            </p>
          </div>

          <div className="ficha-hero-actions">
            <button
              type="button"
              className="secundario"
              onClick={carregarDados}
            >
              <FaSyncAlt />
              Atualizar
            </button>

            <button
              type="button"
              onClick={salvarFicha}
              disabled={salvando}
            >
              <FaSave />
              {salvando ? "Salvando..." : "Salvar ficha"}
            </button>
          </div>
        </section>

        {loading ? (
          <div className="ficha-loading">
            Carregando estrutura da ficha técnica...
          </div>
        ) : (
          <div className="ficha-layout">
            <main className="ficha-editor">
              <section className="ficha-card">
                <div className="ficha-card-title">
                  <FaClipboardList />

                  <div>
                    <h2>Produto</h2>
                    <p>
                      Escolha o produto que receberá esta ficha.
                    </p>
                  </div>
                </div>

                <div className="ficha-field">
                  <label>Produto *</label>

                  <select
                    value={produtoId}
                    onChange={(e) =>
                      carregarFichaProduto(e.target.value)
                    }
                  >
                    <option value="">
                      Selecione um produto
                    </option>

                    {produtos.map((produto) => (
                      <option
                        key={produto._id}
                        value={produto._id}
                      >
                        {produto.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              <section className="ficha-card">
                <div className="ficha-subtitulo">
                  <div>
                    <h2>Ingredientes-base</h2>
                    <p>
                      Itens utilizados sempre, independentemente das escolhas
                      do cliente.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={adicionarIngredienteBase}
                  >
                    <FaPlus />
                    Ingrediente
                  </button>
                </div>

                <div className="ficha-lista-ingredientes">
                  {ingredientesBase.map((item, indice) => (
                    <IngredienteRow
                      key={item.idLocal || indice}
                      item={item}
                      materias={materias}
                      onChange={(novoItem) =>
                        atualizarIngredienteBase(
                          indice,
                          novoItem
                        )
                      }
                      onRemover={() =>
                        removerIngredienteBase(indice)
                      }
                    />
                  ))}
                </div>
              </section>

              <section className="ficha-card">
                <div className="ficha-subtitulo">
                  <div>
                    <h2>Variações por grupo e opção</h2>
                    <p>
                      Cadastre ingredientes usados apenas quando uma opção for
                      escolhida.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={adicionarVariacao}
                    disabled={!produtoId}
                  >
                    <FaPlus />
                    Nova variação
                  </button>
                </div>

                {produtoId &&
                  gruposDoProduto.length === 0 && (
                    <div className="ficha-alerta">
                      Este produto ainda não possui grupos vinculados no
                      Construtor Universal.
                    </div>
                  )}

                <div className="ficha-lista-variacoes">
                  {variacoes.length === 0 && (
                    <div className="ficha-vazio">
                      Nenhuma variação cadastrada.
                    </div>
                  )}

                  {variacoes.map((variacao, indice) => (
                    <VariacaoCard
                      key={variacao.idLocal || indice}
                      variacao={variacao}
                      indice={indice}
                      grupos={gruposDoProduto}
                      opcoes={opcoes}
                      materias={materias}
                      onChange={(novaVariacao) =>
                        atualizarVariacao(
                          indice,
                          novaVariacao
                        )
                      }
                      onRemover={() =>
                        removerVariacao(indice)
                      }
                    />
                  ))}
                </div>
              </section>

              <section className="ficha-card">
                <div className="ficha-field">
                  <label>Observações da ficha</label>

                  <textarea
                    value={observacao}
                    onChange={(e) =>
                      setObservacao(e.target.value)
                    }
                    placeholder="Ex.: rendimento, modo de preparo, orientações de armazenamento..."
                  />
                </div>
              </section>

              <div className="ficha-actions-final">
                <button
                  type="button"
                  className="limpar"
                  onClick={() => limparEditor()}
                >
                  Limpar editor
                </button>

                <button
                  type="button"
                  onClick={salvarFicha}
                  disabled={salvando}
                >
                  <FaSave />
                  {salvando
                    ? "Salvando..."
                    : "Salvar ficha técnica"}
                </button>
              </div>
            </main>

            <ResumoCustos
              produto={produtoSelecionado}
              ingredientesBase={ingredientesBase}
              variacoes={variacoes}
              materias={materias}
            />
          </div>
        )}

        <section className="ficha-card ficha-listagem">
          <div className="ficha-subtitulo">
            <div>
              <h2>Fichas cadastradas</h2>
              <p>
                Histórico das fichas técnicas ativas.
              </p>
            </div>

            <strong>{fichas.length}</strong>
          </div>

          <div className="ficha-tabela-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Custo-base</th>
                  <th>Variações</th>
                  <th>Custo total cadastrado</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {fichas.map((ficha) => (
                  <tr key={ficha._id}>
                    <td>
                      {ficha.produto?.nome || "Produto"}
                    </td>

                    <td>
                      R${" "}
                      {Number(
                        ficha.custoBase ||
                          ficha.custoTotal ||
                          0
                      ).toFixed(4)}
                    </td>

                    <td>
                      {ficha.variacoes?.length || 0}
                    </td>

                    <td>
                      R${" "}
                      {Number(
                        ficha.custoTotal || 0
                      ).toFixed(4)}
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          carregarFichaProduto(
                            ficha.produto?._id ||
                              ficha.produto
                          )
                        }
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))}

                {fichas.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      Nenhuma ficha cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default FichaTecnica;