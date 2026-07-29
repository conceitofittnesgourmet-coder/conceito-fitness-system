// Adaptador para o serviço SEFAZ já usado pela NFC-e.
// O webservice de autorização da NF-e 4.00 recebe XML do modelo 55 ou 65.
// Mantemos este arquivo separado para não espalhar nomes de NFC-e pelo módulo de NF-e.
const {
  transmitirNfceParaSefaz,
  consultarReciboSefaz,
} = require("./sefazPrService");

async function transmitirNfeParaSefaz(xmlAssinado, idLote) {
  return transmitirNfceParaSefaz(xmlAssinado, idLote);
}

async function consultarReciboNfe(recibo) {
  return consultarReciboSefaz(recibo);
}

module.exports = {
  transmitirNfeParaSefaz,
  consultarReciboNfe,
};
