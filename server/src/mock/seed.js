import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/user.js";
import Book from "../models/book.js";
import Request from "../models/request.js";
import userService from "../services/authService.js";

dotenv.config();

const tempUsers = [
  {
    firstName: "Alice",
    lastName: "Example",
    email: "alice@example.com",
    password: "passwordAlice",
    city: "Kelowna",
    provinceState: "British Columbia",
    profileImage: null,
    bio: "Temporary seeded user Alice",
    role: "Registered",
    isSuspended: false,
    isBanned: false,
  },
  {
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    password: "passwordAdmin",
    city: "Edmonton",
    provinceState: "Alberta",
    profileImage: null,
    bio: "Admin user",
    role: "Admin",
    isSuspended: false,
    isBanned: false,
  },
  {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    password: "passwordJohn",
    city: "Miami",
    provinceState: "Florida",
    profileImage: null,
    bio: "Temporary seeded user John Doe",
    role: "Registered",
    isSuspended: false,
    isBanned: false,
  },
  {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    password: "passwordJane",
    city: "Victoria",
    provinceState: "British Columbia",
    profileImage: null,
    bio: "Temporary seeded user Jane Smith",
    role: "Registered",
    isSuspended: false,
    isBanned: false,
  },
  {
    firstName: "Emily",
    lastName: "Davis",
    email: "emily.davis@example.com",
    password: "passwordEmily",
    city: "Calgary",
    provinceState: "Alberta",
    profileImage: null,
    bio: "Temporary seeded user Emily Davis",
    role: "Registered",
    isSuspended: false,
    isBanned: false,
  },
  {
    firstName: "Robert",
    lastName: "Brown",
    email: "robert.brown@example.com",
    password: "passwordRobert",
    city: "Toronto",
    provinceState: "Ontario",
    profileImage: null,
    bio: "Temporary seeded user Robert Brown",
    role: "Registered",
    isSuspended: false,
    isBanned: false,
  },
];

const tempBooks = [
  { bookTitle: "Dune", bookAuthor: "Frank Herbert", genre: ["Sci-Fi", "Adventure"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "1984", bookAuthor: "George Orwell", genre: ["Fiction", "Thriller"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "The Hobbit", bookAuthor: "J.R.R. Tolkien", genre: ["Fantasy", "Adventure"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "To Kill a Mockingbird", bookAuthor: "Harper Lee", genre: ["Fiction"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "The Great Gatsby", bookAuthor: "F. Scott Fitzgerald", genre: ["Fiction"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "Moby Dick", bookAuthor: "Herman Melville", genre: ["Adventure", "Fiction"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "War and Peace", bookAuthor: "Leo Tolstoy", genre: ["Historical Fiction", "Fiction"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "The Catcher in the Rye", bookAuthor: "J.D. Salinger", genre: ["Fiction"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "Brave New World", bookAuthor: "Aldous Huxley", genre: ["Sci-Fi", "Fiction"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "The Alchemist", bookAuthor: "Paulo Coelho", genre: ["Fiction", "Adventure"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "Harry Potter and the Philosopher Stone", bookAuthor: "J.K. Rowling", genre: ["Fantasy", "Young Adult"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "Percy Jackson and the Lightning Thief", bookAuthor: "Rick Riordan", genre: ["Adventure", "Fantasy", "Young Adult"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "The Odyssey", bookAuthor: "Homer", genre: ["Adventure", "Fiction"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "Crime and Punishment", bookAuthor: "Fyodor Dostoevsky", genre: ["Thriller", "Fiction"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "The Book Thief", bookAuthor: "Markus Zusak", genre: ["Historical Fiction", "Young Adult"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "The Lord of the Rings", bookAuthor: "J.R.R. Tolkien", genre: ["Fantasy", "Adventure"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "Fahrenheit 451", bookAuthor: "Ray Bradbury", genre: ["Fiction", "Sci-Fi"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "Jane Eyre", bookAuthor: "Charlotte Brontë", genre: ["Romance", "Fiction"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "The Chronicles of Narnia", bookAuthor: "C.S. Lewis", genre: ["Fantasy", "Young Adult"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "Animal Farm", bookAuthor: "George Orwell", genre: ["Fiction"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "The Kite Runner", bookAuthor: "Khaled Hosseini", genre: ["Fiction"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "The Hunger Games: Book 1", bookAuthor: "Suzanne Collins", genre: ["Fiction", "Young Adult"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "The Da Vinci Code", bookAuthor: "Dan Brown", genre: ["Thriller", "Mystery"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
  { bookTitle: "Ender's Game", bookAuthor: "Orson Scott Card", genre: ["Sci-Fi", "Young Adult"], bookImage: "https://placehold.co/300x400?text=Book+Cover" },
];

async function seed() {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error("MONGO_URI is missing")
    }
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");

    await User.deleteMany({ email: { $in: tempUsers.map((u) => u.email) } });
    await Book.deleteMany({});
    await Request.deleteMany({});

    // Create users through the same service used by auth (hashing + validation).
    await Promise.all(
      tempUsers.map(async (u) => {
        await userService.register({
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          password: u.password,
          city: u.city,
          provinceState: u.provinceState,
          profileImage:
            u.profileImage ?? "https://example.com/seed-placeholder-avatar.png",
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
          description: null,
          condition: "Good",
          ownerNote: "",
          isAvailable: true,
          bookOwner: user._id,
        });
      }

      console.log(`${user.username} assigned ${count} unique books`);
    }
    for (let i = allBooks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allBooks[i], allBooks[j]] = [allBooks[j], allBooks[i]];
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
