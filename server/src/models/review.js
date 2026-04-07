import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
    requestId:   { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true },
    reviewerId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    revieweeId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating:      { type: Number, min: 1, max: 5, required: true },
    comment:     { type: String, trim: true, default: "" },
}, { timestamps: true });

// One review per direction per request
ReviewSchema.index({ requestId: 1, reviewerId: 1 }, { unique: true });
export default mongoose.model("Review", ReviewSchema);