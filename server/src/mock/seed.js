import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import Book from "../models/book.js";

dotenv.config();

const tempUsers = [
  {
    username: "alice123",
    email: "alice@example.com",
    password_plain: "password123",
    profile_image: null,
    bio: "Temporary seeded user Alice",
    role: "Registered",
    is_suspended: false,
  },  
  {
    username: "John Doe",
    email: "john.doe@example.com",
    password_plain: "password123",
    profile_image: null,
    bio: "Temporary seeded user John Doe",
    role: "Registered",
    is_suspended: false,
  },
  {
    username: "Jane Smith",
    email: "jane.smith@example.com",
    password_plain: "password123",
    profile_image: null,
    bio: "Temporary seeded user Jane Smith",
    role: "Registered",
    is_suspended: false,
  },  
  {
    username: "Emily Davis",
    email: "emily.davis@example.com",
    password_plain: "password123",
    profile_image: null,
    bio: "Temporary seeded user Emily Davis",
    role: "Registered",
    is_suspended: false,
  },
  {
    username: "Robert Brown",
    email: "robert.brown@example.com",
    password_plain: "password123",
    profile_image: null,
    bio: "Temporary seeded user Robert Brown",
    role: "Registered",
    is_suspended: false,
  },
];
const tempBooks = [
  { bookTitle: "Dune", bookAuthor: "Frank Herbert", genre: "Sci-Fi" },
  { bookTitle: "1984", bookAuthor: "George Orwell", genre: "Fiction" },
  { bookTitle: "The Hobbit", bookAuthor: "J.R.R. Tolkien", genre: "Fantasy" },
  { bookTitle: "To Kill a Mockingbird", bookAuthor: "Harper Lee", genre: "Fiction" },
  { bookTitle: "The Great Gatsby", bookAuthor: "F. Scott Fitzgerald", genre: "Fiction" },
  { bookTitle: "Moby Dick", bookAuthor: "Herman Melville", genre: "Adventure" },
  { bookTitle: "War and Peace", bookAuthor: "Leo Tolstoy", genre: "Historical Fiction" },
  { bookTitle: "The Catcher in the Rye", bookAuthor: "J.D. Salinger", genre: "Fiction" },
  { bookTitle: "Brave New World", bookAuthor: "Aldous Huxley", genre: "Sci-Fi" },
  { bookTitle: "The Alchemist", bookAuthor: "Paulo Coelho", genre: "Fiction" },
  { bookTitle: "Harry Potter", bookAuthor: "J.K. Rowling", genre: "Fantasy" },
  { bookTitle: "Percy Jackson", bookAuthor: "Rick Riordan", genre: "Fantasy" },
  { bookTitle: "The Odyssey", bookAuthor: "Homer", genre: "Adventure" },
  { bookTitle: "Crime and Punishment", bookAuthor: "Fyodor Dostoevsky", genre: "Thriller" },
  { bookTitle: "The Book Thief", bookAuthor: "Markus Zusak", genre: "Historical Fiction" },
  { bookTitle: "The Lord of the Rings", bookAuthor: "J.R.R. Tolkien", genre: "Fantasy" },
  { bookTitle: "Fahrenheit 451", bookAuthor: "Ray Bradbury", genre: "Fiction" },
  { bookTitle: "Jane Eyre", bookAuthor: "Charlotte Brontë", genre: "Romance" },
  { bookTitle: "The Chronicles of Narnia", bookAuthor: "C.S. Lewis", genre: "Fantasy" },
  { bookTitle: "Animal Farm", bookAuthor: "George Orwell", genre: "Fiction" },
  { bookTitle: "The Kite Runner", bookAuthor: "Khaled Hosseini", genre: "Fiction" },
  { bookTitle: "The Hunger Games", bookAuthor: "Suzanne Collins", genre: "Fiction" },
  { bookTitle: "The Da Vinci Code", bookAuthor: "Dan Brown", genre: "Thriller" },
  { bookTitle: "Ender's Game", bookAuthor: "Orson Scott Card", genre: "Sci-Fi" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await User.deleteMany({ email: { $in: tempUsers.map(u => u.email) } });
    await Book.deleteMany({});

    const userDocs = await Promise.all(
      tempUsers.map(async (u) => {
        const { password_plain, ...rest } = u;
        const password_hash = await bcrypt.hash(password_plain, 10);
        return {
          ...rest,
          password_hash,
        };
      })
    );
    const users = await User.insertMany(userDocs);

    // Shuffle books
    const shuffledBooks = [...tempBooks].sort(() => 0.5 - Math.random());

    const getRandomCount = (min, max) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    let bookIndex = 0;
    const allBooks = [];

    for (const user of users) {
      const count = getRandomCount(3, 5);

      for (let i = 0; i < count; i++) {
        if (bookIndex >= shuffledBooks.length) break; // stop if we run out

        const book = shuffledBooks[bookIndex++];

        allBooks.push({
          ...book,
          bookImage: null,
          description: "",
          condition: "Good",
          isAvailable: true,
          bookOwner: user._id,
        });
      }

      console.log(`${user.username} assigned ${count} unique books`);
    }

    await Book.insertMany(allBooks);
    console.log(`Seeded ${allBooks.length} unique books`);
    console.log(`Seeded ${users.length} temp users.`);
    users.forEach((user) => {
      console.log(`${user.username} -> ${user._id}`);
    });
  } catch (error) {
    console.error("Seed failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}
seed();