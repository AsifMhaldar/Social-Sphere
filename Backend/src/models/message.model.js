const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔥 Text is NOT required anymore
    text: {
      type: String,
      default: "",
    },

    seen: {
      type: Boolean,
      default: false,
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },

    messageType: {
      type: String,
      enum: ["text", "post"],
      default: "text",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
