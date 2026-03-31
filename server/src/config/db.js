import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const mongoURI = process.env.MONGO_URI

async function startup() {
    try {
        if (!mongoURI) {
            throw new Error("MONGO_URI is missing. Create a .env file (see .env.example).");
        }
        await mongoose.connect(mongoURI);
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