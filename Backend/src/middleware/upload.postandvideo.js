const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary"); // your config file

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video");
    return {
      folder: "kamsa/posts",
      resource_type: isVideo ? "video" : "image",
      allowed_formats: isVideo ? ["mp4", "mov"] : ["jpg", "jpeg", "png", "webp"],
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
