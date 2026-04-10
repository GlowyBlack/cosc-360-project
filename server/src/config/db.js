import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Request from '../models/request.js'
import Comment from '../models/comment.js'
import Follow from '../models/following.js'
import Review from '../models/review.js'
import Post from '../models/post.js'

dotenv.config()

/** Docker Compose: DB_TARGET=atlas uses ATLAS_MONGO_URI; otherwise MONGODB_URI / MONGO_URI (local mongo). */
const mongoURI =
  process.env.DB_TARGET === "atlas"
    ? process.env.ATLAS_MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URI
    : process.env.MONGODB_URI || process.env.MONGO_URI;

async function startup() {
    try {
        if (!mongoURI) {
            throw new Error("MONGODB_URI or MONGO_URI is missing. Create a .env file (see .env.example).");
        }
        await mongoose.connect(mongoURI);
        await Request.syncIndexes();
        await Comment.syncIndexes();
        await Follow.syncIndexes();
        await Review.syncIndexes();
        await Post.updateMany(
            { $or: [{ likeCount: { $exists: false } }, { likeCount: null }] },
            [{ $set: { likeCount: { $size: { $ifNull: ["$likes", []] } } } }],
            { updatePipeline: true },
        );
        await Post.updateMany(
            { $or: [{ dislikeCount: { $exists: false } }, { dislikeCount: null }] },
            [{ $set: { dislikeCount: { $size: { $ifNull: ["$dislikes", []] } } } }],
            { updatePipeline: true },
        );
        await Comment.updateMany(
            { $or: [{ likeCount: { $exists: false } }, { likeCount: null }] },
            [{ $set: { likeCount: { $size: { $ifNull: ["$likes", []] } } } }],
            { updatePipeline: true },
        );
        await Comment.updateMany(
            { $or: [{ dislikeCount: { $exists: false } }, { dislikeCount: null }] },
            [{ $set: { dislikeCount: { $size: { $ifNull: ["$dislikes", []] } } } }],
            { updatePipeline: true },
        );
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}

function getDB(){
    return mongoose.connection;
}

export default {getDB, startup}