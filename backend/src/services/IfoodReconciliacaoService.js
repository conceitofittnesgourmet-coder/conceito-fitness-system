const Produto = require("../models/produto");
const Pedido = require("../models/pedido");
const IfoodEvento = require("../models/ifoodevento");
const IfoodPedido = require("../models/ifoodpedido");
const IfoodCatalogoMapeamento = require("../models/ifoodcatalogomapeamento");
const IfoodAuditoria = require("../models/ifoodauditoria");
const IfoodApiService = require("./IfoodApiService");
const IfoodCatalogoService = require("./IfoodCatalogoService");
const IfoodPollingService = require("./IfoodPollingService");

function texto(valor) {
  return String(valor ?? "").trim();
}

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function dataAntiga(data, minutos) {
  if (!data) return false;
  return Date.now() - new Date(data).getTime() > minutos * 60 * 1000;
}

function problema(codigo, severidade, modulo, titulo, descricao, referencia = "", acaoSugerida = "", corrigivelAutomaticamente = false, dados = {}) {
  return { codigo, severidade, modulo, titulo, descricao, referencia, acaoSugerida, corrigivelAutomaticamente, dados };
}

function publicado(produto) {
  return Boolean(produto?.ativo && (produto?.publicacao?.ifood || produto?.publicacao?.canais?.ifood));
}

function statusLocalEsperado(statusIfood) {
  const status = texto(statusIfood).toUpperCase();
  if (["CANCELLED", "CAN", "CANCELLATION_REQUESTED"].includes(status)) return "cancelado";
  if (["CONCLUDED", "CON", "DELIVERED"].includes(status)) return "entregue";
  if (["READY_TO_PICKUP", "RTP", "DISPATCHED", "DSP"].includes(status)) return "pronto";
  if (["CONFIRMED", "CFM", "PREPARATION_STARTED", "PRS"].includes(status)) return "producao";
  return "pendente";
}

function itensRemotos(lista, vendavel) {
  const saida = [];
  for (const categoria of Array.isArray(lista) ? lista : []) {
    const itens = categoria?.items || categoria?.products || categoria?.sellableItems || [];
    if (Array.isArray(itens) && itens.length) {
      for (const item of itens) saida.push({ ...item, vendavel, categoriaId: categoria.id || categoria.categoryId || "" });
    } else if (categoria?.id || categoria?.itemId || categoria?.externalCode) {
      saida.push({ ...categoria, vendavel });
    }
  }
  return saida;
}

function idRemoto(item) {
  return texto(item?.id || item?.itemId || item?.productId);
}

function codigoRemoto(item) {
  return texto(item?.externalCode || item?.external_code || item?.code);
}

function precoRemoto(item) {
  return numero(item?.price?.value ?? item?.price ?? item?.sellingPrice?.value);
}

async function executar({ origem = "manual", consultarRemoto = true } = {}) {
  const inicio = Date.now();
  const config = await IfoodApiService.obterConfiguracaoCompleta();
  const auditoria = await IfoodAuditoria.create({
    merchantId: config.merchantId || "",
    catalogId: config.catalogId || "",
    origem,
    iniciadaEm: new Date(inicio),
  });

  const problemas = [];
  const metricas = { configuracao: {}, eventos: {}, pedidos: {}, catalogo: {} };

  try {
    if (!config.ultimoTesteOk) {
      problemas.push(problema("CONFIG_CONEXAO_NAO_VALIDADA", "critico", "configuracao", "Conexão ainda não validada", "A integração não possui um teste de conexão bem-sucedido.", "configuracao", "Salve as credenciais e execute o teste de conexão."));
    }
    if (!config.merchantId) {
      problemas.push(problema("CONFIG_MERCHANT_AUSENTE", "critico", "configuracao", "Loja iFood não selecionada", "Nenhum Merchant ID está vinculado à integração.", "configuracao", "Selecione a loja autorizada no painel."));
    }
    if (config.ativa && config.sincronizarPedidos && !config.pollingAtivo) {
      problemas.push(problema("CONFIG_POLLING_DESATIVADO", "aviso", "configuracao", "Polling automático desativado", "A integração está ativa, mas os pedidos não são consultados automaticamente.", "configuracao", "Ative o polling somente após concluir o teste manual."));
    }
    if (config.pollingAtivo && dataAntiga(config.ultimoPollingEm, 3)) {
      problemas.push(problema("POLLING_ATRASADO", "critico", "eventos", "Polling sem execução recente", "O último polling ocorreu há mais de três minutos.", "polling", "Verifique o serviço do backend e execute um polling manual.", true));
    }
    metricas.configuracao = {
      ativa: Boolean(config.ativa),
      pollingAtivo: Boolean(config.pollingAtivo),
      ultimoTesteOk: Boolean(config.ultimoTesteOk),
      ultimoPollingOk: Boolean(config.ultimoPollingOk),
      ultimoPollingEm: config.ultimoPollingEm,
      statusLoja: config.ultimoStatusLoja || "",
    };

    const [eventosErro, eventosPendentes, eventosNaoReconhecidos] = await Promise.all([
      IfoodEvento.countDocuments({ statusProcessamento: "erro" }),
      IfoodEvento.countDocuments({ statusProcessamento: "recebido", createdAt: { $lt: new Date(Date.now() - 2 * 60 * 1000) } }),
      IfoodEvento.countDocuments({ statusProcessamento: "processado", reconhecidoEm: null, createdAt: { $lt: new Date(Date.now() - 2 * 60 * 1000) } }),
    ]);
    metricas.eventos = { erros: eventosErro, pendentes: eventosPendentes, processadosSemAcknowledgment: eventosNaoReconhecidos };
    if (eventosErro) problemas.push(problema("EVENTOS_COM_ERRO", "critico", "eventos", `${eventosErro} evento(s) com erro`, "Existem eventos do iFood que não foram processados com sucesso.", "eventos", "Execute a reconciliação para tentar processar novamente.", true));
    if (eventosPendentes) problemas.push(problema("EVENTOS_PENDENTES", "aviso", "eventos", `${eventosPendentes} evento(s) aguardando processamento`, "Eventos recebidos permanecem pendentes há mais de dois minutos.", "eventos", "Execute o polling manual e revise os logs.", true));
    if (eventosNaoReconhecidos) problemas.push(problema("EVENTOS_SEM_ACK", "aviso", "eventos", `${eventosNaoReconhecidos} evento(s) sem acknowledgment registrado`, "Há eventos processados cujo reconhecimento ainda não foi registrado localmente.", "eventos", "Execute o polling para concluir o acknowledgment.", true));

    const pedidosIfood = await IfoodPedido.find({}).populate("pedidoErp", "numeroPedido status cliente total").lean();
    let semPedidoErp = 0;
    let statusDivergente = 0;
    let comandoComErro = 0;
    for (const item of pedidosIfood) {
      if (!item.pedidoErp) {
        semPedidoErp += 1;
        problemas.push(problema("PEDIDO_SEM_VINCULO_ERP", "critico", "pedidos", `Pedido iFood #${item.displayId || item.orderId.slice(-6)} sem vínculo`, "O pedido foi registrado na integração, mas não possui pedido correspondente no ERP.", item.orderId, "Execute a reconciliação do pedido.", true));
      } else {
        const esperado = statusLocalEsperado(item.status);
        if (item.pedidoErp.status !== esperado && !(["pendente", "producao"].includes(item.pedidoErp.status) && esperado === "pendente")) {
          statusDivergente += 1;
          problemas.push(problema("PEDIDO_STATUS_DIVERGENTE", "aviso", "pedidos", `Status divergente no pedido #${item.displayId || item.orderId.slice(-6)}`, `iFood: ${item.status}; ERP: ${item.pedidoErp.status}.`, item.orderId, "Atualize o status local conforme o último evento do iFood.", true, { statusIfood: item.status, statusErp: item.pedidoErp.status, statusEsperado: esperado }));
        }
      }
      if (item.ultimoComandoOk === false || item.ultimoComandoErro) comandoComErro += 1;
    }
    if (comandoComErro) problemas.push(problema("PEDIDOS_COMANDO_ERRO", "aviso", "pedidos", `${comandoComErro} pedido(s) com falha no último comando`, "Existem confirmações, despachos ou cancelamentos que retornaram erro.", "pedidos", "Revise os pedidos e repita somente comandos compatíveis com o status atual."));
    metricas.pedidos = { total: pedidosIfood.length, semPedidoErp, statusDivergente, comandoComErro };

    const produtos = await Produto.find({}).lean();
    const publicados = produtos.filter(publicado);
    const mapas = await IfoodCatalogoMapeamento.find({ merchantId: config.merchantId || "" }).lean();
    const mapasProduto = mapas.filter((item) => item.tipo === "produto");
    const porLocal = new Map(mapasProduto.map((item) => [texto(item.referenciaLocal), item]));
    let semMapeamento = 0;
    let mapeamentoErro = 0;
    for (const produto of publicados) {
      const map = porLocal.get(String(produto._id));
      if (!map) {
        semMapeamento += 1;
        problemas.push(problema("CATALOGO_PRODUTO_SEM_MAPA", "critico", "catalogo", `${produto.nome} ainda não foi sincronizado`, "O produto está marcado para o canal iFood, mas não possui mapeamento externo.", String(produto._id), "Sincronize este produto.", true));
      } else if (map.status === "erro" || map.ultimoErro) {
        mapeamentoErro += 1;
        problemas.push(problema("CATALOGO_MAPA_ERRO", "critico", "catalogo", `Erro de catálogo em ${produto.nome}`, map.ultimoErro || "O último envio do produto não foi concluído.", String(produto._id), "Reenvie o produto após corrigir a configuração.", true));
      }
    }
    const mapasOrfaos = mapasProduto.filter((map) => !produtos.some((produto) => String(produto._id) === map.referenciaLocal));
    for (const map of mapasOrfaos) {
      problemas.push(problema("CATALOGO_MAPA_ORFAO", "aviso", "catalogo", `Mapeamento órfão: ${map.nomeLocal || map.ifoodId}`, "O registro aponta para um produto que não existe mais no ERP.", String(map._id), "Marque o mapeamento como ignorado ou remova-o manualmente.", true));
    }

    let remotos = [];
    let remotoErro = "";
    if (consultarRemoto && config.merchantId && config.catalogId) {
      try {
        const [vendaveis, naoVendaveis] = await Promise.all([
          IfoodApiService.listarItensVendaveis(config, config.catalogId),
          IfoodApiService.listarItensNaoVendaveis(config, config.catalogId),
        ]);
        remotos = [...itensRemotos(vendaveis, true), ...itensRemotos(naoVendaveis, false)];
      } catch (error) {
        remotoErro = error.message;
        problemas.push(problema("CATALOGO_CONSULTA_REMOTA_FALHOU", "aviso", "catalogo", "Não foi possível consultar o catálogo remoto", error.message, "catalogo", "Confirme o Catalog ID e as permissões do aplicativo."));
      }
    }

    if (remotos.length) {
      const remotoPorId = new Map(remotos.map((item) => [idRemoto(item), item]).filter(([id]) => id));
      const remotoPorCodigo = new Map(remotos.map((item) => [codigoRemoto(item), item]).filter(([codigo]) => codigo));
      for (const produto of publicados) {
        const map = porLocal.get(String(produto._id));
        if (!map) continue;
        const remoto = remotoPorId.get(map.ifoodId) || remotoPorCodigo.get(map.externalCode);
        if (!remoto) {
          problemas.push(problema("CATALOGO_ITEM_NAO_ENCONTRADO_REMOTO", "critico", "catalogo", `${produto.nome} não foi encontrado no catálogo remoto`, "Existe mapeamento local, porém o item não apareceu nas listas vendáveis ou não vendáveis do iFood.", String(produto._id), "Sincronize o produto novamente.", true));
          continue;
        }
        const precoLocal = numero(produto.preco);
        const precoIfood = precoRemoto(remoto);
        if (precoIfood > 0 && Math.abs(precoLocal - precoIfood) > 0.009) {
          problemas.push(problema("CATALOGO_PRECO_DIVERGENTE", "aviso", "catalogo", `Preço divergente em ${produto.nome}`, `ERP: R$ ${precoLocal.toFixed(2)}; iFood: R$ ${precoIfood.toFixed(2)}.`, String(produto._id), "Envie o preço atual do ERP ao iFood.", true, { precoLocal, precoIfood }));
        }
        const disponivelLocal = produto.ativo && produto.disponibilidade?.disponivel !== false;
        if (Boolean(remoto.vendavel) !== Boolean(disponivelLocal)) {
          problemas.push(problema("CATALOGO_DISPONIBILIDADE_DIVERGENTE", "aviso", "catalogo", `Disponibilidade divergente em ${produto.nome}`, `ERP: ${disponivelLocal ? "disponível" : "indisponível"}; iFood: ${remoto.vendavel ? "vendável" : "não vendável"}.`, String(produto._id), "Atualize a disponibilidade no iFood.", true, { disponivelLocal, vendavelIfood: remoto.vendavel }));
        }
      }
    }

    metricas.catalogo = {
      produtosPublicados: publicados.length,
      mapeamentos: mapasProduto.length,
      semMapeamento,
      mapeamentosComErro: mapeamentoErro,
      mapeamentosOrfaos: mapasOrfaos.length,
      itensRemotos: remotos.length,
      consultaRemotaErro: remotoErro,
    };

    const resumo = {
      configuracao: problemas.filter((item) => item.modulo === "configuracao").length,
      eventos: problemas.filter((item) => item.modulo === "eventos").length,
      pedidos: problemas.filter((item) => item.modulo === "pedidos").length,
      catalogo: problemas.filter((item) => item.modulo === "catalogo").length,
      criticos: problemas.filter((item) => item.severidade === "critico").length,
      avisos: problemas.filter((item) => item.severidade === "aviso").length,
      informativos: problemas.filter((item) => item.severidade === "info").length,
    };
    const status = resumo.criticos ? "critico" : resumo.avisos ? "atencao" : "ok";
    auditoria.status = status;
    auditoria.concluidaEm = new Date();
    auditoria.duracaoMs = Date.now() - inicio;
    auditoria.resumo = resumo;
    auditoria.metricas = metricas;
    auditoria.problemas = problemas;
    await auditoria.save();
    return auditoria.toObject();
  } catch (error) {
    auditoria.status = "erro";
    auditoria.concluidaEm = new Date();
    auditoria.duracaoMs = Date.now() - inicio;
    auditoria.erroExecucao = error.message;
    await auditoria.save();
    throw error;
  }
}

async function corrigir({ codigo, referencia } = {}) {
  const cod = texto(codigo);
  const ref = texto(referencia);
  if (!cod) throw new Error("Informe o código da pendência a corrigir.");

  if (["POLLING_ATRASADO", "EVENTOS_COM_ERRO", "EVENTOS_PENDENTES", "EVENTOS_SEM_ACK"].includes(cod)) {
    const resultado = await IfoodPollingService.executarPolling({ manual: true });
    return { codigo: cod, referencia: ref, sucesso: true, mensagem: "Polling e reprocessamento executados.", resultado };
  }

  if (["CATALOGO_PRODUTO_SEM_MAPA", "CATALOGO_MAPA_ERRO", "CATALOGO_ITEM_NAO_ENCONTRADO_REMOTO"].includes(cod)) {
    const resultado = await IfoodCatalogoService.sincronizar({ produtoId: ref });
    return { codigo: cod, referencia: ref, sucesso: true, mensagem: "Produto sincronizado novamente.", resultado };
  }

  if (cod === "CATALOGO_PRECO_DIVERGENTE") {
    const produto = await Produto.findById(ref).lean();
    if (!produto) throw new Error("Produto não encontrado.");
    const resultado = await IfoodCatalogoService.atualizarPreco(ref, produto.preco);
    return { codigo: cod, referencia: ref, sucesso: true, mensagem: "Preço do ERP enviado ao iFood.", resultado };
  }

  if (cod === "CATALOGO_DISPONIBILIDADE_DIVERGENTE") {
    const produto = await Produto.findById(ref).lean();
    if (!produto) throw new Error("Produto não encontrado.");
    const ativo = produto.ativo && produto.disponibilidade?.disponivel !== false;
    const resultado = await IfoodCatalogoService.atualizarDisponibilidade(ref, ativo ? "AVAILABLE" : "UNAVAILABLE");
    return { codigo: cod, referencia: ref, sucesso: true, mensagem: "Disponibilidade do ERP enviada ao iFood.", resultado };
  }

  if (cod === "PEDIDO_STATUS_DIVERGENTE") {
    const pedidoIfood = await IfoodPedido.findOne({ orderId: ref });
    if (!pedidoIfood?.pedidoErp) throw new Error("Pedido vinculado não encontrado.");
    const status = statusLocalEsperado(pedidoIfood.status);
    await Pedido.updateOne({ _id: pedidoIfood.pedidoErp }, { $set: { status } });
    return { codigo: cod, referencia: ref, sucesso: true, mensagem: `Status local atualizado para ${status}.` };
  }

  if (cod === "CATALOGO_MAPA_ORFAO") {
    await IfoodCatalogoMapeamento.updateOne({ _id: ref }, { $set: { status: "ignorado", ultimoErro: "Mapeamento órfão identificado pela auditoria." } });
    return { codigo: cod, referencia: ref, sucesso: true, mensagem: "Mapeamento órfão marcado como ignorado." };
  }

  throw new Error("Esta pendência exige correção manual ou ainda não possui correção automática segura.");
}

async function ultima() {
  return IfoodAuditoria.findOne({}).sort({ createdAt: -1 }).lean();
}

async function historico(limite = 10) {
  return IfoodAuditoria.find({}).sort({ createdAt: -1 }).limit(Math.min(50, Math.max(1, Number(limite || 10)))).lean();
}

module.exports = { executar, corrigir, ultima, historico };
