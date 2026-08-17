import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";

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

  async function registrarCompra() {
    if (
      !novaCompra.materiaPrima ||
      !novaCompra.quantidade ||
      !novaCompra.custoUnitario
    ) {
      alert("Informe matéria-prima, quantidade e custo unitário.");
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
      <div className="financeiro-premium-page">
        <section className="financeiro-topbar">
          <div>
            <h1>Compras</h1>
            <p>
              Controle fornecedores, compras de matéria-prima e entrada de estoque.
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
            <span>Matérias-primas</span>
            <strong>{materias.length}</strong>
            <p>Insumos disponíveis</p>
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

        <section className="financeiro-grid">
          <div className="financeiro-card">
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

          <div className="financeiro-card">
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
              <option value="">Selecione a matéria-prima</option>
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

          <div className="financeiro-card movimentacoes grande">
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

          <div className="financeiro-card movimentacoes grande">
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

          <div className="financeiro-card movimentacoes grande">
            <h2>Matérias-primas</h2>

            <table>
              <thead>
                <tr>
                  <th>Nome</th>
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