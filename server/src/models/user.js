import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    location: { type: String, required: true, trim: true },
    profileImage: { type: String, required: true, trim: true },
    bio: { type: String, default: "Hey there! I'm new here." },
    role: { type: String, enum: ["Registered", "Admin"], default: "Registered" },
    isSuspended: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }]
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
