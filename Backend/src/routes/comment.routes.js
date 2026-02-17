const express = require("express");
const router = express.Router();

const userMiddleware = require("../middleware/user.middleware");

const {
  commentOnPost,
  getCommentsByPost,
  deleteComment,
} = require("../controllers/commentOnPost.js");


// ==============================
// ADD COMMENT TO POST
// ==============================
router.post("/:postId", userMiddleware, commentOnPost);


// ==============================
// GET COMMENTS FOR POST
// ==============================
router.get("/:postId", getCommentsByPost);


// ==============================
// DELETE COMMENT
// ==============================
router.delete("/:commentId", userMiddleware, deleteComment);


module.exports = router;
