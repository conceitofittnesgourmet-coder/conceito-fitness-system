import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaSearch,
  FaReceipt,
  FaMoneyBillWave,
  FaWallet,
  FaExclamationTriangle,
  FaEye,
  FaPrint,
  FaUser,
  FaCheck,
  FaTimes,
  FaCalendarAlt,
  FaCreditCard,
  FaFileInvoice,
  FaShoppingBag,
} from "react-icons/fa";

import toast from "react-hot-toast";

import AdminLayout
  from "../layouts/AdminLayout";

import api
  from "../services/api";

import "../styles/gestao-vendas.css";


function moeda(valor) {
  return Number(valor || 0)
    .toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
}


function dataHora(data) {
  if (!data) return "-";

  return new Date(data)
    .toLocaleString("pt-BR");
}


function dataSimples(data) {
  if (!data) return "-";

  return new Date(data)
    .toLocaleDateString("pt-BR");
}


function formaPagamentoLabel(forma) {
  const valor =
    String(forma || "")
      .toUpperCase();

  const mapa = {
    PIX: "PIX",
    DINHEIRO: "Dinheiro",
    CREDITO: "Cartão Crédito",
    DEBITO: "Cartão Débito",
    CREDIARIO: "Crediário",
  };

  return mapa[valor] || valor || "-";
}


function statusVendaLabel(status) {
  const mapa = {
    pendente: "Pendente",
    producao: "Produção",
    pronto: "Pronto",
    entregue: "Concluída",
    cancelado: "Cancelada",
  };

  return mapa[status] || status || "-";
}


function GestaoVendas() {
  const [pedidos, setPedidos] =
    useState([]);

  const [contasReceber, setContasReceber] =
    useState([]);

const [resumoCentral, setResumoCentral] =
  useState({
    vendas: {
      faturamento: 0,
      quantidade: 0,
      ticketMedio: 0,
      maiorVenda: 0,
      pix: 0,
      credito: 0,
      debito: 0,
      dinheiro: 0,
      crediario: 0,
      outros: 0,
    },

    financeiro: {
      entradas: 0,
      saidas: 0,
      saldo: 0,
    },

    contas: {
      pagar: {
        totalAberto: 0,
        totalVencido: 0,
      },

      receber: {
        totalAberto: 0,
        totalVencido: 0,
      },
    },
  });

  const [loading, setLoading] =
    useState(true);

  const [aba, setAba] =
    useState("vendas");

  const [busca, setBusca] =
    useState("");

  const [formaPagamento, setFormaPagamento] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [dataInicio, setDataInicio] =
    useState("");

  const [dataFim, setDataFim] =
    useState("");

  const [vendaSelecionada, setVendaSelecionada] =
    useState(null);

  const [contaSelecionada, setContaSelecionada] =
    useState(null);

  const [formaRecebimento, setFormaRecebimento] =
    useState("PIX");

  const [recebendo, setRecebendo] =
    useState(false);


  async function carregarDados() {
    try {
      setLoading(true);

      const [
  pedidosResponse,
  financeiroCentralResponse,
] =
  await Promise.all([
    api.get("/pedidos"),

    api.get(
      "/financeiro-central/hoje"
    ),
  ]);

      setPedidos(
        pedidosResponse
          .data
          ?.pedidos || []
      );

      setResumoCentral(
  financeiroCentralResponse
    .data || {}
);

setContasReceber(
  financeiroCentralResponse
    .data
    ?.dados
    ?.contasReceber || []
);

    } catch (error) {
      console.error(
        "Erro Gestão de Vendas:",
        error
      );

      toast.error(
        "Não foi possível carregar a Gestão de Vendas."
      );

    } finally {
      setLoading(false);
    }
  }

async function visualizarVenda(pedido) {
  try {
    if (!pedido?._id) {
      toast.error(
        "Não foi possível identificar esta venda."
      );

      return;
    }

    const response =
      await api.get(
        `/pedidos/${pedido._id}`
      );

    const vendaCompleta =
      response.data?.pedido ||
      response.data;

    if (!vendaCompleta?._id) {
      toast.error(
        "Os detalhes desta venda não foram encontrados."
      );

      return;
    }

    setVendaSelecionada(
      vendaCompleta
    );

  } catch (error) {
    console.error(
      "Erro ao carregar detalhes da venda:",
      error
    );

    toast.error(
      error.response?.data?.message ||
      "Não foi possível carregar os detalhes da venda."
    );
  }
}

  useEffect(() => {
    carregarDados();
  }, []);


  const vendasValidas =
    useMemo(() => {

      return pedidos.filter(
        (pedido) =>
          pedido.status !==
          "cancelado"
      );

    }, [pedidos]);

  const contasCrediario =
    useMemo(() => {

      return contasReceber.filter(
        (conta) =>
          String(
            conta.formaRecebimento || ""
          )
            .toUpperCase() ===
            "CREDIARIO"
      );

    }, [contasReceber]);


  const crediarioAberto =
    contasCrediario
      .filter(
        (conta) =>
          conta.status ===
            "pendente" ||
          conta.status ===
            "vencida"
      )
      .reduce(
        (total, conta) =>
          total +
          Number(
            conta.valor || 0
          ),
        0
      );


  const agora =
    new Date();


  const crediarioVencido =
    contasCrediario
      .filter((conta) => {

        if (
          conta.status ===
          "recebida" ||
          conta.status ===
          "cancelada"
        ) {
          return false;
        }

        if (!conta.vencimento) {
          return false;
        }

        return (
          new Date(
            conta.vencimento
          ) < agora
        );

      })
      .reduce(
        (total, conta) =>
          total +
          Number(
            conta.valor || 0
          ),
        0
      );


  const vendasFiltradas =
    useMemo(() => {

      const termo =
        busca
          .trim()
          .toLowerCase();

      return pedidos.filter(
        (pedido) => {

          if (formaPagamento) {

            const formas =
              Array.isArray(
                pedido.pagamentos
              )
                ? pedido.pagamentos.map(
                    (p) =>
                      String(
                        p.forma || ""
                      )
                        .toUpperCase()
                  )
                : [
                    String(
                      pedido.pagamento ||
                      ""
                    )
                      .toUpperCase(),
                  ];

            if (
              !formas.includes(
                formaPagamento
              )
            ) {
              return false;
            }
          }


          if (
            status &&
            pedido.status !== status
          ) {
            return false;
          }


          if (
            dataInicio &&
            pedido.createdAt
          ) {

            const data =
              new Date(
                pedido.createdAt
              );

            const inicio =
              new Date(
                `${dataInicio}T00:00:00`
              );

            if (data < inicio) {
              return false;
            }
          }


          if (
            dataFim &&
            pedido.createdAt
          ) {

            const data =
              new Date(
                pedido.createdAt
              );

            const fim =
              new Date(
                `${dataFim}T23:59:59`
              );

            if (data > fim) {
              return false;
            }
          }


          if (!termo) {
            return true;
          }


          const numero =
            String(
              pedido.numeroPedido ||
              ""
            );

          const id =
            String(
              pedido._id || ""
            );

          const cliente =
            String(
              pedido.cliente || ""
            )
              .toLowerCase();

          const telefone =
            String(
              pedido.telefone || ""
            )
              .toLowerCase();

          const documento =
            String(
              pedido.cpfNota || ""
            )
              .toLowerCase();

          return (
            numero.includes(termo) ||
            id
              .toLowerCase()
              .includes(termo) ||
            cliente.includes(termo) ||
            telefone.includes(termo) ||
            documento.includes(termo)
          );
        }
      );

    }, [
      pedidos,
      busca,
      formaPagamento,
      status,
      dataInicio,
      dataFim,
    ]);


  const crediarioFiltrado =
    useMemo(() => {

      const termo =
        busca
          .trim()
          .toLowerCase();

      return contasCrediario
        .filter((conta) => {

          if (!termo) {
            return true;
          }

          return (
            String(
              conta.cliente || ""
            )
              .toLowerCase()
              .includes(termo) ||

            String(
              conta.descricao || ""
            )
              .toLowerCase()
              .includes(termo)
          );

        })
        .sort(
          (a, b) =>
            new Date(
              b.createdAt || 0
            ) -
            new Date(
              a.createdAt || 0
            )
        );

    }, [
      contasCrediario,
      busca,
    ]);


  const resumoClientes =
    useMemo(() => {

      const mapa =
        new Map();

      contasCrediario.forEach(
        (conta) => {

          const nome =
            String(
              conta.cliente ||
              "Cliente"
            )
              .trim();

          const chave =
            nome.toLowerCase();

          if (
            !mapa.has(chave)
          ) {

            mapa.set(
              chave,
              {
                nome,
                total: 0,
                aberto: 0,
                vencido: 0,
                recebido: 0,
                contas: 0,
              }
            );
          }


          const cliente =
            mapa.get(chave);

          const valor =
            Number(
              conta.valor || 0
            );

          cliente.total +=
            valor;

          cliente.contas +=
            1;


          if (
            conta.status ===
            "recebida"
          ) {

            cliente.recebido +=
              valor;

          } else if (
            conta.status !==
            "cancelada"
          ) {

            cliente.aberto +=
              valor;

            if (
              conta.vencimento &&
              new Date(
                conta.vencimento
              ) < agora
            ) {

              cliente.vencido +=
                valor;
            }
          }
        }
      );

      return Array
        .from(
          mapa.values()
        )
        .filter((cliente) => {

          const termo =
            busca
              .trim()
              .toLowerCase();

          if (!termo) {
            return true;
          }

          return cliente
            .nome
            .toLowerCase()
            .includes(termo);
        })
        .sort(
          (a, b) =>
            b.aberto -
            a.aberto
        );

    }, [
      contasCrediario,
      busca,
    ]);


  function abrirCupom(pedido) {

    window.open(
      `/cupom/${pedido._id}`,
      "_blank",
      "noopener,noreferrer"
    );
  }


  async function abrirFiscal(pedido) {

    try {

      const response =
        await api.get(
          `/nfce/pedido/${pedido._id}`
        );

      const nfce =
        response.data?.nfce;

      if (!nfce) {

        toast.error(
          "Esta venda não possui NFC-e."
        );

        return;
      }


      if (
        nfce.status !==
        "autorizada"
      ) {

        toast.error(
          `NFC-e com status: ${
            nfce.status || "desconhecido"
          }`
        );

        return;
      }


      window.open(
        `/cupom/${pedido._id}`,
        "_blank",
        "noopener,noreferrer"
      );

    } catch (error) {

      console.error(error);

      toast.error(
        "Não foi possível localizar a NFC-e desta venda."
      );
    }
  }


  async function receberCrediario() {

    if (
      !contaSelecionada?._id
    ) {
      return;
    }

    try {

      setRecebendo(true);

      await api.put(
        `/financeiro/contas-receber/${contaSelecionada._id}/receber`,
        {
          formaRecebimento,
        }
      );


      toast.success(
        "Recebimento registrado com sucesso."
      );

      setContaSelecionada(
        null
      );

      await carregarDados();

    } catch (error) {

      console.error(error);

      toast.error(
        error.response
          ?.data
          ?.message ||
        "Erro ao registrar recebimento."
      );

    } finally {

      setRecebendo(false);
    }
  }


  if (loading) {

    return (
      <AdminLayout
        title="Gestão de Vendas"
        subtitle="Carregando vendas e crediário..."
      >
        <div className="gv-loading">
          <div className="loading-spinner" />
          <span>
            Carregando Central de Vendas...
          </span>
        </div>
      </AdminLayout>
    );
  }


  return (
    <AdminLayout
      title="Gestão de Vendas"
      subtitle="Controle completo do pós-venda, documentos fiscais e crediário"
    >

      <div className="gv-page">

        <section className="gv-hero">

          <div>

            <span className="gv-eyebrow">
              Conceito Fitness Gourmet
            </span>

            <h1>
              Central de Gestão de Vendas
            </h1>

            <p>
              Consulte vendas, documentos fiscais,
              pagamentos e crediário em um único lugar.
            </p>

          </div>

          <div className="gv-online">
            <span />
            Sistema Online
          </div>

        </section>


        <section className="gv-kpis">

          <div className="gv-kpi">

            <div className="gv-kpi-icon green">
              <FaShoppingBag />
            </div>

            <span>
              Vendas Hoje
            </span>

            <strong>
  {Number(
    resumoCentral
      ?.vendas
      ?.quantidade || 0
  )}
</strong>

            <small>
              vendas realizadas
            </small>

          </div>


          <div className="gv-kpi">

            <div className="gv-kpi-icon gold">
              <FaMoneyBillWave />
            </div>

            <span>
              Faturamento Hoje
            </span>

            <strong>
  {moeda(
    resumoCentral
      ?.vendas
      ?.faturamento
  )}
</strong>

            <small>
              vendas não canceladas
            </small>

          </div>


          <div className="gv-kpi">

            <div className="gv-kpi-icon blue">
              <FaWallet />
            </div>

            <span>
              Crediário em Aberto
            </span>

            <strong>
              {moeda(
                crediarioAberto
              )}
            </strong>

            <small>
              saldo a receber
            </small>

          </div>


          <div className="gv-kpi danger">

            <div className="gv-kpi-icon red">
              <FaExclamationTriangle />
            </div>

            <span>
              Crediário Vencido
            </span>

            <strong>
              {moeda(
                crediarioVencido
              )}
            </strong>

            <small>
              precisa de atenção
            </small>

          </div>

        </section>


        <section className="gv-panel">

          <div className="gv-tabs">

            <button
              className={
                aba === "vendas"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setAba("vendas")
              }
            >
              <FaReceipt />
              Vendas
            </button>


            <button
              className={
                aba === "crediario"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setAba("crediario")
              }
            >
              <FaWallet />
              Crediário
            </button>


            <button
              className={
                aba === "clientes"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setAba("clientes")
              }
            >
              <FaUser />
              Extrato por Cliente
            </button>

          </div>


          <div className="gv-toolbar">

            <div className="gv-search">

              <FaSearch />

              <input
                value={busca}
                onChange={(e) =>
                  setBusca(
                    e.target.value
                  )
                }
                placeholder={
                  aba === "vendas"
                    ? "Pedido, cliente, CPF/CNPJ ou telefone..."
                    : "Buscar cliente..."
                }
              />

            </div>


            {aba === "vendas" && (
              <>

                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) =>
                    setDataInicio(
                      e.target.value
                    )
                  }
                />


                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) =>
                    setDataFim(
                      e.target.value
                    )
                  }
                />


                <select
                  value={
                    formaPagamento
                  }
                  onChange={(e) =>
                    setFormaPagamento(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Todos pagamentos
                  </option>

                  <option value="PIX">
                    PIX
                  </option>

                  <option value="DINHEIRO">
                    Dinheiro
                  </option>

                  <option value="CREDITO">
                    Crédito
                  </option>

                  <option value="DEBITO">
                    Débito
                  </option>

                  <option value="CREDIARIO">
                    Crediário
                  </option>

                </select>


                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Todos status
                  </option>

                  <option value="pendente">
                    Pendente
                  </option>

                  <option value="producao">
                    Produção
                  </option>

                  <option value="pronto">
                    Pronto
                  </option>

                  <option value="entregue">
                    Concluída
                  </option>

                  <option value="cancelado">
                    Cancelada
                  </option>

                </select>

              </>
            )}

          </div>


          {aba === "vendas" && (

            <div className="gv-table-wrap">

              <table className="gv-table">

                <thead>
                  <tr>
                    <th>Venda</th>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Pagamento</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>


                <tbody>

                  {vendasFiltradas.map(
                    (pedido) => {

                      const pagamentos =
                        Array.isArray(
                          pedido.pagamentos
                        ) &&
                        pedido.pagamentos.length
                          ? pedido.pagamentos
                          : [
                              {
                                forma:
                                  pedido.pagamento,
                              },
                            ];

                      return (
                        <tr
                          key={
                            pedido._id
                          }
                        >

                          <td>
                            <strong>
                              #
                              {String(
                                pedido.numeroPedido ||
                                pedido._id
                                  ?.slice(-6)
                              )
                                .padStart(
                                  6,
                                  "0"
                                )}
                            </strong>

                            <small>
                              {pedido.canalVenda ||
                                "erp"}
                            </small>
                          </td>


                          <td>
                            {dataHora(
                              pedido.createdAt
                            )}
                          </td>


                          <td>
                            <strong>
                              {pedido.cliente ||
                                "Cliente Balcão"}
                            </strong>

                            <small>
                              {pedido.telefone ||
                                "-"}
                            </small>
                          </td>


                          <td>
                            {pagamentos.map(
                              (
                                pagamento,
                                index
                              ) => (
                                <span
                                  className="gv-payment"
                                  key={
                                    index
                                  }
                                >
                                  {formaPagamentoLabel(
                                    pagamento.forma
                                  )}
                                </span>
                              )
                            )}
                          </td>


                          <td className="gv-value">
                            {moeda(
                              pedido.total
                            )}
                          </td>


                          <td>

                            <span
                              className={`gv-status ${pedido.status}`}
                            >
                              {statusVendaLabel(
                                pedido.status
                              )}
                            </span>

                          </td>


                          <td>

                            <div className="gv-actions">

  <button
    title="Visualizar venda"
    onClick={() =>
      visualizarVenda(
        pedido
      )
    }
  >
    <FaEye />
  </button>


  <button
    title="Reimprimir cupom / DANFE NFC-e"
    onClick={() =>
      abrirFiscal(
        pedido
      )
    }
  >
    <FaPrint />
  </button>

</div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>


              {!vendasFiltradas.length && (
                <div className="gv-empty">
                  Nenhuma venda encontrada.
                </div>
              )}

            </div>
          )}


          {aba === "crediario" && (

            <div className="gv-table-wrap">

              <table className="gv-table">

                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Descrição</th>
                    <th>Venda</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>


                <tbody>

                  {crediarioFiltrado.map(
                    (conta) => {

                      const vencida =
                        conta.vencimento &&
                        new Date(
                          conta.vencimento
                        ) < agora &&
                        conta.status !==
                          "recebida" &&
                        conta.status !==
                          "cancelada";

                      return (
                        <tr
                          key={conta._id}
                        >

                          <td>
                            <strong>
                              {conta.cliente ||
                                "Cliente"}
                            </strong>
                          </td>


                          <td>
                            {conta.descricao}
                          </td>


                          <td>
                            {conta.pedido
                              ? `#${String(
                                  typeof conta.pedido ===
                                    "object"
                                    ? conta.pedido
                                        .numeroPedido ||
                                      conta.pedido
                                        ._id
                                        ?.slice(-6)
                                    : conta.pedido
                                        .slice(-6)
                                )}`
                              : "-"}
                          </td>


                          <td>
                            {dataSimples(
                              conta.vencimento
                            )}
                          </td>


                          <td className="gv-value">
                            {moeda(
                              conta.valor
                            )}
                          </td>


                          <td>

                            <span
                              className={`gv-status ${
                                vencida
                                  ? "vencida"
                                  : conta.status
                              }`}
                            >

                              {vencida
                                ? "Vencida"
                                : conta.status}

                            </span>

                          </td>


                          <td>

                            {conta.status !==
                              "recebida" &&
                              conta.status !==
                                "cancelada" && (

                                <button
                                  className="gv-receive"
                                  onClick={() =>
                                    setContaSelecionada(
                                      conta
                                    )
                                  }
                                >
                                  <FaCheck />
                                  Receber
                                </button>
                              )}

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>


              {!crediarioFiltrado.length && (
                <div className="gv-empty">
                  Nenhum crediário encontrado.
                </div>
              )}

            </div>
          )}


          {aba === "clientes" && (

            <div className="gv-client-grid">

              {resumoClientes.map(
                (cliente) => (

                  <div
                    className="gv-client-card"
                    key={
                      cliente.nome
                    }
                  >

                    <div className="gv-client-header">

                      <div className="gv-client-avatar">
                        {cliente.nome
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {cliente.nome}
                        </strong>

                        <span>
                          {cliente.contas} lançamento(s)
                        </span>
                      </div>

                    </div>


                    <div className="gv-client-numbers">

                      <div>
                        <span>
                          Total lançado
                        </span>

                        <strong>
                          {moeda(
                            cliente.total
                          )}
                        </strong>
                      </div>


                      <div>
                        <span>
                          Recebido
                        </span>

                        <strong className="green-text">
                          {moeda(
                            cliente.recebido
                          )}
                        </strong>
                      </div>


                      <div>
                        <span>
                          Em aberto
                        </span>

                        <strong>
                          {moeda(
                            cliente.aberto
                          )}
                        </strong>
                      </div>


                      <div>
                        <span>
                          Vencido
                        </span>

                        <strong className="red-text">
                          {moeda(
                            cliente.vencido
                          )}
                        </strong>
                      </div>

                    </div>


                    <button
                      className="gv-client-button"
                      onClick={() => {
                        setBusca(
                          cliente.nome
                        );

                        setAba(
                          "crediario"
                        );
                      }}
                    >
                      Ver extrato completo
                    </button>

                  </div>
                )
              )}


              {!resumoClientes.length && (
                <div className="gv-empty">
                  Nenhum cliente com crediário encontrado.
                </div>
              )}

            </div>
          )}

        </section>

      </div>


      {vendaSelecionada && (

        <div
          className="gv-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              setVendaSelecionada(
                null
              );
            }
          }}
        >

          <div className="gv-modal">

            <div className="gv-modal-header">

              <div>

                <span>
                  Detalhes da Venda
                </span>

                <h2>
                  Venda #
                  {String(
                    vendaSelecionada
                      .numeroPedido ||
                    vendaSelecionada
                      ._id
                      ?.slice(-6)
                  )
                    .padStart(
                      6,
                      "0"
                    )}
                </h2>

              </div>


              <button
                className="gv-close"
                onClick={() =>
                  setVendaSelecionada(
                    null
                  )
                }
              >
                <FaTimes />
              </button>

            </div>


            <div className="gv-modal-body">

              <section className="gv-detail-section">

                <h3>
                  <FaUser />
                  Cliente
                </h3>

                <div className="gv-detail-grid">

                  <div>
                    <span>Nome</span>
                    <strong>
                      {vendaSelecionada.cliente ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>Telefone</span>
                    <strong>
                      {vendaSelecionada.telefone ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>CPF/CNPJ</span>
                    <strong>
                      {vendaSelecionada.cpfNota ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>Data</span>
                    <strong>
                      {dataHora(
                        vendaSelecionada.createdAt
                      )}
                    </strong>
                  </div>

                </div>

              </section>


              <section className="gv-detail-section">

                <h3>
                  <FaShoppingBag />
                  Itens
                </h3>

                <div className="gv-items">

                  {(vendaSelecionada.produtos ||
                    []).map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        key={index}
                        className="gv-item"
                      >

                        <span>
                          {Number(
                            item.quantidade ||
                            1
                          )}x{" "}
                          {item.nome ||
                            "Produto"}
                        </span>

                        <strong>
                          {moeda(
                            Number(
                              item.subtotal ||
                              (
                                Number(
                                  item.preco ||
                                  0
                                ) *
                                Number(
                                  item.quantidade ||
                                  1
                                )
                              )
                            )
                          )}
                        </strong>

                      </div>
                    )
                  )}

                </div>

              </section>


              <section className="gv-detail-section">

                <h3>
                  <FaCreditCard />
                  Pagamentos
                </h3>

                <div className="gv-items">

                  {Array.isArray(
                    vendaSelecionada.pagamentos
                  ) &&
                  vendaSelecionada.pagamentos
                    .length ? (

                    vendaSelecionada
                      .pagamentos
                      .map(
                        (
                          pagamento,
                          index
                        ) => (

                          <div
                            className="gv-item"
                            key={index}
                          >

                            <span>
                              {formaPagamentoLabel(
                                pagamento.forma
                              )}
                            </span>

                            <strong>
                              {moeda(
                                pagamento.valor
                              )}
                            </strong>

                          </div>
                        )
                      )

                  ) : (

                    <div className="gv-item">

                      <span>
                        {formaPagamentoLabel(
                          vendaSelecionada.pagamento
                        )}
                      </span>

                      <strong>
                        {moeda(
                          vendaSelecionada.total
                        )}
                      </strong>

                    </div>
                  )}

                </div>

              </section>


              <section className="gv-total-box">

                <div>
                  <span>Subtotal</span>
                  <strong>
                    {moeda(
                      vendaSelecionada.subtotal
                    )}
                  </strong>
                </div>

                <div>
                  <span>Entrega</span>
                  <strong>
                    {moeda(
                      vendaSelecionada.taxaEntrega
                    )}
                  </strong>
                </div>

                <div>
                  <span>Desconto</span>
                  <strong>
                    -{" "}
                    {moeda(
                      vendaSelecionada.desconto
                    )}
                  </strong>
                </div>

                <div className="total">
                  <span>Total</span>
                  <strong>
                    {moeda(
                      vendaSelecionada.total
                    )}
                  </strong>
                </div>

              </section>

            </div>


            <div className="gv-modal-footer">

              <button
                className="gv-secondary"
                onClick={() =>
                  setVendaSelecionada(
                    null
                  )
                }
              >
                Fechar
              </button>


              <button
                className="gv-print"
                onClick={() =>
                  abrirCupom(
                    vendaSelecionada
                  )
                }
              >
                <FaReceipt />
                Imprimir comprovante
              </button>


              <button
                className="gv-primary"
                onClick={() =>
                  abrirFiscal(
                    vendaSelecionada
                  )
                }
              >
                <FaFileInvoice />
                Reimprimir NFC-e
              </button>

            </div>

          </div>

        </div>
      )}


      {contaSelecionada && (

        <div className="gv-modal-overlay">

          <div className="gv-receive-modal">

            <div className="gv-modal-header">

              <div>
                <span>
                  Baixa de Crediário
                </span>

                <h2>
                  Registrar Recebimento
                </h2>
              </div>


              <button
                className="gv-close"
                onClick={() =>
                  setContaSelecionada(
                    null
                  )
                }
              >
                <FaTimes />
              </button>

            </div>


            <div className="gv-receive-body">

              <div className="gv-receive-highlight">
                <span>
                  Cliente
                </span>

                <strong>
                  {contaSelecionada.cliente}
                </strong>
              </div>


              <div className="gv-receive-highlight">
                <span>
                  Valor
                </span>

                <strong>
                  {moeda(
                    contaSelecionada.valor
                  )}
                </strong>
              </div>


              <div className="gv-receive-highlight">
                <span>
                  Vencimento
                </span>

                <strong>
                  {dataSimples(
                    contaSelecionada.vencimento
                  )}
                </strong>
              </div>


              <label>
                Forma de recebimento

                <select
                  value={
                    formaRecebimento
                  }
                  onChange={(e) =>
                    setFormaRecebimento(
                      e.target.value
                    )
                  }
                >
                  <option value="PIX">
                    PIX
                  </option>

                  <option value="DINHEIRO">
                    Dinheiro
                  </option>

                  <option value="CREDITO">
                    Cartão Crédito
                  </option>

                  <option value="DEBITO">
                    Cartão Débito
                  </option>
                </select>

              </label>

            </div>


            <div className="gv-modal-footer">

              <button
                className="gv-secondary"
                onClick={() =>
                  setContaSelecionada(
                    null
                  )
                }
              >
                Cancelar
              </button>


              <button
                className="gv-primary"
                disabled={recebendo}
                onClick={
                  receberCrediario
                }
              >
                <FaCheck />

                {recebendo
                  ? "Registrando..."
                  : "Confirmar recebimento"}
              </button>

            </div>

          </div>

        </div>
      )}

    </AdminLayout>
  );
}


export default GestaoVendas;