const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");

require("dotenv").config();



const app = express();
const server = http.createServer(app); // 🔥 IMPORTANT

const main = require("./config/db");
const redisClient = require("./config/redis");

const authRouter = require("./routes/user.routes");
const postRouter = require("./routes/post.route");
const profileRouter = require("./routes/profile.routes");
const chatRouter = require("./routes/chat.routes");
const initializeSocket = require("./socket/socket");
const commentRouter = require("./routes/comment.routes");



app.use(
  cors({
    origin: process.env.NETLIFY_FRONTEND,
    // origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));


app.use("/user", authRouter);
app.use("/posts", postRouter);
app.use("/profile", profileRouter);
app.use("/chat", chatRouter);
app.use("/comments", commentRouter);


app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});


const startServer = async () => {
  try {
    await main();
    console.log("✅ MongoDB connected");

    await redisClient.connect();
    console.log("✅ Redis connected");

    initializeSocket(server);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
};

// Global error safety
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  process.exit(1);
});

startServer();
