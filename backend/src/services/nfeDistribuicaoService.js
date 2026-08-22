const zlib = require("zlib");

const Empresa = require("../models/empresa");

const {
  enviarMensagemSefaz,
  somenteNumeros,
  extrairTag,
  extrairTodosBlocos,
} = require("./soapService");

const URL_DISTRIBUICAO =
  process.env.NFE_URL_DISTRIBUICAO ||
  "https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx";

const NAMESPACE_DISTRIBUICAO =
  "http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe";

const NAMESPACE_NFE =
  "http://www.portalfiscal.inf.br/nfe";

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

  const resposta =
    await enviarMensagemSefaz({
      url: URL_DISTRIBUICAO,

      namespaceWsdl:
        NAMESPACE_DISTRIBUICAO,

      xmlMensagem,

      nomeServico:
        "Distribuição de NF-e",

      timeout: 60000,
    });

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

module.exports = {
  buscarNfePorChave,
};