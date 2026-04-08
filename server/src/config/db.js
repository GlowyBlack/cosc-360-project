import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Request from '../models/request.js'
import Comment from '../models/comment.js'
import Follow from '../models/following.js'
import Review from '../models/review.js'

dotenv.config()

const mongoURI = process.env.MONGO_URI

async function startup() {
    try {
        if (!mongoURI) {
            throw new Error("MONGO_URI is missing. Create a .env file (see .env.example).");
        }
        await mongoose.connect(mongoURI);
        await Request.syncIndexes();
        await Comment.syncIndexes();
        await Follow.syncIndexes();
        await Review.syncIndexes();
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