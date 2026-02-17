const { Server } = require("socket.io");
const Message = require("../models/message.model");

let onlineUsers = [];

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // console.log("🔥 User connected:", socket.id);

    // =============================
    // ADD USER (ONLINE)
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
    socket.on("sendMessage", async ({ conversationId, senderId, receiverId, text }) => {
      const receiver = onlineUsers.find(
        (u) => u.userId === receiverId
      );

      if (receiver) {
        io.to(receiver.socketId).emit("receiveMessage", {
          conversationId,
          senderId,
          text,
        });
      }
    });

    // =============================
    // TYPING
    // =============================
    socket.on("typing", ({ senderId, receiverId }) => {
      const receiver = onlineUsers.find(
        (u) => u.userId === receiverId
      );

      if (receiver) {
        io.to(receiver.socketId).emit("typing", senderId);
      }
    });

    // =============================
    // MESSAGE SEEN
    // =============================
    socket.on("messageSeen", async ({ conversationId, senderId }) => {
      await Message.updateMany(
        { conversationId, sender: senderId, seen: false },
        { seen: true }
      );

      const sender = onlineUsers.find(
        (u) => u.userId === senderId
      );

      if (sender) {
        io.to(sender.socketId).emit("messageSeen", conversationId);
      }
    });

    // =============================
    // DISCONNECT
    // =============================
    socket.on("disconnect", () => {
      onlineUsers = onlineUsers.filter(
        (u) => u.socketId !== socket.id
      );
      io.emit("getOnlineUsers", onlineUsers);
      console.log("❌ User disconnected:", socket.id);
    });
  });
};

module.exports = initializeSocket;
