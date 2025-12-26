const Post = require("../models/post.model");
const cloudinary = require("../config/cloudinary");

const createPost = async (req, res) => {
  try {
    // 1. Ensure file exists
    if (!req.file) {
      return res.status(400).json({ message: "Media file is required" });
    }

    // 2. Decide media type safely
    const mediaType = req.file.mimetype.startsWith("video")
      ? "video"
      : "image";

    // 3. Create post
    // Attempt to capture Cloudinary public id from multer file object
    const publicId = req.file?.filename || req.file?.public_id || null;

    const post = await Post.create({
      user: req.user.id, // from auth middleware
      caption: req.body.caption,
      mediaUrl: req.file.path, // Cloudinary URL
      publicId,
      mediaType,
    });

    // Construct a response that's consistent with getFeed formatting so the client can
    // show the newly-created post immediately without needing to re-fetch the feed.
    const formattedPost = {
      _id: post._id,
      caption: post.caption,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      // Provide a lightweight user object. We use `username` for frontend compatibility
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
    console.error('createPost error:', err);
    res.status(500).json({ message: "Failed to create post" });
  }
};


const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Ownership check
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // If publicId exists, attempt to delete from Cloudinary but be resilient.
    if (post.publicId) {
      try {
        const result = await cloudinary.uploader.destroy(post.publicId, {
          resource_type: post.mediaType,
        });
        // Cloudinary returns { result: 'ok' } for success, 'not found' if already deleted
        if (result && result.result === 'not found') {
          console.warn('deletePost: Cloudinary resource not found', post.publicId);
        }
      } catch (err) {
        console.warn('deletePost: Cloudinary destroy failed, continuing to delete DB record', err.message);
      }
    } else {
      console.warn('deletePost: no publicId present for post', post._id);
    }

    // Delete from DB regardless of cloudinary outcome
    await post.deleteOne();

    res.status(200).json({ message: "Post deleted successfully" });

  } catch (err) {
    console.error('deletePost error:', err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};

const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { caption } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Ownership check
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Allow empty string captions
    if (caption !== undefined) {
      post.caption = caption;
    }

    await post.save();
    res.status(200).json(post);

  } catch (err) {
    console.error('updatePost error:', err);
    res.status(500).json({ message: "Failed to update post" });
  }
};

const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

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
    console.error('likePost error:', err);
    res.status(500).json({ message: "Failed to like post" });
  }
};


const getFeed = async (req, res) => {
  try {
    const userId = req.user.id;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", "firstName profilePic"); // populate post owner only

    // Map posts to include likesCount and isLiked and provide a consistent user shape for frontend
    const formattedPosts = posts.map((post) => {
      const owner = post.user || null;
      if (!owner) {
        console.warn(`getFeed: post ${post._id} has no user populated`);
      }

      return {
        _id: post._id,
        caption: post.caption,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        user: {
          _id: owner?._id ?? null,
          username: owner?.firstName || owner?.username || "Unknown",
          avatar: owner?.profilePic || owner?.avatar || null,
        },
        likesCount: post.likes.length,
        isLiked: post.likes.some((id) => id.toString() === userId),
        createdAt: post.createdAt,
      };
    });

    res.status(200).json(formattedPosts);
  } catch (err) {
    console.error('getFeed error:', err);
    res.status(500).json({ message: "Failed to get feed" });
  }
};




const cloudinaryWebhook = async (req, res) => {
  // Lightweight Cloudinary webhook handler skeleton.
  // Cloudinary will POST events like 'resource.deleted' with payload including 'public_id'.
  // In production, you should verify the webhook signature for authenticity.
  try {
    const event = req.body;
    const publicId = event?.public_id || (event?.payload && event.payload?.public_id) || null;
    const eventType = event?.event || event?.notification_type || null;

    if (!publicId) {
      console.warn('cloudinaryWebhook: missing public_id in payload', event);
      return res.status(400).json({ message: 'missing public_id' });
    }

    if (eventType === 'resource.deleted' || eventType === 'deleted') {
      const removed = await Post.findOneAndDelete({ publicId });
      if (removed) {
        console.log('cloudinaryWebhook: deleted post with publicId', publicId);
      } else {
        console.warn('cloudinaryWebhook: no post matched publicId', publicId);
      }
      return res.status(200).json({ success: true });
    }

    // For other events, just ack
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('cloudinaryWebhook error:', err);
    return res.status(500).json({ message: 'webhook handler error' });
  }
};

module.exports = { createPost, deletePost, updatePost, likePost, getFeed, cloudinaryWebhook };
