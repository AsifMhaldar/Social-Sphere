const Comment = require("../models/comment.model");
const Post = require("../models/post.model");

const commentOnPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { comment } = req.body;

    if (!comment || comment.trim() === "") {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = await Comment.create({
      post: postId,
      user: userId,
      text: comment,
    });

    // Optional: populate user info for response
    await newComment.populate("user", "username avatar");

    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: "Failed to comment on post" });
  }
};

module.exports = { commentOnPost };
