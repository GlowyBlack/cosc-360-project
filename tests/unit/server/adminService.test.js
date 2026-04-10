import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  jest,
} from "@jest/globals";

const mockRepo = {
  findUsersByUsernameOrEmailRegex: jest.fn(),
  findBooksByTitleOrAuthorWithOwnerRegex: jest.fn(),
  aggregateBookCountsByOwnerIds: jest.fn(),
  findAllUsersLean: jest.fn(),
  existsActiveRequestForBook: jest.fn(),
  deleteBookById: jest.fn(),
};

jest.unstable_mockModule("../../../server/src/repositories/adminRepository.js", () => ({
  default: mockRepo,
}));

let adminService;

beforeAll(async () => {
  const mod = await import("../../../server/src/services/adminService.js");
  adminService = mod.default;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("adminService", () => {
  it("searchUsers merges direct users and book owners and attaches bookCount", async () => {
    const u1 = {
      _id: "507f1f77bcf86cd799439011",
      username: "Alice",
      email: "a@gmail.com",
      role: "Registered",
      isSuspended: false,
      isBanned: false,
    };
    const u2 = {
      _id: "507f1f77bcf86cd799439012",
      username: "Bob",
      email: "b@gmail.com",
      role: "Registered",
      isSuspended: false,
      isBanned: false,
    };
    mockRepo.findUsersByUsernameOrEmailRegex.mockResolvedValue([u1]);
    mockRepo.findBooksByTitleOrAuthorWithOwnerRegex.mockResolvedValue([
      {
        bookOwner: u2,
      },
    ]);
    mockRepo.aggregateBookCountsByOwnerIds.mockResolvedValue([
      { _id: u1._id, bookCount: 2 },
      { _id: u2._id, bookCount: 5 },
    ]);

    const out = await adminService.searchUsers("test");

    expect(out).toHaveLength(2);
    const byEmail = Object.fromEntries(out.map((u) => [u.email, u]));
    expect(byEmail["a@gmail.com"].bookCount).toBe(2);
    expect(byEmail["b@gmail.com"].bookCount).toBe(5);
  });

  it("listUsers returns array from repository (full list)", async () => {
    const rows = [{ _id: "1", email: "x@gmail.com" }];
    mockRepo.findAllUsersLean.mockResolvedValue(rows);
    const out = await adminService.listUsers();
    expect(out).toEqual(rows);
    expect(mockRepo.findAllUsersLean).toHaveBeenCalledTimes(1);
  });

  it("deleteBook throws with status 400 when active request exists", async () => {
    mockRepo.existsActiveRequestForBook.mockResolvedValue(true);
    try {
      await adminService.deleteBook("507f1f77bcf86cd799439011");
      expect.fail("expected throw");
    } catch (e) {
      expect(e.status).toBe(400);
      expect(String(e.message)).toContain("Cannot delete book");
    }
    expect(mockRepo.deleteBookById).not.toHaveBeenCalled();
  });

  it("deleteBook deletes when no active request", async () => {
    mockRepo.existsActiveRequestForBook.mockResolvedValue(false);
    mockRepo.deleteBookById.mockResolvedValue({ _id: "507f1f77bcf86cd799439011" });
    const out = await adminService.deleteBook("507f1f77bcf86cd799439011");
    expect(out).toEqual({
      message: "Book deleted",
      id: "507f1f77bcf86cd799439011",
    });
  });
});
