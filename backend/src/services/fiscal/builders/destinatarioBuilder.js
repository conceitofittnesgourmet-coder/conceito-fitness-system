const {
  somenteNumeros,
  escapeXml,
  textoFiscal,
} = require("../documentoFiscalUtils");

function montarXmlDestinatarioNfce({
  cpf,
  nome,
  ambiente,
  endereco = null,
}) {
  const documento =
    somenteNumeros(cpf || "");

  const cpfValido =
    documento.length === 11;

  const cnpjValido =
    documento.length === 14;

  /*
   * Se não houver identificação e também
   * não for delivery, a NFC-e comum pode
   * omitir completamente o destinatário.
   */
  if (
    !cpfValido &&
    !cnpjValido &&
    !endereco
  ) {
    return "";
  }

  /*
   * Delivery (indPres=4) exige identificação
   * do destinatário.
   */
  if (
    endereco &&
    !cpfValido &&
    !cnpjValido
  ) {
    throw new Error(
      "Para NFC-e com entrega em domicílio é necessário informar CPF ou CNPJ do destinatário."
    );
  }

  const identificacaoXml =
    cpfValido
      ? `<CPF>${documento}</CPF>`
      : `<CNPJ>${documento}</CNPJ>`;

  const nomeDestinatario =
    ambiente !== "producao"
      ? "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL"
      : textoFiscal(
          nome,
          "CONSUMIDOR"
        );

  const nomeXml =
    nomeDestinatario
      ? `<xNome>${escapeXml(
          nomeDestinatario
        )}</xNome>`
      : "";

  let enderecoXml = "";

  if (endereco) {
    const logradouro =
      textoFiscal(
        endereco.logradouro,
        ""
      );

    const numero =
      textoFiscal(
        endereco.numero || "SN",
        "SN"
      );

    const bairro =
      textoFiscal(
        endereco.bairro,
        ""
      );

    const codigoMunicipio =
      somenteNumeros(
        endereco.codigoMunicipio || ""
      );

    const municipio =
      textoFiscal(
        endereco.municipio ||
          "UMUARAMA",
        "UMUARAMA"
      );

    const uf =
      String(
        endereco.uf || "PR"
      )
        .trim()
        .toUpperCase();

    const cep =
      somenteNumeros(
        endereco.cep || ""
      );

    const complemento =
      textoFiscal(
        endereco.complemento || "",
        ""
      );

    if (!logradouro) {
      throw new Error(
        "Endereço de entrega é obrigatório para NFC-e delivery."
      );
    }

    if (!bairro) {
      throw new Error(
        "Bairro de entrega é obrigatório para NFC-e delivery."
      );
    }

    if (
      codigoMunicipio.length !== 7
    ) {
      throw new Error(
        "Código do município de entrega inválido."
      );
    }

    const complementoXml =
      complemento
        ? `<xCpl>${escapeXml(
            complemento
          )}</xCpl>`
        : "";

    const cepXml =
      cep.length === 8
        ? `<CEP>${cep}</CEP>`
        : "";

    enderecoXml = `
      <enderDest>
        <xLgr>${escapeXml(
          logradouro
        )}</xLgr>
        <nro>${escapeXml(
          numero
        )}</nro>
        ${complementoXml}
        <xBairro>${escapeXml(
          bairro
        )}</xBairro>
        <cMun>${codigoMunicipio}</cMun>
        <xMun>${escapeXml(
          municipio
        )}</xMun>
        <UF>${escapeXml(
          uf
        )}</UF>
        ${cepXml}
        <cPais>1058</cPais>
        <xPais>BRASIL</xPais>
      </enderDest>`;
  }

  return `<dest>
    ${identificacaoXml}
    ${nomeXml}
    ${enderecoXml}
    <indIEDest>9</indIEDest>
  </dest>`;
}

module.exports = {
  montarXmlDestinatarioNfce,
};