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

const NfeRecebida = require("../models/nferecebida");

const {
  montarXmlManifestacaoDestinatario,
  enviarManifestacaoDestinatario,
} = require("./sefazNfeEventoService");


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

function montarConsultaPorNsuEspecifico({
  cnpj,
  nsu,
}) {
  return `
<distDFeInt
  xmlns="${NAMESPACE_NFE}"
  versao="1.01"
>
  <tpAmb>1</tpAmb>
  <cUFAutor>41</cUFAutor>
  <CNPJ>${cnpj}</CNPJ>

  <consNSU>
    <NSU>${String(nsu).padStart(15, "0")}</NSU>
  </consNSU>
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

function interpretarDocumentoDistribuicao(documento) {
  const schema = String(documento?.schema || "");
  const xml = String(documento?.xml || "");

  let tipoDocumento = "desconhecido";

  if (/resNFe/i.test(schema) || /<resNFe[\s>]/i.test(xml)) {
    tipoDocumento = "resumo_nfe";
  } else if (
    /procNFe|nfeProc/i.test(schema) ||
    /<nfeProc[\s>]/i.test(xml)
  ) {
    tipoDocumento = "nfe_completa";
  } else if (
    /evento|procEventoNFe|resEvento/i.test(schema) ||
    /<procEventoNFe[\s>]|<resEvento[\s>]/i.test(xml)
  ) {
    tipoDocumento = "evento";
  }

  const chaveAcesso =
    somenteNumeros(
      extrairTag(xml, "chNFe") ||
        String(
          xml.match(/Id=["']NFe(\d{44})["']/i)?.[1] ||
            ""
        )
    );

  const emitenteDocumento =
    somenteNumeros(
      extrairTag(xml, "CNPJ") ||
        extrairTag(xml, "CPF") ||
        ""
    );

  const emitenteNome =
    extrairTag(xml, "xNome") || "";

  const dhEmi =
    extrairTag(xml, "dhEmi") ||
    extrairTag(xml, "dEmi") ||
    "";

  let dataEmissao = null;

  if (dhEmi) {
    const data = new Date(dhEmi);

    if (!Number.isNaN(data.getTime())) {
      dataEmissao = data;
    }
  }

  const valorNfe =
    Number(
      extrairTag(xml, "vNF") ||
        extrairTag(xml, "vNFe") ||
        0
    ) || 0;

  const situacaoNfe =
    extrairTag(xml, "cSitNFe") ||
    extrairTag(xml, "xMotivo") ||
    "";

  let statusDistribuicao = "erro";

  if (tipoDocumento === "resumo_nfe") {
    statusDistribuicao = "resumo_recebido";
  }

  if (tipoDocumento === "nfe_completa") {
    statusDistribuicao = "xml_recebido";
  }

  if (tipoDocumento === "evento") {
    statusDistribuicao = "evento_recebido";
  }

  return {
    tipoDocumento,
    chaveAcesso:
      chaveAcesso.length === 44
        ? chaveAcesso
        : "",
    emitenteNome,
    emitenteDocumento,
    dataEmissao,
    valorNfe,
    situacaoNfe,
    statusDistribuicao,
  };
}

async function persistirDocumentosDistribuicao({
  empresa,
  documentos,
}) {
  const agora = new Date();

  for (const documento of documentos || []) {
    const nsu = String(
      documento?.nsu || ""
    ).trim();

    if (!nsu) {
      continue;
    }

    const interpretado =
      interpretarDocumentoDistribuicao(
        documento
      );

    const chave =
      String(
        interpretado.chaveAcesso || ""
      ).trim();

    /*
     * Por enquanto os eventos distribuídos não
     * criam uma segunda NF-e na caixa de entrada.
     *
     * Quando houver chave, apenas vinculamos o
     * novo NSU ao registro da NF-e já existente.
     */
    if (
      interpretado.tipoDocumento ===
      "evento"
    ) {
      if (chave) {
        await NfeRecebida.updateOne(
          {
            empresa: empresa._id,
            chaveAcesso: chave,
          },
          {
            $addToSet: {
              nsus: nsu,
            },

            $set: {
              ultimaSincronizacao:
                agora,
            },
          }
        );
      }

      continue;
    }

    let existente = null;

    /*
     * Prioridade:
     * 1. mesma empresa + mesma chave;
     * 2. mesma empresa + mesmo NSU.
     *
     * Assim, um procNFe recebido com outro NSU
     * atualiza a NF-e já existente.
     */
    if (chave) {
      existente =
        await NfeRecebida.findOne({
          empresa: empresa._id,
          chaveAcesso: chave,
        });
    }

    if (!existente) {
      existente =
        await NfeRecebida.findOne({
          empresa: empresa._id,
          nsu,
        });
    }

    const atualizacao = {
      $set: {
        schema:
          String(
            documento.schema || ""
          ).trim(),

        ultimaSincronizacao:
          agora,
      },

      $addToSet: {
        nsus: nsu,
      },
    };

    if (chave) {
      atualizacao.$set.chaveAcesso =
        chave;
    }

    /*
     * NF-e completa tem prioridade sobre resumo.
     */
    if (
      interpretado.tipoDocumento ===
      "nfe_completa"
    ) {
      atualizacao.$set.tipoDocumento =
        "nfe_completa";

      atualizacao.$set.statusDistribuicao =
        "xml_recebido";

      atualizacao.$set.xmlCompleto =
        documento.xml || "";

      if (interpretado.emitenteNome) {
        atualizacao.$set.emitenteNome =
          interpretado.emitenteNome;
      }

      if (interpretado.emitenteDocumento) {
        atualizacao.$set.emitenteDocumento =
          interpretado.emitenteDocumento;
      }

      if (interpretado.dataEmissao) {
        atualizacao.$set.dataEmissao =
          interpretado.dataEmissao;
      }

      if (
        interpretado.valorNfe !==
        undefined
      ) {
        atualizacao.$set.valorNfe =
          interpretado.valorNfe;
      }

      if (interpretado.situacaoNfe) {
        atualizacao.$set.situacaoNfe =
          interpretado.situacaoNfe;
      }
    } else {
      /*
       * Se o XML completo já existe,
       * um resNFe posterior não pode
       * voltar o status para resumo.
       */
      if (
        !existente ||
        !existente.xmlCompleto
      ) {
        atualizacao.$set.tipoDocumento =
          interpretado.tipoDocumento;

        atualizacao.$set.statusDistribuicao =
          interpretado.statusDistribuicao;
      }

      atualizacao.$set.resumoXml =
        documento.xml || "";

      if (interpretado.emitenteNome) {
        atualizacao.$set.emitenteNome =
          interpretado.emitenteNome;
      }

      if (interpretado.emitenteDocumento) {
        atualizacao.$set.emitenteDocumento =
          interpretado.emitenteDocumento;
      }

      if (interpretado.dataEmissao) {
        atualizacao.$set.dataEmissao =
          interpretado.dataEmissao;
      }

      if (
        interpretado.valorNfe !==
        undefined
      ) {
        atualizacao.$set.valorNfe =
          interpretado.valorNfe;
      }

      if (interpretado.situacaoNfe) {
        atualizacao.$set.situacaoNfe =
          interpretado.situacaoNfe;
      }
    }

    if (existente) {
      /*
       * Registros antigos foram criados antes
       * da existência do campo nsus[].
       * Incluímos também o NSU original.
       */
      if (existente.nsu) {
        atualizacao.$addToSet.nsus = {
          $each: [
            String(existente.nsu),
            nsu,
          ],
        };
      }

      await NfeRecebida.updateOne(
        {
          _id: existente._id,
        },
        atualizacao
      );

      continue;
    }

    /*
     * Primeira aparição da NF-e.
     */
    atualizacao.$setOnInsert = {
      empresa: empresa._id,
      nsu,

      primeiraSincronizacao:
        agora,

      statusManifestacao:
        "nao_manifestada",

      importada:
        false,
    };

    await NfeRecebida.updateOne(
      {
        empresa: empresa._id,
        nsu,
      },
      atualizacao,
      {
        upsert: true,
      }
    );
  }
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

  if (documentos.length > 0) {
    await persistirDocumentosDistribuicao({
      empresa,
      documentos,
    });
  }

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

async function buscarDocumentoPorNsu(
  nsuInformado
) {
  const {
    empresa,
    cnpj,
  } = await obterEmpresaFiscal();

  const nsu =
    String(
      nsuInformado || ""
    )
      .replace(/\D/g, "")
      .padStart(15, "0");

  if (!/^\d{15}$/.test(nsu)) {
    throw new Error(
      "NSU inválido."
    );
  }

  const xmlMensagem =
    montarConsultaPorNsuEspecifico({
      cnpj,
      nsu,
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
          return (
            status >= 200 &&
            status < 500
          );
        },
      }
    );
  } catch (error) {
    throw new Error(
      `Consulta por NSU: ${
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
      `Consulta por NSU retornou HTTP ${response.status}.`
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

  const documentos =
    extrairDocumentosDistribuicao(
      xmlRetorno
    );

  /*
   * Persiste antes de devolver
   * o resultado ao chamador.
   *
   * Esta consulta pontual NÃO altera
   * ultimoNsuDistribuicao.
   */
  await persistirDocumentosDistribuicao({
    empresa,
    documentos,
  });

  return {
    success: true,
    cStat,
    xMotivo,
    nsu,
    documentos,
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

    await persistirDocumentosDistribuicao({
  empresa,
  documentos,
});

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

async function prepararManifestacaoNfeRecebida({
  nfeRecebidaId,
  tipoEvento,
  justificativa = "",
  ambiente = "producao",
}) {
  const {
    empresa,
    cnpj,
  } = await obterEmpresaFiscal();

  const nfeRecebida =
    await NfeRecebida.findOne({
      _id: nfeRecebidaId,
      empresa: empresa._id,
    });

  if (!nfeRecebida) {
    throw new Error(
      "NF-e recebida não encontrada para esta empresa."
    );
  }

  const chave =
    validarChave(
      nfeRecebida.chaveAcesso
    );

  const xmlEvento =
    montarXmlManifestacaoDestinatario({
      chaveAcesso: chave,
      cnpjDestinatario: cnpj,
      tipoEvento,
      ambiente,
      justificativa,
      sequenciaEvento: 1,
      dataEvento: new Date(),
    });

  return {
    nfeRecebidaId:
      String(nfeRecebida._id),

    empresaId:
      String(empresa._id),

    cnpjDestinatario:
      cnpj,

    chaveAcesso:
      chave,

    tipoEvento:
      String(tipoEvento),

    ambiente,

    xmlEvento,
  };
}

async function manifestarNfeRecebida({
  nfeRecebidaId,
  tipoEvento,
  justificativa = "",
  ambiente = "producao",
}) {
  const {
    empresa,
    cnpj,
  } = await obterEmpresaFiscal();

  const nfeRecebida =
    await NfeRecebida.findOne({
      _id: nfeRecebidaId,
      empresa: empresa._id,
    });

  if (!nfeRecebida) {
    throw new Error(
      "NF-e recebida não encontrada para esta empresa."
    );
  }

  const chave =
    validarChave(
      nfeRecebida.chaveAcesso
    );

  const retorno =
    await enviarManifestacaoDestinatario({
      chaveAcesso: chave,
      cnpjDestinatario: cnpj,
      tipoEvento,
      ambiente,
      justificativa,
      sequenciaEvento: 1,
      dataEvento: new Date(),
    });

  const cStat =
    String(
      retorno.cStatEvento ||
      retorno.cStat ||
      ""
    );

  const statusPorEvento = {
    "210200": "confirmacao_operacao",
    "210210": "ciencia_operacao",
    "210220": "desconhecimento_operacao",
    "210240": "operacao_nao_realizada",
  };

  const statusManifestacao =
    statusPorEvento[
      String(tipoEvento)
    ];

  const eventoAceito =
    cStat === "135" ||
    cStat === "136";

  if (eventoAceito && statusManifestacao) {
    nfeRecebida.statusManifestacao =
      statusManifestacao;

    nfeRecebida.protocoloManifestacao =
      retorno.protocoloEvento || "";

    nfeRecebida.dataManifestacao =
      retorno.dataRegistro
        ? new Date(retorno.dataRegistro)
        : new Date();

    nfeRecebida.ultimaSincronizacao =
      new Date();

    await nfeRecebida.save();
  }

  return {
    success: eventoAceito,

    cStat,
    xMotivo:
      retorno.xMotivoEvento ||
      retorno.xMotivo ||
      "",

    protocolo:
      retorno.protocoloEvento ||
      "",

    dataRegistro:
      retorno.dataRegistro ||
      "",

    chaveAcesso:
      chave,

    tipoEvento:
      String(tipoEvento),

    statusManifestacao:
      eventoAceito
        ? statusManifestacao
        : nfeRecebida.statusManifestacao,

    xmlEvento:
      retorno.xmlEvento,

    xmlEventoAssinado:
      retorno.xmlEventoAssinado,

    xmlRetorno:
      retorno.xmlRetorno,
  };
}

module.exports = {
  buscarNfePorChave,
  buscarDocumentosPorNsu,
  buscarDocumentoPorNsu,
  prepararManifestacaoNfeRecebida,
  manifestarNfeRecebida,
};