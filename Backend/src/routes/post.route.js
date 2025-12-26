const express = require('express');
const postRouter = express.Router();

const upload = require('../middleware/upload.postandvideo');
const userMiddleware = require('../middleware/user.middleware');

const {
  createPost,
  deletePost,
  getFeed,
  likePost,
  cloudinaryWebhook
} = require('../controllers/post.controller');

const { commentOnPost } = require('../controllers/commentOnPost');
// const { validateComment } = require('../middleware/validateComment');

// Create post (photo/video)
postRouter.post('/', userMiddleware, upload.single('media'), createPost);

// Delete post
postRouter.delete('/:id', userMiddleware, deletePost);

// Comment on post
postRouter.post('/:id/comment', userMiddleware, commentOnPost);

// Like/unlike post
postRouter.put('/:id/like', userMiddleware, likePost);

// Get feed
postRouter.get('/feed', userMiddleware, getFeed);

module.exports = postRouter;
