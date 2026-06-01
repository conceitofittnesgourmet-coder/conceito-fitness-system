import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import socket from "../services/socket";
import AdminLayout from "../layouts/AdminLayout";

import {
  FaUsers,
  FaUserPlus,
  FaCrown,
  FaStar,
  FaMoneyBillWave,
  FaSearch,
  FaEye,
  FaEdit,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaShoppingBag,
  FaPlus,
} from "react-icons/fa";

function Clientes() {
  const [pedidos, setPedidos] = useState([]);
  const [clientesBanco, setClientesBanco] = useState([]);
  const [busca, setBusca] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  const [novoCliente, setNovoCliente] = useState({
    nome: "",
    email: "",
    telefone: "",
    cidade: "",
    clube: "Básico",
  });

  async function carregarPedidos() {
    try {
      const response = await api.get("/pedidos");
      setPedidos(response.data.pedidos || []);
    } catch (error) {
      console.log(error);
    }
  }

async function carregarClientes() {
  try {
    const response = await api.get("/clientes");

    setClientesBanco(
      response.data?.clientes || []
    );
  } catch (error) {
    console.log("Erro ao carregar clientes:", error);
  }
}

  useEffect(() => {
    carregarPedidos();
    carregarClientes();

      socket.on("novo-pedido", carregarPedidos);
    socket.on("pedido-atualizado", carregarPedidos);

    return () => {
      socket.off("novo-pedido", carregarPedidos);
      socket.off("pedido-atualizado", carregarPedidos);
    };
  }, []);

  const clientesPedidos = useMemo(() => {
    const mapa = {};

    pedidos.forEach((pedido) => {
      const telefone = pedido.telefone || "Sem telefone";
      const chave = telefone;

      if (!mapa[chave]) {
        mapa[chave] = {
          id: chave,
          nome: pedido.cliente || "Cliente",
          email: "",
          telefone,
          cidade: pedido.endereco || "Não informado",
          pedidos: 0,
          gasto: 0,
          clube: "Básico",
          ultimoPedido: pedido.createdAt,
          ativo: true,
          origem: "pedido",
        };
      }

      mapa[chave].pedidos += 1;
      mapa[chave].gasto += Number(pedido.total || 0);

      if (new Date(pedido.createdAt) > new Date(mapa[chave].ultimoPedido)) {
        mapa[chave].ultimoPedido = pedido.createdAt;
      }
    });

    return Object.values(mapa).map((cliente) => ({
      ...cliente,
      clube:
  cliente.gasto >= 2000
    ? "Black"
    : cliente.gasto >= 1000
    ? "Premium"
    : cliente.gasto >= 500
    ? "Ouro"
    : cliente.gasto >= 250
    ? "Prata"
    : "Básico",
    }));
  }, [pedidos]);

  const clientes = [...clientesPedidos, ...clientesBanco];
  const clientesFiltrados = clientes.filter((cliente) => {
    const termo = busca.toLowerCase();

    return (
      cliente.nome?.toLowerCase().includes(termo) ||
      cliente.telefone?.toLowerCase().includes(termo) ||
      cliente.email?.toLowerCase().includes(termo)
    );
  });

  const totalClientes = clientes.length;
  const novosClientes = clientes.filter((c) => c.origem === "manual").length;
  const clubeConceito = clientes.filter((c) => c.clube !== "Básico").length;
  const faturamentoTotal = clientes.reduce((acc, c) => acc + Number(c.gasto || 0), 0);
  const avaliacaoMedia = "4.9";

  const clienteAtivo = clienteSelecionado || clientesFiltrados[0];

  async function excluirCliente(id) {
  const confirmar = window.confirm(
    "Deseja excluir este cliente?"
  );

  if (!confirmar) return;

  try {
    await api.delete(`/clientes/${id}`);

    await carregarClientes();

    alert("Cliente removido com sucesso!");
  } catch (error) {
    console.log(error);

    alert("Erro ao excluir cliente.");
  }
}
  
  async function cadastrarCliente() {
    
  try {
    if (
      !novoCliente.nome ||
      !novoCliente.telefone
    ) {
      alert(
        "Preencha nome e telefone"
      );
      return;
    }

    await api.post("/clientes", {
      nome: novoCliente.nome,
      email: novoCliente.email,
      telefone: novoCliente.telefone,
      cidade: novoCliente.cidade,
      clube: novoCliente.clube,
    });

    setNovoCliente({
      nome: "",
      email: "",
      telefone: "",
      cidade: "",
      clube: "Básico",
    });

    await carregarClientes();

    alert(
      "Cliente cadastrado com sucesso!"
    );
  } catch (error) {
    console.log(error);

    alert(
      error.response?.data?.message ||
      "Erro ao cadastrar cliente"
    );
  }
}

  function formatarData(data) {
    if (!data) return "Sem pedido";

    return new Date(data).toLocaleDateString("pt-BR");
  }

  return (
    <AdminLayout title="Clientes" subtitle="Gerencie seus clientes e Clube Conceito">
      <div className="clientes-premium-page">
        <section className="clientes-topbar">
          <div>
            <span>Clientes</span>
            <h1>Gestão de Clientes</h1>
            <p>Clientes, histórico, preferências e Clube Conceito em um só lugar.</p>
          </div>

          <div className="clientes-search">
            <FaSearch />
            <input
              placeholder="Buscar cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </section>

        <section className="clientes-kpis">
          <div className="cliente-kpi green">
            <FaUsers />
            <span>Total de Clientes</span>
            <strong>{totalClientes}</strong>
            <p>Ativos no sistema</p>
          </div>

          <div className="cliente-kpi blue">
            <FaUserPlus />
            <span>Novos Clientes</span>
            <strong>{novosClientes}</strong>
            <p>Cadastro manual</p>
          </div>

          <div className="cliente-kpi gold">
            <FaCrown />
            <span>Clube Conceito</span>
            <strong>{clubeConceito}</strong>
            <p>Clientes com benefício</p>
          </div>

          <div className="cliente-kpi purple">
            <FaStar />
            <span>Avaliação Média</span>
            <strong>{avaliacaoMedia}</strong>
            <p>★★★★★</p>
          </div>

          <div className="cliente-kpi green">
            <FaMoneyBillWave />
            <span>Faturamento</span>
            <strong>R$ {faturamentoTotal.toFixed(2)}</strong>
            <p>Gerado pelos clientes</p>
          </div>
        </section>

        <section className="cliente-cadastro-card">
          <div className="cliente-section-title">
            <h2>
              <FaPlus /> Novo Cliente
            </h2>
            <span>Cadastro rápido</span>
          </div>

          <div className="cliente-form-grid">
            <input
              placeholder="Nome do cliente"
              value={novoCliente.nome}
              onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
            />

            <input
              placeholder="E-mail"
              value={novoCliente.email}
              onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
            />

            <input
              placeholder="Telefone / WhatsApp"
              value={novoCliente.telefone}
              onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
            />

            <input
              placeholder="Cidade / Endereço"
              value={novoCliente.cidade}
              onChange={(e) => setNovoCliente({ ...novoCliente, cidade: e.target.value })}
            />

            <select
  value={novoCliente.clube}
  onChange={(e) => setNovoCliente({ ...novoCliente, clube: e.target.value })}
>
  <option>Básico</option>
  <option>Prata</option>
  <option>Ouro</option>
  <option>Premium</option>
  <option>Black</option>
</select>

            <button onClick={cadastrarCliente}>Cadastrar Cliente</button>
          </div>
        </section>

        <section className="clientes-layout">
          <div className="clientes-list-card">
            <div className="cliente-section-title">
              <h2>Lista de Clientes</h2>
              <span>{clientesFiltrados.length}</span>
            </div>

            <div className="clientes-lista">
              {clientesFiltrados.map((cliente) => (
                <button
                  key={cliente._id || cliente.id}
                  className={`cliente-row ${
  (clienteAtivo?._id || clienteAtivo?.id) ===
  (cliente._id || cliente.id)
    ? "active"
    : ""
}`}
                  onClick={() => setClienteSelecionado(cliente)}
                >
                  <div className="cliente-avatar">
                    {cliente.nome?.charAt(0) || "C"}
                  </div>

                  <div>
                    <strong>{cliente.nome}</strong>
                    <span>{cliente.email || cliente.telefone}</span>
                  </div>

                  <div>
                    <strong>{cliente.pedidos}</strong>
                    <span>pedidos</span>
                  </div>

                  <div>
                    <strong>R$ {Number(cliente.gasto || 0).toFixed(2)}</strong>
                    <span>{cliente.clube}</span>
                  </div>

                </button>
              ))}
            </div>
          </div>

          <div className="cliente-detalhes-card">
            {clienteAtivo ? (
              <>
                <div className="cliente-detalhes-header">
                  <div className="cliente-avatar grande">
                    {clienteAtivo.nome?.charAt(0) || "C"}
                  </div>

                  <div>
                    <h2>{clienteAtivo.nome}</h2>
                    <span className="badge-ativo">Ativo</span>
                  </div>

                  <div className={`clube-badge ${clienteAtivo.clube?.toLowerCase()}`}>
                    <FaCrown />
                    {clienteAtivo.clube}
                  </div>
                </div>

{clienteAtivo?._id && (
  <button
    onClick={() =>
      excluirCliente(clienteAtivo._id)
    }
    style={{
      marginLeft: "12px",
      background: "#dc2626",
      color: "#fff",
      border: "none",
      padding: "8px 14px",
      borderRadius: "8px",
      cursor: "pointer",
    }}
  >
    Excluir Cliente
  </button>
)}

                <div className="cliente-contato">
                  <p>
                    <FaWhatsapp /> {clienteAtivo.telefone || "Sem telefone"}
                  </p>

                  <p>
                    <FaMapMarkerAlt /> {clienteAtivo.cidade || "Não informado"}
                  </p>

                  <p>
                    <FaCalendarAlt /> Último pedido: {formatarData(clienteAtivo.ultimoPedido)}
                  </p>
                </div>

                <div className="cliente-resumo-grid">
                  <div>
                    <FaShoppingBag />
                    <span>Total de pedidos</span>
                    <strong>{clienteAtivo.pedidos}</strong>
                  </div>

                  <div>
                    <FaMoneyBillWave />
                    <span>Total gasto</span>
                    <strong>R$ {Number(clienteAtivo.gasto || 0).toFixed(2)}</strong>
                  </div>

                  <div>
                    <FaStar />
                    <span>Avaliação</span>
                    <strong>4.9</strong>
                  </div>

                  <div>
                    <FaCrown />
                    <span>Clube</span>
                    <strong>{clienteAtivo.clube}</strong>
                  </div>
                </div>

                <div className="clube-conceito-card">
                  <h3>
                    <FaCrown /> Clube Conceito
                  </h3>

                  <p>
                    Cliente participa do programa de benefícios da Conceito Fitness Gourmet.
                  </p>

                  <div className="beneficios-grid">
  <span>Descontos exclusivos</span>
  <span>Brindes especiais</span>
  <span>Prioridade em lançamentos</span>
  <span>Ofertas personalizadas</span>
  <span>Experiência VIP</span>
  <span>Benefícios por categoria</span>
</div>
                </div>
              </>
            ) : (
              <div className="sem-cliente">
                <FaUsers />
                <h3>Nenhum cliente encontrado</h3>
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default Clientes;