const mongoose = require("mongoose");

const ifoodPedidoSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    displayId: { type: String, default: "", index: true },
    merchantId: { type: String, default: "", index: true },
    status: { type: String, default: "PLACED", index: true },
    orderType: { type: String, default: "" },
    orderTiming: { type: String, default: "" },
    category: { type: String, default: "FOOD" },
    criadoNoIfoodEm: { type: Date, default: null },
    preparacaoRecomendadaEm: { type: Date, default: null },
    agendadoPara: { type: Date, default: null },
    pedidoErp: { type: mongoose.Schema.Types.ObjectId, ref: "Pedido", default: null, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    importadoEm: { type: Date, default: null },
    atualizadoNoIfoodEm: { type: Date, default: null },
    statusSolicitado: { type: String, default: "" },
    ultimoComando: { type: String, default: "" },
    ultimoComandoEm: { type: Date, default: null },
    ultimoComandoOk: { type: Boolean, default: null },
    ultimoComandoErro: { type: String, default: "" },
    motivoCancelamentoSolicitado: { type: String, default: "" },
    historicoComandos: {
      type: [
        {
          acao: String,
          statusAntes: String,
          solicitadoEm: Date,
          aceito: Boolean,
          resposta: mongoose.Schema.Types.Mixed,
          erro: String,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.IfoodPedido || mongoose.model("IfoodPedido", ifoodPedidoSchema);
