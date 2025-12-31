const Post = require("../models/post.model");
const User = require("../models/user.model");
const cloudinary = require("../config/cloudinary");

// CREATE POST
const createPost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Media file is required" });
    }

    const mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
    const publicId = req.file?.filename || req.file?.public_id || null;

    // Create post
    const post = await Post.create({
      user: req.user.id,
      caption: req.body.caption,
      mediaUrl: req.file.path,
      publicId,
      mediaType,
    });

    // Increment postCount
    await User.findByIdAndUpdate(req.user.id, { $inc: { postCount: 1 } });

    const formattedPost = {
      _id: post._id,
      caption: post.caption,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      user: {
        _id: req.user._id || req.user.id,
        username: req.user.firstName || req.user.username || "Unknown",
        avatar: req.user.profilePic || null,
      },
      publicId: post.publicId,
      likesCount: post.likes.length,
      isLiked: false,
      createdAt: post.createdAt,
    };

    res.status(201).json(formattedPost);
  } catch (err) {
    console.error("createPost error:", err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

// DELETE POST
const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Delete from Cloudinary
    if (post.publicId) {
      try {
        const result = await cloudinary.uploader.destroy(post.publicId, {
          resource_type: post.mediaType,
        });
        if (result?.result === "not found") {
          console.warn("Cloudinary resource not found", post.publicId);
        }
      } catch (err) {
        console.warn("Cloudinary delete failed, continuing:", err.message);
      }
    }

    await post.deleteOne();

    // Decrement postCount
    await User.findByIdAndUpdate(req.user.id, { $inc: { postCount: -1 } });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("deletePost error:", err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};

// UPDATE POST
const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { caption } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    if (caption !== undefined) post.caption = caption;

    await post.save();
    res.status(200).json(post);
  } catch (err) {
    console.error("updatePost error:", err);
    res.status(500).json({ message: "Failed to update post" });
  }
};

// LIKE / UNLIKE POST
const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.status(200).json({
      likesCount: post.likes.length,
      liked: !alreadyLiked,
    });
  } catch (err) {
    console.error("likePost error:", err);
    res.status(500).json({ message: "Failed to like post" });
  }
};

// GET FEED
const getFeed = async (req, res) => {
  try {
    const userId = req.user.id;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", "firstName profilePic");

    const formattedPosts = posts.map((post) => {
      const owner = post.user || {};
      return {
        _id: post._id,
        caption: post.caption,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        user: {
          _id: owner._id || null,
          username: owner.firstName || owner.username || "Unknown",
          avatar: owner.profilePic || owner.avatar || null,
        },
        likesCount: post.likes.length,
        isLiked: post.likes.some((id) => id.toString() === userId),
        createdAt: post.createdAt,
      };
    });

    res.status(200).json(formattedPosts);
  } catch (err) {
    console.error("getFeed error:", err);
    res.status(500).json({ message: "Failed to get feed" });
  }
};

// CLOUDINARY WEBHOOK
const cloudinaryWebhook = async (req, res) => {
  try {
    const event = req.body;
    const publicId =
      event?.public_id || (event?.payload && event.payload?.public_id);
    const eventType = event?.event || event?.notification_type;

    if (!publicId) return res.status(400).json({ message: "missing public_id" });

    if (eventType === "resource.deleted" || eventType === "deleted") {
      const removed = await Post.findOneAndDelete({ publicId });
      if (removed) {
        console.log("Deleted post with publicId", publicId);
        await User.findByIdAndUpdate(removed.user, { $inc: { postCount: -1 } });
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("cloudinaryWebhook error:", err);
    return res.status(500).json({ message: "webhook handler error" });
  }
};

module.exports = {
  createPost,
  deletePost,
  updatePost,
  likePost,
  getFeed,
  cloudinaryWebhook,
};
