import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const mongoURI = process.env.MONGO_URI

async function startup() {
    try {
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