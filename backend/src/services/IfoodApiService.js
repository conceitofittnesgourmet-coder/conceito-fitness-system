const axios = require("axios");
const IfoodConfiguracao = require("../models/ifoodconfiguracao");
const { descriptografar } = require("./IfoodCryptoService");

const AUTH_URL = "https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token";
const MERCHANT_URL = "https://merchant-api.ifood.com.br/merchant/v1.0";
const EVENTS_URL = "https://merchant-api.ifood.com.br/events/v1.0";
const ORDER_URL = "https://merchant-api.ifood.com.br/order/v1.0";

let tokenCache = { accessToken: "", expiraEm: 0, chave: "" };

function mensagemErro(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error_description ||
    error.response?.data?.error ||
    error.message ||
    "Falha desconhecida na API do iFood."
  );
}

async function obterConfiguracaoCompleta() {
  const configuracao = await IfoodConfiguracao.findOne().select("+clientSecretCriptografado");
  if (!configuracao) throw new Error("Configure a integração com o iFood antes de testar a conexão.");
  return configuracao;
}

function credenciais(configuracao) {
  const clientId = process.env.IFOOD_CLIENT_ID || configuracao.clientId;
  const clientSecret =
    process.env.IFOOD_CLIENT_SECRET ||
    descriptografar(configuracao.clientSecretCriptografado || "");

  if (!clientId || !clientSecret) {
    throw new Error("Client ID e Client Secret do iFood ainda não foram configurados.");
  }
  return { clientId, clientSecret };
}

async function obterToken(configuracao, forcar = false) {
  const { clientId, clientSecret } = credenciais(configuracao);
  const cacheKey = `${clientId}:${configuracao._id}`;
  const agora = Date.now();

  if (!forcar && tokenCache.chave === cacheKey && tokenCache.accessToken && tokenCache.expiraEm > agora + 60000) {
    return tokenCache.accessToken;
  }

  const body = new URLSearchParams({
    grantType: "client_credentials",
    clientId,
    clientSecret,
  });

  try {
    const response = await axios.post(AUTH_URL, body.toString(), {
      headers: {
        accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 20000,
    });

    const accessToken = response.data?.accessToken || response.data?.access_token;
    const expiresIn = Number(response.data?.expiresIn || response.data?.expires_in || 10800);
    if (!accessToken) throw new Error("A autenticação do iFood não retornou um access token.");

    tokenCache = {
      accessToken,
      expiraEm: agora + expiresIn * 1000,
      chave: cacheKey,
    };
    configuracao.tokenExpiraEm = new Date(tokenCache.expiraEm);
    await configuracao.save();
    return accessToken;
  } catch (error) {
    throw new Error(`Falha ao autenticar no iFood: ${mensagemErro(error)}`);
  }
}

async function requisicao(configuracao, opcoes) {
  let token = await obterToken(configuracao);
  try {
    return await axios({
      timeout: 20000,
      ...opcoes,
      headers: {
        ...(opcoes.headers || {}),
        Authorization: `Bearer ${token}`,
        accept: "application/json",
      },
    });
  } catch (error) {
    if (error.response?.status === 401) {
      token = await obterToken(configuracao, true);
      return axios({
        timeout: 20000,
        ...opcoes,
        headers: {
          ...(opcoes.headers || {}),
          Authorization: `Bearer ${token}`,
          accept: "application/json",
        },
      });
    }
    throw new Error(mensagemErro(error));
  }
}

async function listarMerchants(configuracao) {
  const response = await requisicao(configuracao, {
    method: "GET",
    url: `${MERCHANT_URL}/merchants`,
    params: { page: 1, size: 100 },
  });
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
}

async function obterStatus(configuracao, merchantId) {
  const response = await requisicao(configuracao, {
    method: "GET",
    url: `${MERCHANT_URL}/merchants/${merchantId}/status`,
  });
  return response.data;
}

async function testarConexao() {
  const configuracao = await obterConfiguracaoCompleta();
  try {
    const merchants = await listarMerchants(configuracao);
    let selecionado = merchants.find((item) => item.id === configuracao.merchantId) || merchants[0] || null;
    let status = null;

    if (selecionado?.id) {
      status = await obterStatus(configuracao, selecionado.id);
      configuracao.merchantId = selecionado.id;
      configuracao.merchantNome = selecionado.name || selecionado.corporateName || "";
      configuracao.ultimoStatusLoja = status?.state || status?.status || "";
    }

    configuracao.ultimoTesteEm = new Date();
    configuracao.ultimoTesteOk = true;
    configuracao.ultimoErro = "";
    await configuracao.save();

    return { merchants, selecionado, status, tokenExpiraEm: configuracao.tokenExpiraEm };
  } catch (error) {
    configuracao.ultimoTesteEm = new Date();
    configuracao.ultimoTesteOk = false;
    configuracao.ultimoErro = error.message;
    await configuracao.save();
    throw error;
  }
}


async function pollingEventos(configuracao) {
  if (!configuracao.merchantId) {
    throw new Error("Selecione o Merchant ID antes de iniciar o polling.");
  }

  const response = await requisicao(configuracao, {
    method: "GET",
    url: `${EVENTS_URL}/events:polling`,
    headers: { "x-polling-merchants": configuracao.merchantId },
    validateStatus: (status) => status === 200 || status === 204,
  });

  if (response.status === 204) return [];
  return Array.isArray(response.data) ? response.data : [];
}

async function reconhecerEventos(configuracao, eventos) {
  const ids = [...new Set((eventos || []).map((item) => item?.id).filter(Boolean))];
  if (ids.length === 0) return { reconhecidos: 0 };

  for (let inicio = 0; inicio < ids.length; inicio += 2000) {
    const lote = ids.slice(inicio, inicio + 2000).map((id) => ({ id }));
    await requisicao(configuracao, {
      method: "POST",
      url: `${EVENTS_URL}/events/acknowledgment`,
      data: lote,
      headers: { "Content-Type": "application/json" },
    });
  }
  return { reconhecidos: ids.length };
}

async function obterPedido(configuracao, orderId) {
  const response = await requisicao(configuracao, {
    method: "GET",
    url: `${ORDER_URL}/orders/${orderId}`,
  });
  return response.data;
}

async function acaoPedido(configuracao, orderId, acao, data) {
  const response = await requisicao(configuracao, {
    method: "POST",
    url: `${ORDER_URL}/orders/${orderId}/${acao}`,
    ...(data ? { data } : {}),
    headers: { "Content-Type": "application/json" },
    validateStatus: (status) => status === 200 || status === 202 || status === 204,
  });
  return response.data || { status: "ACCEPTED" };
}

async function motivosCancelamento(configuracao, orderId) {
  const response = await requisicao(configuracao, {
    method: "GET",
    url: `${ORDER_URL}/orders/${orderId}/cancellationReasons`,
  });
  return response.data;
}

async function solicitarCancelamento(configuracao, orderId, reason) {
  return acaoPedido(configuracao, orderId, "requestCancellation", { reason: String(reason) });
}

module.exports = {
  obterConfiguracaoCompleta,
  obterToken,
  listarMerchants,
  obterStatus,
  testarConexao,
  pollingEventos,
  reconhecerEventos,
  obterPedido,
  requisicao,
  acaoPedido,
  motivosCancelamento,
  solicitarCancelamento,
};
