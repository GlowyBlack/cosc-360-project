import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.js";

dotenv.config();

const tempUsers = [
  {
    username: "alexm",
    email: "alex.temp@bookbuddy.dev",
    password_plain: "temp1234",
    profile_image: null,
    bio: "Temp seeded user Alex",
    role: "Registered",
    is_suspended: false,
  },
  {
    username: "riyash",
    email: "riya.temp@bookbuddy.dev",
    password_plain: "temp1234",
    profile_image: null,
    bio: "Temp seeded user Riya",
    role: "Registered",
    is_suspended: false,
  },
  {
    username: "noahk",
    email: "noah.temp@bookbuddy.dev",
    password_plain: "temp1234",
    profile_image: null,
    bio: "Temp seeded user Noah",
    role: "Registered",
    is_suspended: false,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await User.deleteMany({ email: { $in: tempUsers.map((u) => u.email) } });
    const docs = await Promise.all(
      tempUsers.map(async (u) => {
        const { password_plain, ...rest } = u;
        const password_hash = await bcrypt.hash(password_plain, 10);
        return { ...rest, password_hash };
      })
    );
    const inserted = await User.insertMany(docs);

    console.log(`Seeded ${inserted.length} temp users.`);
    inserted.forEach((user) => {
      console.log(`${user.username} -> ${user._id}`);
    });
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
