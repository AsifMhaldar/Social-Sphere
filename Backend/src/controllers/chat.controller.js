import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

/*
=========================================
Create or Get Conversation
=========================================
*/
export const createConversation = async (req, res) => {
  try {
    const senderId = req.user.id;   // ✅ from middleware
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver required" });
    }

    // Check if conversation already exists
    const existing = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (existing) {
      return res.status(200).json(existing);
    }

    const newConversation = await Conversation.create({
      members: [senderId, receiverId],
    });

    res.status(201).json(newConversation);

  } catch (err) {
    console.error("Conversation error:", err);
    res.status(500).json({ message: "Failed to create conversation" });
  }
};


/*
=========================================
Get User Conversations
=========================================
*/
export const getUserConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: { $in: [req.params.userId] },
    })
      .populate("members", "firstName email profilePic") // 🔥 FIXED
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/*
=========================================
Send Message
=========================================
*/
export const sendMessage = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sender = req.user.id;
    const { conversationId, text, postId } = req.body;

    if (!conversationId) {
      return res.status(400).json({ message: "Conversation required" });
    }

    const newMessage = await Message.create({
      conversationId,
      sender,
      text: text || "",
      post: postId || null,
      messageType: postId ? "post" : "text",
    });

    const populated = await newMessage.populate([
      { path: "sender", select: "firstName profilePic" },
      { path: "post" }
    ]);

    res.status(201).json(populated);

  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};



/*
=========================================
Get Messages by Conversation
=========================================
*/
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    })
      .populate("sender", "username profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
