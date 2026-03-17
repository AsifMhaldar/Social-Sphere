import { io } from "socket.io-client";

let socket = null;

export const connectSocket = () => {
  if (socket) return socket; // ✅ prevent multiple connections

  socket = io(import.meta.env.VITE_API_URL, {
    withCredentials: true,
    transports: ["websocket"], // 🔥 force websocket only
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
