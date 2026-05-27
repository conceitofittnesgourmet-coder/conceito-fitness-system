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
const produtoRoutes = require("./routes/produtoroutes");
const pedidoRoutes = require("./routes/pedidoroutes");
const dashboardRoutes = require("./routes/dashboardroutes");
const analyticsRoutes = require("./routes/analyticsroutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const pagamentoRoutes = require("./routes/pagamentoRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const masterRoutes = require("./routes/masterRoutes");

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ],
    credentials: true,
  })
);

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
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/pagamento", pagamentoRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/master", masterRoutes);

app.use(errorHandler);

module.exports = app;