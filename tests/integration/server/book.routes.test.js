import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  jest,
} from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import bcrypt from "bcryptjs";
import { signAccessToken } from "../../../server/src/middleware/auth.js";

jest.unstable_mockModule("../../../server/src/middleware/uploadImage.js", () => ({
  default: (req, _res, next) => {
    req.file = {
      path: "https://tmm.chicagodistributioncenter.com/IsbnImages/9780226822952.jpg",
      secure_url: "https://tmm.chicagodistributioncenter.com/IsbnImages/9780226822952.jpg",
    };
    next();
  },
}));

let app;
let mongoServer;
let bookService;

async function waitForMongoReady() {
  for (let i = 0; i < 80; i++) {
    if (mongoose.connection.readyState === 1) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("MongoDB did not become ready");
}

async function createUser({
  username = "Reader One",
  email = "reader1@gmail.com",
  password = "Valid1!Pass",
  location = "Kelowna, BC",
  role = "Registered",
  wishlist = [],
  profileImage = "https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg?semt=ais_hybrid&w=740&q=80",
} = {}) {
  const { default: User } = await import("../../../server/src/models/user.js");
  return User.create({
    username,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    location,
    role,
    wishlist,
    profileImage,
  });
}

async function createBook({
  ownerId,
  title = "Default Book",
  author = "Default Author",
  description = "Default description",
  genre = ["Fantasy"],
  condition = "Good",
  ownerNote = "",
  isAvailable = true,
  image = "https://tmm.chicagodistributioncenter.com/IsbnImages/9780226822952.jpg",
} = {}) {
  const { default: Book } = await import("../../../server/src/models/book.js");
  return Book.create({
    bookTitle: title,
    bookAuthor: author,
    bookImage: image,
    description,
    genre,
    condition,
    ownerNote,
    isAvailable,
    bookOwner: ownerId,
  });
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_SECRET = "jest-test-secret";
  process.env.NODE_ENV = "test";

  const bookServiceMod = await import("../../../server/src/services/bookService.js");
  bookService = bookServiceMod.default;

  const mod = await import("../../../server/src/app.js");
  app = mod.app;
  await waitForMongoReady();
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  jest.restoreAllMocks();
  const cols = mongoose.connection.collections;
  for (const key of Object.keys(cols)) {
    await cols[key].deleteMany({});
  }
});

describe("book routes (integration)", () => {
  it("POST /books adds a book for the authenticated user", async () => {
    const owner = await createUser({
      username: "Book Owner",
      email: "owner@gmail.com",
    });
    const token = signAccessToken({ id: owner._id, role: owner.role });

    const res = await request(app)
      .post("/books")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send({
        bookTitle: "The Hobbit",
        bookAuthor: "J.R.R. Tolkien",
        description: "A journey through Middle-earth.",
        genre: ["Fantasy"],
        condition: "Like New",
        ownerNote: "Handled carefully",
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      bookTitle: "The Hobbit",
      bookAuthor: "J.R.R. Tolkien",
      description: "A journey through Middle-earth.",
      genre: ["Fantasy"],
      condition: "Like New",
      ownerNote: "Handled carefully",
    });
    expect(res.body.bookImage).toBe("https://tmm.chicagodistributioncenter.com/IsbnImages/9780226822952.jpg");

    const { default: Book } = await import("../../../server/src/models/book.js");
    const saved = await Book.findById(res.body._id).lean();
    expect(saved).toBeTruthy();
    expect(String(saved.bookOwner)).toBe(String(owner._id));
  });

  it("PATCH /books/:bookId edits the owner's book", async () => {
    const owner = await createUser({
      username: "Edit Owner",
      email: "edit-owner@gmail.com",
    });
    const token = signAccessToken({ id: owner._id, role: owner.role });
    const book = await createBook({
      ownerId: owner._id,
      title: "Old Title",
      author: "Old Author",
      description: "Old description",
      genre: ["Fiction"],
    });

    const res = await request(app)
      .patch(`/books/${book._id}`)
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send({
        bookTitle: "New Title",
        description: "New description",
        genre: ["Fantasy", "Fiction"],
        ownerNote: "Updated note",
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      bookTitle: "New Title",
      description: "New description",
      genre: ["Fantasy", "Fiction"],
      ownerNote: "Updated note",
    });
  });

  it("DELETE /books/:bookId removes a book", async () => {
    const owner = await createUser({
      username: "Delete Owner",
      email: "delete-owner@gmail.com",
    });
    const token = signAccessToken({ id: owner._id, role: owner.role });
    const book = await createBook({
      ownerId: owner._id,
      title: "Delete Me",
    });

    const deleteSpy = jest
      .spyOn(bookService, "deleteBook")
      .mockResolvedValueOnce({ success: true, message: "Book deleted" });

    const res = await request(app)
      .delete(`/books/${book._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(deleteSpy).toHaveBeenCalledWith(String(book._id), expect.anything());
  });

  it("POST /books/:bookId/toggle-availability flips availability for the owner", async () => {
    const owner = await createUser({
      username: "Toggle Owner",
      email: "toggle-owner@gmail.com",
    });
    const token = signAccessToken({ id: owner._id, role: owner.role });
    const book = await createBook({
      ownerId: owner._id,
      title: "Toggle Book",
      isAvailable: true,
    });

    const res = await request(app)
      .post(`/books/${book._id}/toggle-availability`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.isAvailable).toBe(false);
  });

  it("GET /books/:bookId returns the book details", async () => {
    const owner = await createUser({
      username: "Detail Owner",
      email: "detail-owner@gmail.com",
      location: "Vancouver, BC",
    });
    const book = await createBook({
      ownerId: owner._id,
      title: "Detail Book",
      author: "Detail Author",
      description: "Detailed description",
    });

    const res = await request(app).get(`/books/${book._id}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      _id: String(book._id),
      bookTitle: "Detail Book",
      bookAuthor: "Detail Author",
      description: "Detailed description",
    });
    expect(res.body.bookOwner).toMatchObject({
      username: "Detail Owner",
      location: "Vancouver, BC",
    });
  });

  it("GET /books and GET /books/search browse and filter available books", async () => {
    const owner = await createUser({
      username: "Browse Owner",
      email: "browse-owner@gmail.com",
    });

    await createBook({
      ownerId: owner._id,
      title: "Hidden Science",
      author: "A Writer",
      genre: ["Sci-Fi"],
      isAvailable: false,
    });
    await createBook({
      ownerId: owner._id,
      title: "Fantasy Quest",
      author: "Quest Writer",
      genre: ["Fantasy"],
      isAvailable: true,
    });
    await createBook({
      ownerId: owner._id,
      title: "Cooking With Stories",
      author: "Another Writer",
      genre: ["Fiction"],
      isAvailable: true,
    });

    const browseRes = await request(app).get("/books");
    expect(browseRes.status).toBe(200);
    expect(Array.isArray(browseRes.body)).toBe(true);
    expect(browseRes.body).toHaveLength(3);

    const searchRes = await request(app).get("/books/search").query({ q: "fantasy" });
    expect(searchRes.status).toBe(200);
    expect(searchRes.body).toHaveLength(1);
    expect(searchRes.body[0]).toMatchObject({
      bookTitle: "Fantasy Quest",
      isAvailable: true,
    });
  });

  it("GET /books/me and /user/wishlist return the personal library and wishlist", async () => {
    const owner = await createUser({
      username: "Library Owner",
      email: "library-owner@gmail.com",
    });
    const viewer = await createUser({
      username: "Wishlist Viewer",
      email: "wishlist-viewer@gmail.com",
      location: "Victoria, BC",
    });

    const ownedBook = await createBook({
      ownerId: viewer._id,
      title: "My Shelf Book",
      author: "Shelf Author",
    });
    const wishedBook = await createBook({
      ownerId: owner._id,
      title: "Wish Book",
      author: "Wish Author",
    });

    const viewerToken = signAccessToken({ id: viewer._id, role: viewer.role });

    const addWishlistRes = await request(app)
      .patch(`/user/wishlist/${wishedBook._id}`)
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(addWishlistRes.status).toBe(200);
    expect(addWishlistRes.body.wishlisted).toBe(true);

    const libraryRes = await request(app)
      .get("/books/me")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(libraryRes.status).toBe(200);
    expect(libraryRes.body).toHaveLength(1);
    expect(libraryRes.body[0]).toMatchObject({
      _id: String(ownedBook._id),
      bookTitle: "My Shelf Book",
      bookAuthor: "Shelf Author",
    });

    const wishlistRes = await request(app)
      .get("/user/wishlist")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(wishlistRes.status).toBe(200);
    expect(wishlistRes.body).toHaveLength(1);
    expect(wishlistRes.body[0]).toMatchObject({
      _id: String(wishedBook._id),
      bookTitle: "Wish Book",
      bookAuthor: "Wish Author",
    });
  });
});
