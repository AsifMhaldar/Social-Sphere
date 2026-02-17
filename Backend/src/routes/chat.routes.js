const express = require("express");
const router = express.Router();

const {
  createConversation,
  getUserConversations,
  sendMessage,
  getMessages,
} = require("../controllers/chat.controller");
const userMiddleware = require('../middleware/user.middleware');

router.post("/conversation", userMiddleware, createConversation);
router.get("/conversation/:userId", getUserConversations);
router.post("/message",userMiddleware, sendMessage);
router.get("/message/:conversationId", getMessages);

module.exports = router;   // ✅ VERY IMPORTANT
