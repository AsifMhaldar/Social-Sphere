const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NETLIFY_FRONTEND,
      credentials: true,
    },
  });

  // userId -> socketId
  const onlineUsers = new Map();

  // =============================
  // 🔐 SOCKET AUTH MIDDLEWARE
  // =============================
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;

      if (!cookieHeader) {
        console.log("❌ No cookie header");
        return next(new Error("Unauthorized"));
      }

      // Parse cookies safely
      const cookies = Object.fromEntries(
        cookieHeader.split(";").map((c) => {
          const [key, value] = c.trim().split("=");
          return [key, value];
        })
      );

      const token = cookies.token;

      if (!token) {
        console.log("❌ No token found in cookies");
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_KEY);

      socket.user = decoded; // attach user info
      next();
    } catch (err) {
      console.log("❌ Socket auth error:", err.message);
      next(new Error("Unauthorized"));
    }
  });

  // =============================
  // CONNECTION
  // =============================
  io.on("connection", (socket) => {
    const userId = socket.user._id;

    console.log("🔥 Socket connected:", userId);

    onlineUsers.set(userId.toString(), socket.id);

    console.log("👥 Online Users:", Array.from(onlineUsers.keys()));

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
