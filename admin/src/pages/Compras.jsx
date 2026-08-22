import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import "../styles/compras.css";

import {
  FaTruckLoading,
  FaPlus,
  FaStore,
  FaBoxes,
  FaMoneyBillWave,
  FaClipboardList,
} from "react-icons/fa";

function Compras() {
  const [fornecedores, setFornecedores] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [compras, setCompras] = useState([]);

  const [novoFornecedor, setNovoFornecedor] = useState({
    nome: "",
    documento: "",
    telefone: "",
    email: "",
    endereco: "",
    categoria: "",
    observacao: "",
  });

  const [novaCompra, setNovaCompra] = useState({
    fornecedor: "",
    materiaPrima: "",
    quantidade: "",
    custoUnitario: "",
    formaPagamento: "PIX",
    observacao: "",
  });

  const [novoItem, setNovoItem] = useState({
  nome: "",
  tipoItem: "materia_prima",
  codigo: "",
  codigoBarras: "",
  categoria: "",
  unidade: "unidade",
  estoqueAtual: "",
  estoqueMinimo: "",
  estoqueMaximo: "",
  custoUnitario: "",
  fornecedor: "",
  marca: "",
  tamanho: "",
  capacidade: "",
  cor: "",
  localizacao: "",
  controlaLote: false,
  controlaValidade: false,
  observacoes: "",
});

  async function carregarTudo() {
    try {
      const fornecedoresRes = await api.get("/compras/fornecedores");
      const materiasRes = await api.get("/materias-primas");
      const comprasRes = await api.get("/compras");

      setFornecedores(fornecedoresRes.data.fornecedores || []);
      setMaterias(materiasRes.data.materias || []);
      setCompras(comprasRes.data.compras || []);
    } catch (error) {
      console.log("Erro ao carregar compras:", error);
      alert("Erro ao carregar dados de compras.");
    }
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  async function cadastrarFornecedor() {
    if (!novoFornecedor.nome) {
      alert("Informe o nome do fornecedor.");
      return;
    }

    await api.post("/compras/fornecedores", novoFornecedor);

    setNovoFornecedor({
      nome: "",
      documento: "",
      telefone: "",
      email: "",
      endereco: "",
      categoria: "",
      observacao: "",
    });

    carregarTudo();
  }

  async function cadastrarItemEstoque() {
  if (!novoItem.nome.trim()) {
    alert("Informe o nome do item.");
    return;
  }

  try {
    await api.post("/materias-primas", {
      ...novoItem,
      estoqueAtual: Number(novoItem.estoqueAtual || 0),
      estoqueMinimo: Number(novoItem.estoqueMinimo || 0),
      estoqueMaximo: Number(novoItem.estoqueMaximo || 0),
      custoUnitario: Number(novoItem.custoUnitario || 0),
    });

    setNovoItem({
      nome: "",
      tipoItem: "materia_prima",
      codigo: "",
      codigoBarras: "",
      categoria: "",
      unidade: "unidade",
      estoqueAtual: "",
      estoqueMinimo: "",
      estoqueMaximo: "",
      custoUnitario: "",
      fornecedor: "",
      marca: "",
      tamanho: "",
      capacidade: "",
      cor: "",
      localizacao: "",
      controlaLote: false,
      controlaValidade: false,
      observacoes: "",
    });

    alert("Item de estoque cadastrado com sucesso.");
    carregarTudo();
  } catch (error) {
    alert(
      error.response?.data?.message ||
        "Erro ao cadastrar item de estoque."
    );
  }
}

  async function registrarCompra() {
    if (
      !novaCompra.materiaPrima ||
      !novaCompra.quantidade ||
      !novaCompra.custoUnitario
    ) {
      alert("Informe o insumo ou embalagem, quantidade e custo unitário.");
      return;
    }

    await api.post("/compras", {
      fornecedor: novaCompra.fornecedor || null,
      formaPagamento: novaCompra.formaPagamento,
      observacao: novaCompra.observacao,
      itens: [
        {
          materiaPrima: novaCompra.materiaPrima,
          quantidade: Number(novaCompra.quantidade),
          custoUnitario: Number(novaCompra.custoUnitario),
        },
      ],
    });

    setNovaCompra({
      fornecedor: "",
      materiaPrima: "",
      quantidade: "",
      custoUnitario: "",
      formaPagamento: "PIX",
      observacao: "",
    });

    carregarTudo();
  }

  function dinheiro(valor) {
    return `R$ ${Number(valor || 0).toFixed(2)}`;
  }

  function dataBR(data) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  const totalCompras = compras.reduce(
    (acc, compra) => acc + Number(compra.valorTotal || 0),
    0
  );

  return (
    <AdminLayout
      title="Compras"
      subtitle="Fornecedores, compras de insumos e entrada automática no estoque"
    >
      <div className="financeiro-premium-page compras-page">
        <section className="financeiro-topbar">
          <div>
            <h1>Compras</h1>
            <p>
              Controle fornecedores, compras de insumos, embalagens e entrada de estoque.
            </p>
          </div>
        </section>

        <section className="financeiro-kpis">
          <div className="financeiro-kpi green">
            <FaStore />
            <span>Fornecedores</span>
            <strong>{fornecedores.length}</strong>
            <p>Ativos cadastrados</p>
          </div>

          <div className="financeiro-kpi blue">
            <FaBoxes />
            <span>Insumos e Embalagens</span>
            <strong>{materias.length}</strong>
            <p>Itens em estoque</p>
          </div>

          <div className="financeiro-kpi yellow">
            <FaClipboardList />
            <span>Compras</span>
            <strong>{compras.length}</strong>
            <p>Compras registradas</p>
          </div>

          <div className="financeiro-kpi purple">
            <FaMoneyBillWave />
            <span>Total Comprado</span>
            <strong>{dinheiro(totalCompras)}</strong>
            <p>Valor acumulado</p>
          </div>
        </section>

        <section className="compras-form-grid">
          <div className="financeiro-card compras-card compras-item-card">
  <h2>
    <FaBoxes /> Novo Item de Estoque
  </h2>

  <select
    value={novoItem.tipoItem}
    onChange={(e) =>
      setNovoItem({
        ...novoItem,
        tipoItem: e.target.value,
      })
    }
  >
    <option value="materia_prima">Matéria-prima</option>
    <option value="embalagem">Embalagem</option>
    <option value="material_consumo">
      Material de consumo
    </option>
  </select>

  <input
    placeholder="Nome do item"
    value={novoItem.nome}
    onChange={(e) =>
      setNovoItem({
        ...novoItem,
        nome: e.target.value,
      })
    }
  />

  <input
    placeholder="Código interno"
    value={novoItem.codigo}
    onChange={(e) =>
      setNovoItem({
        ...novoItem,
        codigo: e.target.value,
      })
    }
  />

  <input
    placeholder="Código de barras"
    value={novoItem.codigoBarras}
    onChange={(e) =>
      setNovoItem({
        ...novoItem,
        codigoBarras: e.target.value,
      })
    }
  />

  <input
    placeholder="Categoria"
    value={novoItem.categoria}
    onChange={(e) =>
      setNovoItem({
        ...novoItem,
        categoria: e.target.value,
      })
    }
  />

  <select
    value={novoItem.unidade}
    onChange={(e) =>
      setNovoItem({
        ...novoItem,
        unidade: e.target.value,
      })
    }
  >
    <option value="unidade">Unidade</option>
    <option value="g">Grama</option>
    <option value="kg">Quilograma</option>
    <option value="ml">Mililitro</option>
    <option value="litro">Litro</option>
    <option value="pacote">Pacote</option>
    <option value="caixa">Caixa</option>
  </select>

  <input
    type="number"
    placeholder="Estoque inicial"
    value={novoItem.estoqueAtual}
    onChange={(e) =>
      setNovoItem({
        ...novoItem,
        estoqueAtual: e.target.value,
      })
    }
  />

  <input
    type="number"
    placeholder="Estoque mínimo"
    value={novoItem.estoqueMinimo}
    onChange={(e) =>
      setNovoItem({
        ...novoItem,
        estoqueMinimo: e.target.value,
      })
    }
  />

  <input
    type="number"
    placeholder="Estoque máximo"
    value={novoItem.estoqueMaximo}
    onChange={(e) =>
      setNovoItem({
        ...novoItem,
        estoqueMaximo: e.target.value,
      })
    }
  />

  <input
    type="number"
    step="0.01"
    placeholder="Custo unitário"
    value={novoItem.custoUnitario}
    onChange={(e) =>
      setNovoItem({
        ...novoItem,
        custoUnitario: e.target.value,
      })
    }
  />

  <input
    placeholder="Fornecedor / marca"
    value={novoItem.fornecedor}
    onChange={(e) =>
      setNovoItem({
        ...novoItem,
        fornecedor: e.target.value,
      })
    }
  />

  <input
    placeholder="Marca"
    value={novoItem.marca}
    onChange={(e) =>
      setNovoItem({
        ...novoItem,
        marca: e.target.value,
      })
    }
  />

  {novoItem.tipoItem === "embalagem" && (
    <>
      <input
        placeholder="Tamanho"
        value={novoItem.tamanho}
        onChange={(e) =>
          setNovoItem({
            ...novoItem,
            tamanho: e.target.value,
          })
        }
      />

      <input
        placeholder="Capacidade (ex.: 170 ml)"
        value={novoItem.capacidade}
        onChange={(e) =>
          setNovoItem({
            ...novoItem,
            capacidade: e.target.value,
          })
        }
      />

      <input
        placeholder="Cor"
        value={novoItem.cor}
        onChange={(e) =>
          setNovoItem({
            ...novoItem,
            cor: e.target.value,
          })
        }
      />
    </>
  )}

  <input
    placeholder="Localização no estoque"
    value={novoItem.localizacao}
    onChange={(e) =>
      setNovoItem({
        ...novoItem,
        localizacao: e.target.value,
      })
    }
  />

  <label>
    <input
      type="checkbox"
      checked={novoItem.controlaLote}
      onChange={(e) =>
        setNovoItem({
          ...novoItem,
          controlaLote: e.target.checked,
        })
      }
    />
    Controlar lote
  </label>

  <label>
    <input
      type="checkbox"
      checked={novoItem.controlaValidade}
      onChange={(e) =>
        setNovoItem({
          ...novoItem,
          controlaValidade: e.target.checked,
        })
      }
    />
    Controlar validade
  </label>

  <textarea
    placeholder="Observações"
    value={novoItem.observacoes}
    onChange={(e) =>
      setNovoItem({
        ...novoItem,
        observacoes: e.target.value,
      })
    }
  />

  <button onClick={cadastrarItemEstoque}>
    Cadastrar Item
  </button>
</div>
          <div className="financeiro-card compras-card compras-fornecedor-card">
            <h2>
              <FaPlus /> Novo Fornecedor
            </h2>

            <input
              placeholder="Nome do fornecedor"
              value={novoFornecedor.nome}
              onChange={(e) =>
                setNovoFornecedor({
                  ...novoFornecedor,
                  nome: e.target.value,
                })
              }
            />

            <input
              placeholder="CNPJ / CPF"
              value={novoFornecedor.documento}
              onChange={(e) =>
                setNovoFornecedor({
                  ...novoFornecedor,
                  documento: e.target.value,
                })
              }
            />

            <input
              placeholder="Telefone / WhatsApp"
              value={novoFornecedor.telefone}
              onChange={(e) =>
                setNovoFornecedor({
                  ...novoFornecedor,
                  telefone: e.target.value,
                })
              }
            />

            <input
              placeholder="E-mail"
              value={novoFornecedor.email}
              onChange={(e) =>
                setNovoFornecedor({
                  ...novoFornecedor,
                  email: e.target.value,
                })
              }
            />

            <input
              placeholder="Endereço"
              value={novoFornecedor.endereco}
              onChange={(e) =>
                setNovoFornecedor({
                  ...novoFornecedor,
                  endereco: e.target.value,
                })
              }
            />

            <input
              placeholder="Categoria"
              value={novoFornecedor.categoria}
              onChange={(e) =>
                setNovoFornecedor({
                  ...novoFornecedor,
                  categoria: e.target.value,
                })
              }
            />

            <textarea
              placeholder="Observação"
              value={novoFornecedor.observacao}
              onChange={(e) =>
                setNovoFornecedor({
                  ...novoFornecedor,
                  observacao: e.target.value,
                })
              }
            />

            <button onClick={cadastrarFornecedor}>
              Cadastrar Fornecedor
            </button>
          </div>

          <div className="financeiro-card compras-card compras-compra-card">
            <h2>
              <FaTruckLoading /> Nova Compra
            </h2>

            <select
              value={novaCompra.fornecedor}
              onChange={(e) =>
                setNovaCompra({
                  ...novaCompra,
                  fornecedor: e.target.value,
                })
              }
            >
              <option value="">Fornecedor opcional</option>
              {fornecedores.map((fornecedor) => (
                <option key={fornecedor._id} value={fornecedor._id}>
                  {fornecedor.nome}
                </option>
              ))}
            </select>

            <select
              value={novaCompra.materiaPrima}
              onChange={(e) => {
                const materia = materias.find(
                  (m) => m._id === e.target.value
                );

                setNovaCompra({
                  ...novaCompra,
                  materiaPrima: e.target.value,
                  custoUnitario: materia?.custoUnitario || "",
                });
              }}
            >
              <option value="">Selecione o insumo ou embalagem</option>
              {materias.map((materia) => (
                <option key={materia._id} value={materia._id}>
                  {materia.nome} - Estoque: {materia.estoqueAtual}{" "}
                  {materia.unidade}
                </option>
              ))}
            </select>


            <input
              type="number"
              placeholder="Quantidade comprada"
              value={novaCompra.quantidade}
              onChange={(e) =>
                setNovaCompra({
                  ...novaCompra,
                  quantidade: e.target.value,
                })
              }
            />

            <input
              type="number"
              step="0.01"
              placeholder="Custo unitário"
              value={novaCompra.custoUnitario}
              onChange={(e) =>
                setNovaCompra({
                  ...novaCompra,
                  custoUnitario: e.target.value,
                })
              }
            />

            <select
              value={novaCompra.formaPagamento}
              onChange={(e) =>
                setNovaCompra({
                  ...novaCompra,
                  formaPagamento: e.target.value,
                })
              }
            >
              <option value="PIX">PIX</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="CREDITO">Cartão Crédito</option>
              <option value="DEBITO">Cartão Débito</option>
              <option value="BOLETO">Boleto</option>
            </select>

            <textarea
              placeholder="Observação da compra"
              value={novaCompra.observacao}
              onChange={(e) =>
                setNovaCompra({
                  ...novaCompra,
                  observacao: e.target.value,
                })
              }
            />

            <button onClick={registrarCompra}>Registrar Compra</button>
          </div>

          </section>

<section className="compras-listas-grid">

          <div className="financeiro-card movimentacoes grande compras-lista-card">
            <h2>Fornecedores</h2>

            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Categoria</th>
                  <th>E-mail</th>
                </tr>
              </thead>

              <tbody>
                {fornecedores.map((fornecedor) => (
                  <tr key={fornecedor._id}>
                    <td>{fornecedor.nome}</td>
                    <td>{fornecedor.telefone || "-"}</td>
                    <td>{fornecedor.categoria || "-"}</td>
                    <td>{fornecedor.email || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="financeiro-card movimentacoes grande compras-lista-card">
            <h2>Compras Registradas</h2>

            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Fornecedor</th>
                  <th>Valor</th>
                  <th>Pagamento</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {compras.map((compra) => (
                  <tr key={compra._id}>
                    <td>{dataBR(compra.dataCompra || compra.createdAt)}</td>
                    <td>
                      {compra.fornecedor?.nome ||
                        compra.fornecedorNome ||
                        "-"}
                    </td>
                    <td className="valor-negativo">
                      {dinheiro(compra.valorTotal)}
                    </td>
                    <td>{compra.formaPagamento}</td>
                    <td>{compra.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="financeiro-card movimentacoes grande compras-lista-card compras-estoque-card">
  <h2>Insumos e Embalagens</h2>

  <table>
    <thead>
      <tr>
        <th>Nome</th>
        <th>Tipo</th>
        <th>Estoque</th>
        <th>Mínimo</th>
        <th>Custo</th>
        <th>Unidade</th>
      </tr>
    </thead>

    <tbody>
      {materias.map((materia) => (
        <tr key={materia._id}>
          <td>{materia.nome}</td>

          <td>
            {materia.tipoItem === "embalagem"
              ? "Embalagem"
              : materia.tipoItem === "material_consumo"
              ? "Material de consumo"
              : "Matéria-prima"}
          </td>

          <td>{materia.estoqueAtual}</td>
          <td>{materia.estoqueMinimo}</td>
          <td>{dinheiro(materia.custoUnitario)}</td>
          <td>{materia.unidade}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default Compras;