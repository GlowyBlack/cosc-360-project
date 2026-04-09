import { upload } from "../config/cloudinaryConfig.js";

function uploadImage(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ detail: "Image must be 5MB or smaller" });
    }
    if (error.message === "invalid_file_type") {
      return res.status(400).json({ detail: "Only JPG, PNG, and WEBP are supported" });
    }
    return res.status(500).json({ detail: "Upload failed" });
  });
}

export default uploadImage;
