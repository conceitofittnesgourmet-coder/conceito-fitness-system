import { io } from "socket.io-client";

const socket = io(
  "https://conceito-fitness-system.onrender.com",
  {
    // Tenta WebSocket primeiro, evitando excesso de requisições HTTP polling.
    transports: ["websocket", "polling"],

    // Permite reconexão, mas de maneira controlada.
    reconnection: true,

    // Não fica tentando centenas de vezes quando o servidor estiver fora.
    reconnectionAttempts: 10,

    // Espera 3 segundos antes da primeira nova tentativa.
    reconnectionDelay: 3000,

    // Aumenta progressivamente até no máximo 15 segundos.
    reconnectionDelayMax: 15000,

    // Evita vários navegadores tentando reconectar exatamente ao mesmo tempo.
    randomizationFactor: 0.5,

    // Desiste de uma tentativa de conexão após 10 segundos.
    timeout: 10000,
  }
);

socket.on("connect", () => {
  console.log("Socket conectado:", socket.id);
});

socket.on("disconnect", (motivo) => {
  console.log("Socket desconectado:", motivo);
});

socket.on("connect_error", (erro) => {
  console.warn(
    "Falha temporária na conexão em tempo real:",
    erro.message
  );
});

export default socket;