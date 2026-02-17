const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Prevent duplicate conversations
conversationSchema.index({ members: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
