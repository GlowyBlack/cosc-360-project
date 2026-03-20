import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    profile_image: { type: String, default: null },
    bio: { type: String, default: "" },
    role: { type: String, enum: ["Registered", "Admin"], default: "Registered" },
    is_suspended: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("User", UserSchema);