const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        process.env.NETLIFY_FRONTEND
      ],
      credentials: true,
    },
  });

  // userId -> socketId
  const onlineUsers = new Map();
  const userDetails = new Map(); // Store user details for calls

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
      socket.user = decoded;
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
    const userId = socket.user._id.toString();
    const userData = {
      _id: socket.user._id,
      firstName: socket.user.firstName,
      lastName: socket.user.lastName,
      email: socket.user.email
    };

    console.log("🔥 Socket connected:", userId);

    onlineUsers.set(userId, socket.id);
    userDetails.set(userId, userData);

    console.log("👥 Online Users:", Array.from(onlineUsers.keys()));

    // Send online users to all connected clients
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));

    // =============================
    // 💬 SEND MESSAGE
    // =============================
    socket.on("sendMessage", ({ conversationId, receiverId, text, message }) => {
      const receiverSocketId = onlineUsers.get(receiverId?.toString());

      const messageData = {
        _id: message._id,
        conversationId,
        sender: socket.user._id,
        text: text,
        createdAt: new Date().toISOString(),
        status: receiverSocketId ? "delivered" : "sent",
      };

      console.log("📨 Sending message to:", receiverId);

      // Send to receiver if online
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", messageData);
      }

      // Send back to sender
      socket.emit("receiveMessage", messageData);
    });

    // =============================
    // ⌨️ TYPING INDICATOR
    // =============================
    socket.on("typing", ({ receiverId, isTyping, conversationId }) => {
      const receiverSocketId = onlineUsers.get(receiverId?.toString());

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", {
          senderId: socket.user._id,
          isTyping,
          conversationId
        });
      }
    });

    // =============================
    // 👁️ MESSAGE SEEN
    // =============================
    socket.on("markMessagesAsSeen", ({ conversationId, userId, senderId }) => {
      const senderSocketId = onlineUsers.get(senderId?.toString());

      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", {
          conversationId,
          seenBy: userId
        });
      }
    });

    // =============================
    // 📞 CALL USER
    // =============================
    socket.on("callUser", ({ toUserId, offer, callType }) => {
      console.log("📞 Call request from:", userId, "to:", toUserId);

      const receiverSocketId = onlineUsers.get(toUserId?.toString());
      const callerDetails = userDetails.get(userId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("incomingCall", {
          fromUserId: userId,
          fromUser: callerDetails,
          offer,
          callType,
        });
      } else {
        socket.emit("callFailed", { reason: "User is offline" });
      }
    });

    // =============================
    // 📞 ANSWER CALL
    // =============================
    socket.on("answerCall", ({ toUserId, answer }) => {
      console.log("📤 Call answered for:", toUserId);
      const receiverSocketId = onlineUsers.get(toUserId?.toString());

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("callAnswered", {
          answer,
          fromUserId: userId
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
          fromUserId: userId
        });
      }
    });

    // =============================
    // 🔚 END CALL
    // =============================
    socket.on("endCall", ({ toUserId }) => {
      console.log("🔚 Call ended between:", userId, "and:", toUserId);
      const receiverSocketId = onlineUsers.get(toUserId?.toString());

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("callEnded", {
          fromUserId: userId
        });
      }
    });

    // =============================
    // ❌ REJECT CALL
    // =============================
    socket.on("rejectCall", ({ toUserId }) => {
      const receiverSocketId = onlineUsers.get(toUserId?.toString());

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("callRejected", {
          fromUserId: userId
        });
      }
    });

    // =============================
    // ❌ DISCONNECT
    // =============================
    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", userId);
      console.log("Reason:", reason);

      onlineUsers.delete(userId);
      userDetails.delete(userId);
      
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    });
  });
};

module.exports = initializeSocket;