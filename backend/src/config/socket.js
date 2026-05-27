const { Server } = require("socket.io");

let io;

function initializeSocket(server) {

    io = new Server(server, {

        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {

        console.log("⚡ CLIENTE CONECTADO");

        socket.on("disconnect", () => {
            console.log("❌ CLIENTE DESCONECTADO");
        });
    });
}

function getIO() {

    if (!io) {
        throw new Error("Socket.io não iniciado");
    }

    return io;
}

module.exports = initializeSocket;
module.exports.getIO = getIO;