const mongoose = require("mongoose");

const ifoodAuditoriaSchema = new mongoose.Schema(
  {
    merchantId: { type: String, default: "", index: true },
    catalogId: { type: String, default: "" },
    origem: { type: String, enum: ["manual", "automatica"], default: "manual" },
    status: { type: String, enum: ["ok", "atencao", "critico", "erro"], default: "ok", index: true },
    iniciadaEm: { type: Date, default: Date.now },
    concluidaEm: { type: Date, default: null },
    duracaoMs: { type: Number, default: 0 },
    resumo: {
      type: {
        configuracao: { type: Number, default: 0 },
        eventos: { type: Number, default: 0 },
        pedidos: { type: Number, default: 0 },
        catalogo: { type: Number, default: 0 },
        criticos: { type: Number, default: 0 },
        avisos: { type: Number, default: 0 },
        informativos: { type: Number, default: 0 },
      },
      default: {},
    },
    metricas: { type: mongoose.Schema.Types.Mixed, default: {} },
    problemas: {
      type: [
        {
          codigo: String,
          severidade: { type: String, enum: ["critico", "aviso", "info"], default: "aviso" },
          modulo: String,
          titulo: String,
          descricao: String,
          referencia: String,
          acaoSugerida: String,
          corrigivelAutomaticamente: { type: Boolean, default: false },
          dados: mongoose.Schema.Types.Mixed,
        },
      ],
      default: [],
    },
    correcoes: {
      type: [
        {
          codigo: String,
          referencia: String,
          executadaEm: Date,
          sucesso: Boolean,
          mensagem: String,
        },
      ],
      default: [],
    },
    erroExecucao: { type: String, default: "" },
  },
  { timestamps: true }
);

ifoodAuditoriaSchema.index({ merchantId: 1, createdAt: -1 });

module.exports =
  mongoose.models.IfoodAuditoria || mongoose.model("IfoodAuditoria", ifoodAuditoriaSchema);
