import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req) => {
    const userId = String(req.user?._id ?? req.user?.id ?? "anonymous");
    return {
      folder: "book-buddy/avatars",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      public_id: `avatar-${userId}-${Date.now()}`,
      resource_type: "image",
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(String(file.mimetype || "").toLowerCase())) {
      return cb(new Error("invalid_file_type"));
    }
    return cb(null, true);
  },
});

export { cloudinary, upload };