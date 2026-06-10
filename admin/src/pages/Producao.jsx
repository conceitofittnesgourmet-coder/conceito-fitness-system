import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";

import {
  FaBoxes,
  FaPlus,
  FaClipboardList,
  FaIndustry,
  FaExclamationTriangle,
} from "react-icons/fa";

function Producao() {
  const [materias, setMaterias] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [fichas, setFichas] = useState([]);

  const [novaMateria, setNovaMateria] = useState({
    nome: "",
    categoria: "",
    unidade: "g",
    estoqueAtual: "",
    estoqueMinimo: "",
    custoUnitario: "",
    fornecedor: "",
  });

  const [novaFicha, setNovaFicha] = useState({
    produto: "",
    materiaPrima: "",
    quantidade: "",
    unidade: "g",
  });

  const [novaProducao, setNovaProducao] = useState({
    produtoId: "",
    quantidadeProduzida: "",
  });

  async function carregarTudo() {
    const materiasRes = await api.get("/producao/materias-primas");
    const produtosRes = await api.get("/produtos");
    const fichasRes = await api.get("/producao/fichas-tecnicas");

    setMaterias(materiasRes.data.materias || []);
    setAlertas(materiasRes.data.alertas || []);
    setProdutos(produtosRes.data.produtos || []);
    setFichas(fichasRes.data.fichas || []);
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  async function cadastrarMateria() {
    if (!novaMateria.nome) {
      alert("Informe o nome da matéria-prima.");
      return;
    }

    await api.post("/producao/materias-primas", novaMateria);

    setNovaMateria({
      nome: "",
      categoria: "",
      unidade: "g",
      estoqueAtual: "",
      estoqueMinimo: "",
      custoUnitario: "",
      fornecedor: "",
    });

    carregarTudo();
  }

  async function criarFicha() {
    if (!novaFicha.produto || !novaFicha.materiaPrima || !novaFicha.quantidade) {
      alert("Informe produto, matéria-prima e quantidade.");
      return;
    }

    await api.post("/producao/fichas-tecnicas", {
      produto: novaFicha.produto,
      itens: [
        {
          materiaPrima: novaFicha.materiaPrima,
          quantidade: Number(novaFicha.quantidade),
          unidade: novaFicha.unidade,
        },
      ],
    });

    setNovaFicha({
      produto: "",
      materiaPrima: "",
      quantidade: "",
      unidade: "g",
    });

    carregarTudo();
  }

  async function registrarProducao() {
    if (!novaProducao.produtoId || !novaProducao.quantidadeProduzida) {
      alert("Informe produto e quantidade produzida.");
      return;
    }

    await api.post("/producao/produzir", {
      produtoId: novaProducao.produtoId,
      quantidadeProduzida: Number(novaProducao.quantidadeProduzida),
    });

    setNovaProducao({
      produtoId: "",
      quantidadeProduzida: "",
    });

    carregarTudo();
  }

  function dinheiro(valor) {
    return `R$ ${Number(valor || 0).toFixed(2)}`;
  }

  return (
    <AdminLayout title="Produção" subtitle="Matéria-prima, ficha técnica e produção">
      <div className="financeiro-premium-page">
        <section className="financeiro-topbar">
          <div>
            <h1>Produção</h1>
            <p>Controle insumos, fichas técnicas e produção da Conceito Fitness Gourmet.</p>
          </div>
        </section>

        <section className="financeiro-kpis">
          <div className="financeiro-kpi green">
            <FaBoxes />
            <span>Matérias-primas</span>
            <strong>{materias.length}</strong>
            <p>Insumos cadastrados</p>
          </div>

          <div className="financeiro-kpi yellow">
            <FaExclamationTriangle />
            <span>Alertas</span>
            <strong>{alertas.length}</strong>
            <p>Estoque baixo</p>
          </div>

          <div className="financeiro-kpi blue">
            <FaClipboardList />
            <span>Fichas Técnicas</span>
            <strong>{fichas.length}</strong>
            <p>Receitas cadastradas</p>
          </div>

          <div className="financeiro-kpi purple">
            <FaIndustry />
            <span>Produtos</span>
            <strong>{produtos.length}</strong>
            <p>Catálogo ativo</p>
          </div>
        </section>

        <section className="financeiro-grid">
          <div className="financeiro-card">
            <h2>
              <FaPlus /> Nova Matéria-prima
            </h2>

            <input
              placeholder="Nome"
              value={novaMateria.nome}
              onChange={(e) =>
                setNovaMateria({ ...novaMateria, nome: e.target.value })
              }
            />

            <input
              placeholder="Categoria"
              value={novaMateria.categoria}
              onChange={(e) =>
                setNovaMateria({ ...novaMateria, categoria: e.target.value })
              }
            />

            <select
              value={novaMateria.unidade}
              onChange={(e) =>
                setNovaMateria({ ...novaMateria, unidade: e.target.value })
              }
            >
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="litro">litro</option>
              <option value="unidade">unidade</option>
            </select>

            <input
              type="number"
              placeholder="Estoque atual"
              value={novaMateria.estoqueAtual}
              onChange={(e) =>
                setNovaMateria({ ...novaMateria, estoqueAtual: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Estoque mínimo"
              value={novaMateria.estoqueMinimo}
              onChange={(e) =>
                setNovaMateria({ ...novaMateria, estoqueMinimo: e.target.value })
              }
            />

            <input
              type="number"
              step="0.01"
              placeholder="Custo unitário"
              value={novaMateria.custoUnitario}
              onChange={(e) =>
                setNovaMateria({ ...novaMateria, custoUnitario: e.target.value })
              }
            />

            <input
              placeholder="Fornecedor"
              value={novaMateria.fornecedor}
              onChange={(e) =>
                setNovaMateria({ ...novaMateria, fornecedor: e.target.value })
              }
            />

            <button onClick={cadastrarMateria}>Cadastrar Matéria-prima</button>
          </div>

          <div className="financeiro-card">
            <h2>
              <FaClipboardList /> Nova Ficha Técnica
            </h2>

            <select
              value={novaFicha.produto}
              onChange={(e) =>
                setNovaFicha({ ...novaFicha, produto: e.target.value })
              }
            >
              <option value="">Selecione o produto</option>
              {produtos.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.nome}
                </option>
              ))}
            </select>

            <select
              value={novaFicha.materiaPrima}
              onChange={(e) =>
                setNovaFicha({ ...novaFicha, materiaPrima: e.target.value })
              }
            >
              <option value="">Selecione a matéria-prima</option>
              {materias.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.nome} - {dinheiro(m.custoUnitario)} / {m.unidade}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Quantidade usada"
              value={novaFicha.quantidade}
              onChange={(e) =>
                setNovaFicha({ ...novaFicha, quantidade: e.target.value })
              }
            />

            <select
              value={novaFicha.unidade}
              onChange={(e) =>
                setNovaFicha({ ...novaFicha, unidade: e.target.value })
              }
            >
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="litro">litro</option>
              <option value="unidade">unidade</option>
            </select>

            <button onClick={criarFicha}>Criar Ficha Técnica</button>
          </div>

          <div className="financeiro-card">
            <h2>
              <FaIndustry /> Registrar Produção
            </h2>

            <select
              value={novaProducao.produtoId}
              onChange={(e) =>
                setNovaProducao({ ...novaProducao, produtoId: e.target.value })
              }
            >
              <option value="">Selecione o produto</option>
              {produtos.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.nome} - Estoque: {p.estoque}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Quantidade produzida"
              value={novaProducao.quantidadeProduzida}
              onChange={(e) =>
                setNovaProducao({
                  ...novaProducao,
                  quantidadeProduzida: e.target.value,
                })
              }
            />

            <button onClick={registrarProducao}>Registrar Produção</button>
          </div>

          <div className="financeiro-card movimentacoes grande">
            <h2>Matérias-primas</h2>

            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Unidade</th>
                  <th>Estoque</th>
                  <th>Mínimo</th>
                  <th>Custo</th>
                  <th>Fornecedor</th>
                </tr>
              </thead>

              <tbody>
                {materias.map((m) => (
                  <tr key={m._id}>
                    <td>{m.nome}</td>
                    <td>{m.unidade}</td>
                    <td>{m.estoqueAtual}</td>
                    <td>{m.estoqueMinimo}</td>
                    <td>{dinheiro(m.custoUnitario)}</td>
                    <td>{m.fornecedor || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="financeiro-card movimentacoes grande">
            <h2>Fichas Técnicas</h2>

            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Custo Total</th>
                  <th>Itens</th>
                </tr>
              </thead>

              <tbody>
                {fichas.map((ficha) => (
                  <tr key={ficha._id}>
                    <td>{ficha.produto?.nome}</td>
                    <td>{dinheiro(ficha.custoTotal)}</td>
                    <td>
                      {ficha.itens?.map((item) => (
                        <div key={item._id}>
                          {item.quantidade}
                          {item.unidade} - {item.materiaPrima?.nome}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="financeiro-card movimentacoes grande">
            <h2>Alertas de Estoque Baixo</h2>

            <table>
              <thead>
                <tr>
                  <th>Matéria-prima</th>
                  <th>Estoque</th>
                  <th>Mínimo</th>
                </tr>
              </thead>

              <tbody>
                {alertas.map((item) => (
                  <tr key={item._id}>
                    <td>{item.nome}</td>
                    <td className="valor-negativo">{item.estoqueAtual}</td>
                    <td>{item.estoqueMinimo}</td>
                  </tr>
                ))}

                {alertas.length === 0 && (
                  <tr>
                    <td colSpan="3">Nenhum alerta no momento.</td>
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

export default Producao;