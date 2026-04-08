import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["Post", "Comment", "User"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["Open", "Reviewed", "Dismissed"], default: "Open" },
}, { timestamps: true });

ReportSchema.index({ targetType: 1, targetId: 1, status: 1, createdAt: -1 });

export default mongoose.model("Report", ReportSchema);
