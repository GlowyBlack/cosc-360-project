import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  jest,
} from "@jest/globals";

const mockBookRepository = {
  createBook: jest.fn(),
  findAll: jest.fn(),
  findUserBooks: jest.fn(),
  findByID: jest.fn(),
  updateBook: jest.fn(),
  toggleAvailability: jest.fn(),
  searchBook: jest.fn(),
};

jest.unstable_mockModule("../../../server/src/repositories/bookRepository.js", () => ({
  default: mockBookRepository,
}));

let bookService;

beforeAll(async () => {
  const mod = await import("../../../server/src/services/bookService.js");
  bookService = mod.default;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("bookService", () => {
  it("createBook trims values, normalizes genres, and applies defaults", async () => {
    mockBookRepository.createBook.mockImplementation(async (doc) => ({
      _id: "book-1",
      ...doc,
    }));

    const out = await bookService.createBook({
      bookTitle: "  The Hobbit  ",
      bookAuthor: "  J.R.R. Tolkien ",
      description: "  There and back again. ",
      genres: "Fantasy, Adventure",
      bookOwner: "owner-1",
      bookImage: " https://example.com/hobbit.png ",
      ownerNote: "  Great condition ",
      isAvailable: "false",
    });

    expect(mockBookRepository.createBook).toHaveBeenCalledWith({
      bookTitle: "The Hobbit",
      bookAuthor: "J.R.R. Tolkien",
      description: "There and back again.",
      genre: ["Fantasy", "Adventure"],
      bookOwner: "owner-1",
      bookImage: "https://example.com/hobbit.png",
      condition: "Good",
      ownerNote: "Great condition",
      isAvailable: false,
    });
    expect(out).toMatchObject({
      _id: "book-1",
      bookTitle: "The Hobbit",
      genre: ["Fantasy", "Adventure"],
    });
  });

  it("createBook rejects missing required fields", async () => {
    await expect(
      bookService.createBook({
        bookTitle: "",
        bookAuthor: "Author",
        description: "Summary",
        genres: ["Fantasy"],
        bookOwner: "owner-1",
        bookImage: "https://example.com/book.png",
      }),
    ).rejects.toThrow("Title and author are required");

    await expect(
      bookService.createBook({
        bookTitle: "Title",
        bookAuthor: "Author",
        description: "",
        genres: ["Fantasy"],
        bookOwner: "owner-1",
        bookImage: "https://example.com/book.png",
      }),
    ).rejects.toThrow("Please provide the summary of the book");

    await expect(
      bookService.createBook({
        bookTitle: "Title",
        bookAuthor: "Author",
        description: "Summary",
        genres: [],
        bookOwner: "owner-1",
        bookImage: "https://example.com/book.png",
      }),
    ).rejects.toThrow("Select at least one genre");

    await expect(
      bookService.createBook({
        bookTitle: "Title",
        bookAuthor: "Author",
        description: "Summary",
        genres: ["Fantasy"],
        bookOwner: "owner-1",
        bookImage: "",
      }),
    ).rejects.toThrow("Book cover image is required");
  });

  it("getBookByBookId requires an id", async () => {
    await expect(bookService.getBookByBookId("")).rejects.toThrow(
      "Book ID is required",
    );
  });

  it("updateDetails rejects edits from a non-owner", async () => {
    mockBookRepository.findByID.mockResolvedValue({
      _id: "book-1",
      bookOwner: { _id: "owner-1" },
      bookImage: "https://example.com/book.png",
    });

    await expect(
      bookService.updateDetails("book-1", "owner-2", {
        bookTitle: "New title",
      }),
    ).rejects.toThrow("You can't edit a book that doesn't belong to you.");
  });

  it("updateDetails trims and forwards only supplied updates", async () => {
    mockBookRepository.findByID.mockResolvedValue({
      _id: "book-1",
      bookOwner: { _id: "owner-1" },
      bookImage: "https://example.com/book.png",
    });
    mockBookRepository.updateBook.mockResolvedValue({
      _id: "book-1",
      bookTitle: "Updated title",
    });

    const out = await bookService.updateDetails("book-1", "owner-1", {
      bookTitle: "  Updated title ",
      bookAuthor: "  Updated author ",
      description: "  Fresh summary ",
      genre: "Fantasy, Mystery",
      ownerNote: "  Slight shelf wear ",
      isAvailable: "false",
    });

    expect(mockBookRepository.updateBook).toHaveBeenCalledWith("book-1", {
      bookTitle: "Updated title",
      bookAuthor: "Updated author",
      description: "Fresh summary",
      genre: ["Fantasy", "Mystery"],
      ownerNote: "Slight shelf wear",
      isAvailable: false,
    });
    expect(out).toEqual({
      _id: "book-1",
      bookTitle: "Updated title",
    });
  });

  it("toggleAvailability requires ownership and toggles via repository", async () => {
    mockBookRepository.findByID
      .mockResolvedValueOnce({
        _id: "book-1",
        bookOwner: { _id: "owner-1" },
      })
      .mockResolvedValueOnce({
        _id: "book-1",
        bookOwner: { _id: "owner-1" },
      });
    mockBookRepository.toggleAvailability.mockResolvedValue({
      _id: "book-1",
      isAvailable: false,
    });

    await expect(
      bookService.toggleAvailability("book-1", "owner-2"),
    ).rejects.toThrow(
      "You can't change availability for a book that doesn't belong to you.",
    );

    const out = await bookService.toggleAvailability("book-1", "owner-1");
    expect(mockBookRepository.toggleAvailability).toHaveBeenCalledWith({
      bookId: "book-1",
    });
    expect(out).toEqual({
      _id: "book-1",
      isAvailable: false,
    });
  });

  it("searchBooks returns all books when query is blank", async () => {
    const rows = [{ _id: "book-1" }, { _id: "book-2" }];
    mockBookRepository.findAll.mockResolvedValue(rows);

    const out = await bookService.searchBooks("   ");

    expect(mockBookRepository.findAll).toHaveBeenCalledTimes(1);
    expect(mockBookRepository.searchBook).not.toHaveBeenCalled();
    expect(out).toEqual(rows);
  });

  it("searchBooks forwards non-empty queries to the repository", async () => {
    const rows = [{ _id: "book-9", bookTitle: "Fantasy Quest" }];
    mockBookRepository.searchBook.mockResolvedValue(rows);

    const out = await bookService.searchBooks("fantasy");

    expect(mockBookRepository.searchBook).toHaveBeenCalledWith("fantasy");
    expect(out).toEqual(rows);
  });
});
