import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/user.js";
import Book from "../models/book.js";
import userService from "../services/user-service.js";

dotenv.config();

const tempUsers = [
  {
    firstName: "Alice",
    lastName: "Example",
    email: "alice@example.com",
    password: "passwordAlice",
    profileImage: null,
    bio: "Temporary seeded user Alice",
    role: "Registered",
    isSuspended: false,
  },
  {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    password: "passwordJohn",
    profileImage: null,
    bio: "Temporary seeded user John Doe",
    role: "Registered",
    isSuspended: false,
  },
  {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    password: "passwordJane",
    profileImage: null,
    bio: "Temporary seeded user Jane Smith",
    role: "Registered",
    isSuspended: false,
  },
  {
    firstName: "Emily",
    lastName: "Davis",
    email: "emily.davis@example.com",
    password: "passwordEmily",
    profileImage: null,
    bio: "Temporary seeded user Emily Davis",
    role: "Registered",
    isSuspended: false,
  },
  {
    firstName: "Robert",
    lastName: "Brown",
    email: "robert.brown@example.com",
    password: "passwordRobert",
    profileImage: null,
    bio: "Temporary seeded user Robert Brown",
    role: "Registered",
    isSuspended: false,
  },
];
const tempBooks = [
  { bookTitle: "Dune", bookAuthor: "Frank Herbert", genre: ["Sci-Fi", "Adventure"] },
  { bookTitle: "1984", bookAuthor: "George Orwell", genre: ["Fiction", "Thriller"] },
  { bookTitle: "The Hobbit", bookAuthor: "J.R.R. Tolkien", genre: ["Fantasy", "Adventure"] },
  { bookTitle: "To Kill a Mockingbird", bookAuthor: "Harper Lee", genre: ["Fiction"] },
  { bookTitle: "The Great Gatsby", bookAuthor: "F. Scott Fitzgerald", genre: ["Fiction"] },
  { bookTitle: "Moby Dick", bookAuthor: "Herman Melville", genre: ["Adventure", "Fiction"] },
  { bookTitle: "War and Peace", bookAuthor: "Leo Tolstoy", genre: ["Historical Fiction", "Fiction"] },
  { bookTitle: "The Catcher in the Rye", bookAuthor: "J.D. Salinger", genre: ["Fiction"] },
  { bookTitle: "Brave New World", bookAuthor: "Aldous Huxley", genre: ["Sci-Fi", "Fiction"] },
  { bookTitle: "The Alchemist", bookAuthor: "Paulo Coelho", genre: ["Fiction", "Adventure"] },
  { bookTitle: "Harry Potter", bookAuthor: "J.K. Rowling", genre: ["Fantasy", "Young Adult"] },
  { bookTitle: "Percy Jackson", bookAuthor: "Rick Riordan", genre: ["Fantasy", "Young Adult"] },
  { bookTitle: "The Odyssey", bookAuthor: "Homer", genre: ["Adventure", "Fiction"] },
  { bookTitle: "Crime and Punishment", bookAuthor: "Fyodor Dostoevsky", genre: ["Thriller", "Fiction"] },
  { bookTitle: "The Book Thief", bookAuthor: "Markus Zusak", genre: ["Historical Fiction", "Young Adult"] },
  { bookTitle: "The Lord of the Rings", bookAuthor: "J.R.R. Tolkien", genre: ["Fantasy", "Adventure"] },
  { bookTitle: "Fahrenheit 451", bookAuthor: "Ray Bradbury", genre: ["Fiction", "Sci-Fi"] },
  { bookTitle: "Jane Eyre", bookAuthor: "Charlotte Brontë", genre: ["Romance", "Fiction"] },
  { bookTitle: "The Chronicles of Narnia", bookAuthor: "C.S. Lewis", genre: ["Fantasy", "Young Adult"] },
  { bookTitle: "Animal Farm", bookAuthor: "George Orwell", genre: ["Fiction"] },
  { bookTitle: "The Kite Runner", bookAuthor: "Khaled Hosseini", genre: ["Fiction"] },
  { bookTitle: "The Hunger Games", bookAuthor: "Suzanne Collins", genre: ["Fiction", "Young Adult"] },
  { bookTitle: "The Da Vinci Code", bookAuthor: "Dan Brown", genre: ["Thriller", "Mystery"] },
  { bookTitle: "Ender's Game", bookAuthor: "Orson Scott Card", genre: ["Sci-Fi", "Young Adult"] },
];

async function seed() {
  try {
    const mongoURI = process.env.MONGO_URI;
    if(!mongoURI){
      throw new Error("MONGO_URI is missing")
    }
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");

    await User.deleteMany({ email: { $in: tempUsers.map((u) => u.email) } });
    await Book.deleteMany({});

    // Create users through the same service used by auth (hashing + validation).
    await Promise.all(
      tempUsers.map(async (u) => {
        await userService.register({
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          password: u.password,
        });

        // Apply any extra seeded fields not handled by register().
        await User.updateOne(
          { email: String(u.email).trim().toLowerCase() },
          {
            $set: {
              profileImage: u.profileImage ?? null,
              bio: u.bio ?? "",
              role: u.role ?? "Registered",
              isSuspended: !!u.isSuspended,
            },
          }
        );
      })
    );

    const users = await User.find({ email: { $in: tempUsers.map((u) => u.email) } });

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
          description: null,
          condition: "Good",
          onwerNote: "",
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
