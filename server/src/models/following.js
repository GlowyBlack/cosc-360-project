import mongoose from "mongoose";

const FollowSchema = new mongoose.Schema({
    followerId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    followingId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
export default mongoose.model("Following", FollowSchema);