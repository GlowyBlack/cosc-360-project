import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true },
    senderId:  { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    content:   { type: String, required: true, trim: true },
    isRead:    { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Message", MessageSchema);