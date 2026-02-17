const { Server } = require("socket.io");
const jwt = require("jsonwebtoken"); // 👈 ADD
const Message = require("../models/message.model");

let onlineUsers = [];

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NETLIFY_FRONTEND,
      credentials: true,
    },
  });

  // =============================
  // 🔐 SOCKET AUTH MIDDLEWARE
  // =============================
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = decoded; // attach user info to socket
      next();
    } catch (err) {
      console.log("Socket auth error:", err.message);
      next(new Error("Unauthorized"));
    }
  });

  // =============================
  // CONNECTION
  // =============================
  io.on("connection", (socket) => {
    console.log("🔥 Socket connected:", socket.user?.id);

    // =============================
    // ADD USER
    // =============================
    socket.on("addUser", (userId) => {
      if (!onlineUsers.some((u) => u.userId === userId)) {
        onlineUsers.push({ userId, socketId: socket.id });
      }
      io.emit("getOnlineUsers", onlineUsers);
    });

    // =============================
    // SEND MESSAGE
    // =============================
    socket.on("sendMessage", ({ conversationId, senderId, receiverId, text }) => {
      const receiver = onlineUsers.find((u) => u.userId === receiverId);

      if (receiver) {
        io.to(receiver.socketId).emit("receiveMessage", {
          conversationId,
          senderId,
          text,
        });
      }
    });

    // =============================
    // CALL USER
    // =============================
    socket.on("callUser", ({ fromUserId, toUserId, offer, callType }) => {
      const receiver = onlineUsers.find((u) => u.userId === toUserId);

      if (receiver) {
        io.to(receiver.socketId).emit("incomingCall", {
          fromUserId,
          offer,
          callType,
        });
      }
    });

    socket.on("answerCall", ({ toUserId, answer }) => {
      const receiver = onlineUsers.find((u) => u.userId === toUserId);

      if (receiver) {
        io.to(receiver.socketId).emit("callAnswered", { answer });
      }
    });

    socket.on("iceCandidate", ({ toUserId, candidate }) => {
      const receiver = onlineUsers.find((u) => u.userId === toUserId);

      if (receiver) {
        io.to(receiver.socketId).emit("iceCandidate", { candidate });
      }
    });

    socket.on("endCall", ({ toUserId }) => {
      const receiver = onlineUsers.find((u) => u.userId === toUserId);

      if (receiver) {
        io.to(receiver.socketId).emit("callEnded");
      }
    });

    socket.on("disconnect", () => {
      onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
      io.emit("getOnlineUsers", onlineUsers);
      console.log("❌ Socket disconnected");
    });
  });
};

module.exports = initializeSocket;
