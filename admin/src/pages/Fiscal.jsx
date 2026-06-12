import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";

import {
  FaFileInvoice,
  FaPlus,
  FaBoxes,
  FaMoneyBillWave,
  FaClipboardCheck,
  FaTimesCircle,
} from "react-icons/fa";

import "../styles/fiscal.css";

function Fiscal() {
  const [fornecedores, setFornecedores] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [notas, setNotas] = useState([]);
  const [resumo, setResumo] = useState(null);

  const [nota, setNota] = useState({
    numero: "",
    serie: "",
    chaveAcesso: "",
    fornecedor: "",
    fornecedorNome: "",
    fornecedorDocumento: "",
    dataEmissao: "",
    valorFrete: "",
    valorDesconto: "",
    formaPagamento: "PIX",
    observacao: "",
  });

  const [item, setItem] = useState({
    materiaPrima: "",
    nome: "",
    codigo: "",
    unidade: "unidade",
    quantidade: "",
    valorUnitario: "",
  });

  const [itens, setItens] = useState([]);

  async function carregarDados() {
    try {
      const fornecedoresRes = await api.get("/compras/fornecedores");
      const materiasRes = await api.get("/producao/materias-primas");
      const notasRes = await api.get("/fiscal/notas-entrada");
      const resumoRes = await api.get("/fiscal/resumo");

      setFornecedores(fornecedoresRes.data.fornecedores || []);
      setMaterias(materiasRes.data.materias || []);
      setNotas(notasRes.data.notas || []);
      setResumo(resumoRes.data.resumo || null);
    } catch (error) {
      console.log("Erro fiscal:", error);
      alert(error.response?.data?.message || "Erro ao carregar módulo fiscal.");
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function dinheiro(valor) {
    return `R$ ${Number(valor || 0).toFixed(2)}`;
  }

  function dataBR(data) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function adicionarItem() {
    if (!item.nome && !item.materiaPrima) {
      alert("Informe o item da nota.");
      return;
    }

    if (!item.quantidade || !item.valorUnitario) {
      alert("Informe quantidade e valor unitário.");
      return;
    }

    const materia = materias.find((m) => m._id === item.materiaPrima);

    const novoItem = {
      materiaPrima: item.materiaPrima || null,
      nome: item.nome || materia?.nome || "Item da nota",
      codigo: item.codigo || "",
      unidade: item.unidade || materia?.unidade || "unidade",
      quantidade: Number(item.quantidade),
      valorUnitario: Number(item.valorUnitario),
    };

    setItens([...itens, novoItem]);

    setItem({
      materiaPrima: "",
      nome: "",
      codigo: "",
      unidade: "unidade",
      quantidade: "",
      valorUnitario: "",
    });
  }

  function removerItem(index) {
    setItens(itens.filter((_, i) => i !== index));
  }

  async function salvarNota() {
    if (!nota.numero) {
      alert("Informe o número da nota.");
      return;
    }

    if (itens.length === 0) {
      alert("Adicione pelo menos um item.");
      return;
    }

    await api.post("/fiscal/notas-entrada", {
      ...nota,
      itens,
    });

    setNota({
      numero: "",
      serie: "",
      chaveAcesso: "",
      fornecedor: "",
      fornecedorNome: "",
      fornecedorDocumento: "",
      dataEmissao: "",
      valorFrete: "",
      valorDesconto: "",
      formaPagamento: "PIX",
      observacao: "",
    });

    setItens([]);

    carregarDados();
  }

  async function cancelarNota(id) {
    if (!window.confirm("Deseja cancelar esta nota no sistema?")) return;

    await api.patch(`/fiscal/notas-entrada/${id}/cancelar`);
    carregarDados();
  }

  const valorItens = itens.reduce(
    (acc, item) =>
      acc + Number(item.quantidade || 0) * Number(item.valorUnitario || 0),
    0
  );

  const totalNota =
    valorItens + Number(nota.valorFrete || 0) - Number(nota.valorDesconto || 0);

  return (
    <AdminLayout
      title="Fiscal"
      subtitle="Entrada de notas fiscais, XML, estoque e financeiro"
    >
      <div className="fiscal-page">
        <section className="fiscal-hero">
          <div>
            <span>Módulo Fiscal</span>
            <h1>Entrada de Nota Fiscal</h1>
            <p>
              Registre notas recebidas, controle itens, alimente estoque e gere
              financeiro automaticamente.
            </p>
          </div>
        </section>

        <section className="fiscal-kpis">
          <div className="fiscal-kpi">
            <FaFileInvoice />
            <span>Notas</span>
            <strong>{resumo?.totalNotas || 0}</strong>
            <p>Notas registradas</p>
          </div>

          <div className="fiscal-kpi">
            <FaMoneyBillWave />
            <span>Total de Entrada</span>
            <strong>{dinheiro(resumo?.valorTotalEntrada)}</strong>
            <p>Valor fiscal lançado</p>
          </div>

          <div className="fiscal-kpi">
            <FaClipboardCheck />
            <span>XML</span>
            <strong>{resumo?.notasXml || 0}</strong>
            <p>Notas importadas</p>
          </div>

          <div className="fiscal-kpi">
            <FaTimesCircle />
            <span>Canceladas</span>
            <strong>{resumo?.notasCanceladas || 0}</strong>
            <p>Notas canceladas</p>
          </div>
        </section>

        <section className="fiscal-grid">
          <div className="fiscal-card">
            <h2>
              <FaPlus /> Dados da Nota
            </h2>

            <div className="fiscal-form-grid">
              <input
                placeholder="Número da nota"
                value={nota.numero}
                onChange={(e) => setNota({ ...nota, numero: e.target.value })}
              />

              <input
                placeholder="Série"
                value={nota.serie}
                onChange={(e) => setNota({ ...nota, serie: e.target.value })}
              />

              <input
                placeholder="Chave de acesso"
                value={nota.chaveAcesso}
                onChange={(e) =>
                  setNota({ ...nota, chaveAcesso: e.target.value })
                }
              />

              <select
                value={nota.fornecedor}
                onChange={(e) => {
                  const fornecedor = fornecedores.find(
                    (f) => f._id === e.target.value
                  );

                  setNota({
                    ...nota,
                    fornecedor: e.target.value,
                    fornecedorNome: fornecedor?.nome || "",
                    fornecedorDocumento: fornecedor?.documento || "",
                  });
                }}
              >
                <option value="">Fornecedor cadastrado</option>
                {fornecedores.map((fornecedor) => (
                  <option key={fornecedor._id} value={fornecedor._id}>
                    {fornecedor.nome}
                  </option>
                ))}
              </select>

              <input
                placeholder="Fornecedor avulso"
                value={nota.fornecedorNome}
                onChange={(e) =>
                  setNota({ ...nota, fornecedorNome: e.target.value })
                }
              />

              <input
                placeholder="Documento fornecedor"
                value={nota.fornecedorDocumento}
                onChange={(e) =>
                  setNota({ ...nota, fornecedorDocumento: e.target.value })
                }
              />

              <input
                type="date"
                value={nota.dataEmissao}
                onChange={(e) =>
                  setNota({ ...nota, dataEmissao: e.target.value })
                }
              />

              <select
                value={nota.formaPagamento}
                onChange={(e) =>
                  setNota({ ...nota, formaPagamento: e.target.value })
                }
              >
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CREDITO">Cartão Crédito</option>
                <option value="DEBITO">Cartão Débito</option>
                <option value="BOLETO">Boleto</option>
              </select>

              <input
                type="number"
                placeholder="Frete"
                value={nota.valorFrete}
                onChange={(e) =>
                  setNota({ ...nota, valorFrete: e.target.value })
                }
              />

              <input
                type="number"
                placeholder="Desconto"
                value={nota.valorDesconto}
                onChange={(e) =>
                  setNota({ ...nota, valorDesconto: e.target.value })
                }
              />
            </div>

            <textarea
              placeholder="Observação"
              value={nota.observacao}
              onChange={(e) =>
                setNota({ ...nota, observacao: e.target.value })
              }
            />
          </div>

          <div className="fiscal-card">
            <h2>
              <FaBoxes /> Itens da Nota
            </h2>

            <div className="fiscal-form-grid">
              <select
                value={item.materiaPrima}
                onChange={(e) => {
                  const materia = materias.find((m) => m._id === e.target.value);

                  setItem({
                    ...item,
                    materiaPrima: e.target.value,
                    nome: materia?.nome || "",
                    unidade: materia?.unidade || "unidade",
                    valorUnitario: materia?.custoUnitario || "",
                  });
                }}
              >
                <option value="">Vincular matéria-prima</option>
                {materias.map((materia) => (
                  <option key={materia._id} value={materia._id}>
                    {materia.nome} - estoque {materia.estoqueAtual}{" "}
                    {materia.unidade}
                  </option>
                ))}
              </select>

              <input
                placeholder="Nome do item"
                value={item.nome}
                onChange={(e) => setItem({ ...item, nome: e.target.value })}
              />

              <input
                placeholder="Código"
                value={item.codigo}
                onChange={(e) => setItem({ ...item, codigo: e.target.value })}
              />

              <input
                placeholder="Unidade"
                value={item.unidade}
                onChange={(e) => setItem({ ...item, unidade: e.target.value })}
              />

              <input
                type="number"
                placeholder="Quantidade"
                value={item.quantidade}
                onChange={(e) =>
                  setItem({ ...item, quantidade: e.target.value })
                }
              />

              <input
                type="number"
                placeholder="Valor unitário"
                value={item.valorUnitario}
                onChange={(e) =>
                  setItem({ ...item, valorUnitario: e.target.value })
                }
              />
            </div>

            <button className="btn-fiscal" onClick={adicionarItem}>
              Adicionar Item
            </button>

            <div className="fiscal-itens-lista">
              {itens.map((item, index) => (
                <div className="fiscal-item" key={index}>
                  <div>
                    <strong>{item.nome}</strong>
                    <span>
                      {item.quantidade} {item.unidade} x{" "}
                      {dinheiro(item.valorUnitario)}
                    </span>
                  </div>

                  <strong>
                    {dinheiro(
                      Number(item.quantidade) * Number(item.valorUnitario)
                    )}
                  </strong>

                  <button onClick={() => removerItem(index)}>Remover</button>
                </div>
              ))}
            </div>

            <div className="fiscal-total">
              <span>Subtotal itens</span>
              <strong>{dinheiro(valorItens)}</strong>
            </div>

            <div className="fiscal-total destaque">
              <span>Total da nota</span>
              <strong>{dinheiro(totalNota)}</strong>
            </div>

            <button className="btn-fiscal salvar" onClick={salvarNota}>
              Salvar Nota e Dar Entrada
            </button>
          </div>

          <div className="fiscal-card grande">
            <h2>Notas de Entrada Registradas</h2>

            <div className="fiscal-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Número</th>
                    <th>Fornecedor</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {notas.map((nota) => (
                    <tr key={nota._id}>
                      <td>{dataBR(nota.dataEntrada || nota.createdAt)}</td>
                      <td>{nota.numero}</td>
                      <td>{nota.fornecedor?.nome || nota.fornecedorNome}</td>
                      <td>{dinheiro(nota.valorTotal)}</td>
                      <td>{nota.status}</td>
                      <td>
                        {nota.status !== "cancelada" && (
                          <button
                            className="btn-cancelar"
                            onClick={() => cancelarNota(nota._id)}
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {notas.length === 0 && (
                    <tr>
                      <td colSpan="6">Nenhuma nota lançada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default Fiscal;