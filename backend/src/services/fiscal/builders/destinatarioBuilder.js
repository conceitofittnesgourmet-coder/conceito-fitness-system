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
  const cpfNormalizado =
    somenteNumeros(cpf || "");

  /*
   * Venda comum sem CPF e sem endereço:
   * pode omitir o destinatário.
   *
   * Delivery:
   * o destinatário continua sendo enviado
   * por causa do endereço, mesmo sem CPF.
   */
  if (
    cpfNormalizado.length !== 11 &&
    !endereco
  ) {
    return "";
  }

  const nomeDestinatario =
    ambiente !== "producao"
      ? "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL"
      : textoFiscal(
          nome,
          "CONSUMIDOR"
        );

  const nomeXml = nomeDestinatario
    ? `<xNome>${escapeXml(
        nomeDestinatario
      )}</xNome>`
    : "";

  const cpfXml =
    cpfNormalizado.length === 11
      ? `<CPF>${cpfNormalizado}</CPF>`
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
    ${cpfXml}
    ${nomeXml}
    ${enderecoXml}
    <indIEDest>9</indIEDest>
  </dest>`;
}

module.exports = {
  montarXmlDestinatarioNfce,
};