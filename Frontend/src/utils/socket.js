import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL, {
  withCredentials: true,
  auth: {
    token: localStorage.getItem("token"), // or wherever you store JWT
  },
});

export default socket;
