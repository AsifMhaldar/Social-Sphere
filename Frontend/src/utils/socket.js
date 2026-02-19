import { io } from "socket.io-client";

let socket = null;

export const connectSocket = () => {
  if (socket) return socket; // ✅ prevent multiple connections

  const token = localStorage.getItem("token");
  if (!token) return null;

  socket = io(import.meta.env.VITE_API_URL, {
    auth: { token },
    transports: ["websocket"],
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.log("🚨 Socket error:", err.message);
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
