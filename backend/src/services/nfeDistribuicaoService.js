const zlib = require("zlib");

const Empresa = require("../models/empresa");

const axios = require("axios");

const {
  criarHttpsAgent,
  somenteNumeros,
  extrairTag,
  extrairTodosBlocos,
} = require("./soapService");

const URL_DISTRIBUICAO =
  process.env.NFE_URL_DISTRIBUICAO ||
  "https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx";

const NAMESPACE_DISTRIBUICAO =
  "http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe";

const SOAP_ACTION_DISTRIBUICAO =
  "http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe/nfeDistDFeInteresse";

const NAMESPACE_NFE =
  "http://www.portalfiscal.inf.br/nfe";

const ConfiguracaoFiscal = require("../models/configuracaofiscal");

function validarChave(chave) {
  const valor = somenteNumeros(chave);

  if (valor.length !== 44) {
    throw new Error(
      "A chave de acesso da NF-e deve possuir exatamente 44 dígitos."
    );
  }

  return valor;
}

async function obterEmpresaFiscal() {
  const empresa = await Empresa.findOne();

  if (!empresa) {
    throw new Error(
      "Cadastro da empresa não encontrado."
    );
  }

  const cnpj = somenteNumeros(empresa.cnpj);

  if (cnpj.length !== 14) {
    throw new Error(
      "O CNPJ da empresa não está configurado corretamente."
    );
  }

  return {
    empresa,
    cnpj,
  };
}

function montarConsultaPorChave({
  cnpj,
  chave,
}) {
  return `
<distDFeInt
  xmlns="${NAMESPACE_NFE}"
  versao="1.01"
>
  <tpAmb>1</tpAmb>
  <cUFAutor>41</cUFAutor>
  <CNPJ>${cnpj}</CNPJ>

  <consChNFe>
    <chNFe>${chave}</chNFe>
  </consChNFe>
</distDFeInt>
  `.trim();
}

function montarConsultaPorNsu({
  cnpj,
  ultimoNsu,
}) {
  return `
<distDFeInt
  xmlns="${NAMESPACE_NFE}"
  versao="1.01"
>
  <tpAmb>1</tpAmb>
  <cUFAutor>41</cUFAutor>
  <CNPJ>${cnpj}</CNPJ>

  <distNSU>
    <ultNSU>${ultimoNsu}</ultNSU>
  </distNSU>
</distDFeInt>
  `.trim();
}

function montarEnvelopeDistribuicao(xmlMensagem) {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<soap12:Envelope ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
    'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ' +
    'xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
    "<soap12:Body>" +
    `<nfeDistDFeInteresse xmlns="${NAMESPACE_DISTRIBUICAO}">` +
    `<nfeDadosMsg xmlns="${NAMESPACE_DISTRIBUICAO}">` +
    xmlMensagem +
    "</nfeDadosMsg>" +
    "</nfeDistDFeInteresse>" +
    "</soap12:Body>" +
    "</soap12:Envelope>"
  );
}

function descompactarDocZip(base64) {
  const conteudo = Buffer.from(
    String(base64 || "").trim(),
    "base64"
  );

  if (!conteudo.length) {
    return "";
  }

  try {
    return zlib.gunzipSync(conteudo)
      .toString("utf8");
  } catch (errorGunzip) {
    try {
      return zlib.inflateSync(conteudo)
        .toString("utf8");
    } catch (errorInflate) {
      throw new Error(
        "Não foi possível descompactar o XML retornado pela SEFAZ."
      );
    }
  }
}

function extrairDocumentosDistribuicao(xml = "") {
  const blocos = extrairTodosBlocos(
    xml,
    "docZip"
  );

  return blocos.map((bloco) => {
    const schema =
      String(
        bloco.match(/schema="([^"]+)"/i)?.[1] ||
        ""
      ).trim();

    const nsu =
      String(
        bloco.match(/NSU="([^"]+)"/i)?.[1] ||
        ""
      ).trim();

    const conteudoBase64 =
      String(
        bloco
          .replace(/^<docZip[^>]*>/i, "")
          .replace(/<\/docZip>$/i, "")
      ).trim();

    let xmlDocumento = "";

    if (conteudoBase64) {
      xmlDocumento =
        descompactarDocZip(
          conteudoBase64
        );
    }

    return {
      nsu,
      schema,
      xml: xmlDocumento,
    };
  });
}

async function buscarNfePorChave(chaveInformada) {
  const chave =
    validarChave(chaveInformada);

  const {
    empresa,
    cnpj,
  } = await obterEmpresaFiscal();

  const xmlMensagem =
    montarConsultaPorChave({
      cnpj,
      chave,
    });

  const envelope =
  montarEnvelopeDistribuicao(
    xmlMensagem
  );

const httpsAgent =
  criarHttpsAgent();

let response;

try {
  response = await axios.post(
    URL_DISTRIBUICAO,
    envelope,
    {
      httpsAgent,

      timeout: 60000,

      responseType: "text",

      transformResponse: [
        (data) => data,
      ],

      maxContentLength: Infinity,
      maxBodyLength: Infinity,

      headers: {
        "Content-Type":
          `application/soap+xml; charset=utf-8; action="${SOAP_ACTION_DISTRIBUICAO}"`,

        Accept:
          "application/soap+xml, application/xml, text/xml, */*",

        "User-Agent":
          "Conceito-Fitness-Gourmet-NFe/1.0",
      },

      validateStatus(status) {
        return status >= 200 &&
          status < 500;
      },
    }
  );
} catch (error) {
  throw new Error(
    `Distribuição de NF-e: ${
      error?.message ||
      "falha na comunicação com o Ambiente Nacional."
    }`
  );
}

const xmlSoap =
  String(response.data || "");

if (
  response.status < 200 ||
  response.status >= 300
) {
  const motivo =
    extrairTag(
      xmlSoap,
      "faultstring"
    ) ||
    extrairTag(
      xmlSoap,
      "Text"
    ) ||
    extrairTag(
      xmlSoap,
      "xMotivo"
    );

  throw new Error(
    `Distribuição de NF-e retornou HTTP ${response.status}` +
      `${motivo ? ` — ${motivo}` : "."}`
  );
}

const resposta = {
  xmlSoap,
  xmlConteudo: xmlSoap,
};

  const xmlRetorno =
    String(
      resposta.xmlConteudo ||
      resposta.xmlSoap ||
      ""
    );

  const cStat =
    extrairTag(xmlRetorno, "cStat") ||
    "";

  const xMotivo =
    extrairTag(xmlRetorno, "xMotivo") ||
    "";

  const documentos =
    extrairDocumentosDistribuicao(
      xmlRetorno
    );

  const nfeCompleta =
    documentos.find((doc) =>
      /procNFe|nfeProc/i.test(
        doc.schema || doc.xml
      )
    );

  const resumo =
    documentos.find((doc) =>
      /resNFe/i.test(
        doc.schema || doc.xml
      )
    );

  return {
    success: true,

    chave,

    cnpjEmpresa: cnpj,

    empresa:
      empresa.nomeFantasia ||
      empresa.razaoSocial ||
      "",

    cStat,

    xMotivo,

    encontrouXml:
      Boolean(nfeCompleta?.xml),

    encontrouResumo:
      Boolean(resumo?.xml),

    xml:
      nfeCompleta?.xml || "",

    resumoXml:
      resumo?.xml || "",

    documentos: documentos.map(
      (doc) => ({
        nsu: doc.nsu,
        schema: doc.schema,
      })
    ),
  };
}

async function buscarDocumentosPorNsu() {
  const {
    empresa,
    cnpj,
  } = await obterEmpresaFiscal();

  let configuracao =
    await ConfiguracaoFiscal.findOne({
      empresa: empresa._id,
    });

  if (!configuracao) {
    configuracao =
      await ConfiguracaoFiscal.create({
        empresa: empresa._id,
      });
  }

  const ultimoNsu =
    String(
      configuracao.ultimoNsuDistribuicao ||
      "000000000000000"
    ).padStart(15, "0");

  const xmlMensagem =
    montarConsultaPorNsu({
      cnpj,
      ultimoNsu,
    });

  const envelope =
    montarEnvelopeDistribuicao(
      xmlMensagem
    );

  const httpsAgent =
    criarHttpsAgent();

  let response;

  try {
    response = await axios.post(
      URL_DISTRIBUICAO,
      envelope,
      {
        httpsAgent,
        timeout: 60000,
        responseType: "text",

        transformResponse: [
          (data) => data,
        ],

        maxContentLength: Infinity,
        maxBodyLength: Infinity,

        headers: {
          "Content-Type":
            `application/soap+xml; charset=utf-8; action="${SOAP_ACTION_DISTRIBUICAO}"`,

          Accept:
            "application/soap+xml, application/xml, text/xml, */*",

          "User-Agent":
            "Conceito-Fitness-Gourmet-NFe/1.0",
        },

        validateStatus(status) {
          return status >= 200 &&
            status < 500;
        },
      }
    );
  } catch (error) {
    throw new Error(
      `Distribuição de NF-e: ${
        error?.message ||
        "falha na comunicação com o Ambiente Nacional."
      }`
    );
  }

  const xmlRetorno =
    String(response.data || "");

  if (
    response.status < 200 ||
    response.status >= 300
  ) {
    throw new Error(
      `Distribuição de NF-e retornou HTTP ${response.status}.`
    );
  }

  const cStat =
    extrairTag(
      xmlRetorno,
      "cStat"
    ) || "";

  const xMotivo =
    extrairTag(
      xmlRetorno,
      "xMotivo"
    ) || "";

  const ultNSU =
    extrairTag(
      xmlRetorno,
      "ultNSU"
    ) || ultimoNsu;

  const maxNSU =
    extrairTag(
      xmlRetorno,
      "maxNSU"
    ) || "";

  const documentos =
    extrairDocumentosDistribuicao(
      xmlRetorno
    );

  configuracao.ultimoNsuDistribuicao =
    ultNSU;

  configuracao.maxNsuDistribuicao =
    maxNSU;

  configuracao.ultimaConsultaDistribuicao =
    new Date();

  await configuracao.save();

  return {
    success: true,
    cStat,
    xMotivo,
    ultNSU,
    maxNSU,
    documentos,
  };
}

module.exports = {
  buscarNfePorChave,
  buscarDocumentosPorNsu,
};