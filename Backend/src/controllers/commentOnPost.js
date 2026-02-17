const Comment = require("../models/comment.model");
const Post = require("../models/post.model");

// ==============================
// ADD COMMENT
// ==============================
const commentOnPost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = await Comment.create({
      post: postId,
      user: userId,
      text,
    });

    await newComment.populate("user", "firstName lastName profilePic");

    res.status(201).json(newComment);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to comment on post" });
  }
};


// ==============================
// GET ALL COMMENTS OF POST
// ==============================
const getCommentsByPost = async (req, res) => {
  try {
    const postId = req.params.postId;

    const comments = await Comment.find({ post: postId })
      .populate("user", "firstName lastName profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json(comments);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};


// ==============================
// DELETE COMMENT
// ==============================
const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await comment.deleteOne();

    res.status(200).json({ message: "Comment deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

module.exports = {
  commentOnPost,
  getCommentsByPost,
  deleteComment,
};
