const mongoose = require("mongoose");

const ifoodConfiguracaoSchema = new mongoose.Schema(
  {
    nome: { type: String, default: "Integração principal", trim: true },
    ambiente: { type: String, enum: ["producao"], default: "producao" },
    clientId: { type: String, default: "", trim: true },
    clientSecretCriptografado: { type: String, default: "", select: false },
    merchantId: { type: String, default: "", trim: true, index: true },
    merchantNome: { type: String, default: "", trim: true },
    catalogId: { type: String, default: "", trim: true },
    ativa: { type: Boolean, default: false },
    pollingAtivo: { type: Boolean, default: false },
    intervaloPollingSegundos: { type: Number, default: 30, min: 30, max: 300 },
    sincronizarPedidos: { type: Boolean, default: true },
    sincronizarCatalogo: { type: Boolean, default: false },
    sincronizarDisponibilidade: { type: Boolean, default: false },
    ultimoTesteEm: { type: Date, default: null },
    ultimoTesteOk: { type: Boolean, default: false },
    ultimoErro: { type: String, default: "" },
    ultimoStatusLoja: { type: String, default: "" },
    tokenExpiraEm: { type: Date, default: null },
    ultimoPollingEm: { type: Date, default: null },
    ultimoPollingOk: { type: Boolean, default: false },
    ultimoPollingErro: { type: String, default: "" },
    ultimoEventoEm: { type: Date, default: null },
    eventosRecebidos: { type: Number, default: 0 },
    eventosProcessados: { type: Number, default: 0 },
    pedidosImportados: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.IfoodConfiguracao ||
  mongoose.model("IfoodConfiguracao", ifoodConfiguracaoSchema);
