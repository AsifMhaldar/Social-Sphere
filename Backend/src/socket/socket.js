const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NETLIFY_FRONTEND,
      credentials: true,
    },
  });

  // 🔥 Use Map instead of array (better performance + cleaner)
  const onlineUsers = new Map(); 
  // structure: userId -> socketId

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

      socket.user = decoded; // attach user info
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
    const userId = socket.user.id;

    console.log("🔥 Socket connected:", userId);

    // ✅ Automatically register user
    onlineUsers.set(userId.toString(), socket.id);

    // Broadcast updated online users
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));

    // =============================
    // 💬 SEND MESSAGE
    // =============================
    socket.on("sendMessage", ({ conversationId, receiverId, text }) => {
      const receiverSocketId = onlineUsers.get(receiverId?.toString());

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", {
          conversationId,
          senderId: userId,
          text,
        });
      }
    });

    // =============================
    // 📞 CALL USER
    // =============================
    socket.on("callUser", ({ toUserId, offer, callType }) => {
      const receiverSocketId = onlineUsers.get(toUserId?.toString());

      console.log("📞 Calling:", toUserId);
      console.log("👥 Online Users:", Array.from(onlineUsers.keys()));

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("incomingCall", {
          fromUserId: userId,
          offer,
          callType,
        });
      }
    });

    // =============================
    // 📞 ANSWER CALL
    // =============================
    socket.on("answerCall", ({ toUserId, answer }) => {
      const receiverSocketId = onlineUsers.get(toUserId?.toString());

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("callAnswered", {
          answer,
        });
      }
    });

    // =============================
    // ❄️ ICE CANDIDATES
    // =============================
    socket.on("iceCandidate", ({ toUserId, candidate }) => {
      const receiverSocketId = onlineUsers.get(toUserId?.toString());

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("iceCandidate", {
          candidate,
        });
      }
    });

    // =============================
    // 🔚 END CALL
    // =============================
    socket.on("endCall", ({ toUserId }) => {
      const receiverSocketId = onlineUsers.get(toUserId?.toString());

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("callEnded");
      }
    });

    // =============================
    // ❌ DISCONNECT
    // =============================
    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", userId);

      onlineUsers.delete(userId.toString());

      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    });
  });
};

module.exports = initializeSocket;
