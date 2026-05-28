import { io } from "socket.io-client";

const socket = io(
  "https://conceito-fitness-system.onrender.com"
);

export default socket;