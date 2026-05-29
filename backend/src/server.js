require("dotenv").config();

const http =
  require("http");

const { Server } =
  require("socket.io");

const app =
  require("./app");

const connectDB =
  require("./config/db");





// ==========================================
// DATABASE
// ==========================================

connectDB();





// ==========================================
// SERVER
// ==========================================

const server =
  http.createServer(app);





// ==========================================
// SOCKET.IO
// ==========================================

const io = new Server(server, {
  cors: {
    origin: [
      "https://conceito-fitness-system-7c2o.vercel.app",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

global.io = io;
app.set("io", io);




io.on(
  "connection",
  (socket) => {

    console.log(
      "⚡ CLIENTE CONECTADO:",
      socket.id
    );





    socket.on(
      "disconnect",
      () => {

        console.log(
          "❌ CLIENTE DESCONECTADO"
        );

      }
    );

  }
);





// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

server.on("error", (error) => {
  console.error("🔥 ERRO NO SERVIDOR:", error);
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);

    console.log(`
========================================
🚀 SERVIDOR INICIADO
🌎 PORTA: ${PORT}
========================================
`);

  }
);