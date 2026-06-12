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
  FaEye,
  FaUpload,
  FaTimes,
} from "react-icons/fa";

import "../styles/fiscal.css";

function Fiscal() {
  const [fornecedores, setFornecedores] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [notas, setNotas] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [notaSelecionada, setNotaSelecionada] = useState(null);
  const [xmlNome, setXmlNome] = useState("");

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

  async function selecionarXML(e) {
  try {
    const arquivo = e.target.files?.[0];

    if (!arquivo) return;

    setXmlNome(arquivo.name);

    const formData = new FormData();
    formData.append("xml", arquivo);

    const response = await api.post(
      "/fiscal/notas-entrada/importar-xml",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const notaXml = response.data.nota;

    setNota({
      numero: notaXml.numero || "",
      serie: notaXml.serie || "",
      chaveAcesso: notaXml.chaveAcesso || "",
      fornecedor: "",
      fornecedorNome: notaXml.fornecedorNome || "",
      fornecedorDocumento: notaXml.fornecedorDocumento || "",
      dataEmissao: notaXml.dataEmissao || "",
      valorFrete: notaXml.valorFrete || "",
      valorDesconto: notaXml.valorDesconto || "",
      formaPagamento: notaXml.formaPagamento || "BOLETO",
      observacao: notaXml.observacao || "Importado por XML.",
    });

    setItens(
      (notaXml.itens || []).map((item) => ({
        materiaPrima: null,
        nome: item.nome,
        codigo: item.codigo,
        unidade: item.unidade,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
      }))
    );

    alert("XML lido com sucesso. Confira os dados antes de salvar.");
  } catch (error) {
    console.log("Erro ao importar XML:", error);
    alert(error.response?.data?.message || "Erro ao importar XML.");
  }
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
  try {
    if (!nota.numero) {
      alert("Informe o número da nota.");
      return;
    }

    if (itens.length === 0) {
      alert("Adicione pelo menos um item.");
      return;
    }

    const payload = {
      ...nota,
      fornecedor: nota.fornecedor || null,
      valorFrete: Number(nota.valorFrete || 0),
      valorDesconto: Number(nota.valorDesconto || 0),
      itens: itens.map((item) => ({
        materiaPrima: item.materiaPrima || null,
        nome: item.nome,
        codigo: item.codigo || "",
        unidade: item.unidade || "unidade",
        quantidade: Number(item.quantidade || 0),
        valorUnitario: Number(item.valorUnitario || 0),
      })),
    };

    const response = await api.post("/fiscal/notas-entrada", payload);

    if (!response.data.success) {
      alert(response.data.message || "Não foi possível salvar a nota.");
      return;
    }

    alert("Nota fiscal salva com sucesso e entrada registrada.");

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
    setXmlNome("");

    await carregarDados();
  } catch (error) {
    console.log("Erro ao salvar nota fiscal:", error);

    const mensagem =
      error.response?.data?.message ||
      error.message ||
      "Erro ao salvar nota fiscal.";

    alert(mensagem);
  }
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

  async function excluirNota(id) {
  if (
    !window.confirm(
      "Tem certeza que deseja excluir esta nota? Use isso apenas para duplicidades ou testes."
    )
  ) {
    return;
  }

  try {
    const response = await api.delete(`/fiscal/notas-entrada/${id}`);

    alert(response.data.message || "Nota excluída com sucesso.");

    await carregarDados();
  } catch (error) {
    console.log("Erro ao excluir nota:", error);

    alert(
      error.response?.data?.message ||
        "Erro ao excluir nota fiscal."
    );
  }
}

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

        <section className="xml-upload-card">
          <div>
            <FaUpload />
            <strong>Importar XML da Nota</strong>
            <span>
  Selecione o XML da NF-e para preencher automaticamente fornecedor, número,
  chave, data, valores e itens da nota.
</span>
          </div>

          <label className="xml-upload-btn">
            Selecionar XML
            <input type="file" accept=".xml" onChange={selecionarXML} />
          </label>

          {xmlNome && <p className="xml-nome">Arquivo: {xmlNome}</p>}
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
                    {materia.nome} | Estoque: {materia.estoqueAtual}{" "}
                    {materia.unidade} | Custo: {dinheiro(materia.custoUnitario)}
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

            <div className="resumo-nota-card">
              <h3>Resumo da Nota</h3>

              <div>
                <span>Subtotal dos itens</span>
                <strong>{dinheiro(valorItens)}</strong>
              </div>

              <div>
                <span>Frete</span>
                <strong>{dinheiro(nota.valorFrete)}</strong>
              </div>

              <div>
                <span>Desconto</span>
                <strong>{dinheiro(nota.valorDesconto)}</strong>
              </div>

              <div className="total">
                <span>Total da nota</span>
                <strong>{dinheiro(totalNota)}</strong>
              </div>
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
                    <th>Itens</th>
                    <th>Valor</th>
                    <th>Pagamento</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {notas.map((nota) => (
                    <tr key={nota._id}>
                      <td>{dataBR(nota.dataEntrada || nota.createdAt)}</td>
                      <td>{nota.numero}</td>
                      <td>{nota.fornecedor?.nome || nota.fornecedorNome}</td>
                      <td>{nota.itens?.length || 0}</td>
                      <td>{dinheiro(nota.valorTotal)}</td>
                      <td>{nota.formaPagamento}</td>
                      <td>{nota.status}</td>
                      <td className="acoes-nota">
                        <button
                          className="btn-ver"
                          onClick={() => setNotaSelecionada(nota)}
                        >
                          <FaEye /> Ver
                        </button>

                        <button
  className="btn-excluir"
  onClick={() => excluirNota(nota._id)}
>
  Excluir
</button>

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
                      <td colSpan="8">Nenhuma nota lançada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {notaSelecionada && (
          <div className="modal-fiscal-overlay">
            <div className="modal-fiscal">
              <button
                className="modal-fechar"
                onClick={() => setNotaSelecionada(null)}
              >
                <FaTimes />
              </button>

              <h2>Nota Fiscal de Entrada</h2>

              <div className="modal-info-grid">
                <div>
                  <span>Número</span>
                  <strong>{notaSelecionada.numero}</strong>
                </div>

                <div>
                  <span>Série</span>
                  <strong>{notaSelecionada.serie || "-"}</strong>
                </div>

                <div>
                  <span>Fornecedor</span>
                  <strong>
                    {notaSelecionada.fornecedor?.nome ||
                      notaSelecionada.fornecedorNome ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>Valor total</span>
                  <strong>{dinheiro(notaSelecionada.valorTotal)}</strong>
                </div>

                <div>
                  <span>Pagamento</span>
                  <strong>{notaSelecionada.formaPagamento}</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>{notaSelecionada.status}</strong>
                </div>
              </div>

              <h3>Itens da Nota</h3>

              <div className="modal-itens">
                {(notaSelecionada.itens || []).map((item) => (
                  <div key={item._id} className="modal-item">
                    <div>
                      <strong>{item.nome}</strong>
                      <span>
                        {item.quantidade} {item.unidade} x{" "}
                        {dinheiro(item.valorUnitario)}
                      </span>
                    </div>

                    <strong>{dinheiro(item.valorTotal)}</strong>
                  </div>
                ))}
              </div>

              {notaSelecionada.chaveAcesso && (
                <div className="modal-chave">
                  <span>Chave de acesso</span>
                  <p>{notaSelecionada.chaveAcesso}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Fiscal;