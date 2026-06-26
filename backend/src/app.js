const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");

const loggerMiddleware = require("./middlewares/loggermiddleware");
const errorHandler = require("./middlewares/errorhandler");

const authRoutes = require("./routes/authRoutes");
const produtoRoutes = require("./routes/produtoRoutes");
const pedidoRoutes = require("./routes/pedidoRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const pagamentoRoutes = require("./routes/pagamentoRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const masterRoutes = require("./routes/masterRoutes");
const empresaRoutes = require("./routes/empresaRoutes");
const caixaRoutes = require("./routes/caixaRoutes");
const clienteRoutes = require("./routes/clienteRoutes");
const freteRoutes = require("./routes/freteRoutes");
const financeiroRoutes = require("./routes/financeiroRoutes");
const producaoRoutes = require("./routes/producaoRoutes");
const comprasRoutes = require("./routes/comprasRoutes");
const relatoriosRoutes = require("./routes/relatoriosRoutes");
const fiscalRoutes = require("./routes/fiscalRoutes");
const configuracaoFiscalRoutes = require("./routes/configuracaofiscalRoutes");
const nfceRoutes = require("./routes/nfceRoutes");
const categoriaRoutes = require("./routes/categoriaRoutes");
const grupoComponenteRoutes = require("./routes/grupoComponenteRoutes");
const opcaoComponenteRoutes = require("./routes/opcaoComponenteRoutes");

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

const allowedOrigins = [
  "https://conceito-fitness-system-7c2o.vercel.app",
  "http://localhost:5173",
  "https://conceitofitgourmet.com.br",
  "https://www.conceitofitgourmet.com.br",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Não permitido pelo CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(compression());

app.use(
  express.json({
    limit: "50mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
  })
);

app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
  })
);

app.use(loggerMiddleware);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 API CONCEITO FITNESS GOURMET ONLINE",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/produtos", produtoRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/pagamento", pagamentoRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/empresa", empresaRoutes);
app.use("/api/caixa", caixaRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/frete", freteRoutes);
app.use("/api/financeiro", financeiroRoutes);
app.use("/api/producao", producaoRoutes);
app.use("/api/compras", comprasRoutes);
app.use("/api/relatorios", relatoriosRoutes);
app.use("/api/fiscal", fiscalRoutes);
app.use("/api/fiscal-config", configuracaoFiscalRoutes);
app.use("/api/nfce", nfceRoutes);
app.use("/api/grupos-componentes", grupoComponenteRoutes);
app.use("/api/opcoes-componentes", opcaoComponenteRoutes);
app.use(errorHandler);

module.exports = app;