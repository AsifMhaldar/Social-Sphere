const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    caption: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    mediaUrl: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      default: null,
    },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
