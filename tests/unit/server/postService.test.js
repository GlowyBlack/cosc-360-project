import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  jest,
} from "@jest/globals";

const mockPostRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  softDeleteById: jest.fn(),
  addLike: jest.fn(),
  removeLike: jest.fn(),
  addDislike: jest.fn(),
  removeDislike: jest.fn(),
};

const mockCommentRepository = {
  findByPostId: jest.fn(),
};

jest.unstable_mockModule("../../../server/src/repositories/postRepository.js", () => ({
  default: mockPostRepository,
}));

jest.unstable_mockModule("../../../server/src/repositories/commentRepository.js", () => ({
  default: mockCommentRepository,
}));

let postService;

beforeAll(async () => {
  const mod = await import("../../../server/src/services/postService.js");
  postService = mod.default;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("postService", () => {
  it("createPost trims content and normalizes book tag", async () => {
    mockPostRepository.create.mockResolvedValue({ _id: "post-1" });

    await postService.createPost({
      authorId: "user-1",
      title: "  My Post  ",
      content: "  Body text  ",
      genre: ["Fantasy", " Drama "],
      bookTag: { title: "  The Hobbit ", author: " Tolkien  " },
    });

    expect(mockPostRepository.create).toHaveBeenCalledWith({
      authorId: "user-1",
      title: "My Post",
      content: "Body text",
      genre: ["Fantasy", "Drama"],
      bookTag: { title: "The Hobbit", author: "Tolkien" },
    });
  });

  it("getPostById returns null for removed posts and otherwise includes comments", async () => {
    mockPostRepository.findById
      .mockResolvedValueOnce({ _id: "post-1", isRemoved: true })
      .mockResolvedValueOnce({ _id: "post-2", isRemoved: false });
    mockCommentRepository.findByPostId.mockResolvedValue([{ _id: "comment-1" }]);

    await expect(postService.getPostById("post-1")).resolves.toBeNull();

    await expect(postService.getPostById("post-2")).resolves.toEqual({
      post: { _id: "post-2", isRemoved: false },
      comments: [{ _id: "comment-1" }],
    });
  });

  it("updatePost rejects non-owners and trims updates", async () => {
    mockPostRepository.findById
      .mockResolvedValueOnce({
        _id: "post-1",
        authorId: { _id: "owner-1" },
        isRemoved: false,
      })
      .mockResolvedValueOnce({
        _id: "post-1",
        authorId: { _id: "owner-1" },
        isRemoved: false,
      });
    mockPostRepository.updateById.mockResolvedValue({ _id: "post-1", title: "Updated" });

    await expect(
      postService.updatePost("post-1", "other-user", { title: "Updated" }),
    ).rejects.toThrow("You can't edit this post");

    await postService.updatePost("post-1", "owner-1", {
      title: "  Updated ",
      content: "  Edited body ",
      genre: ["Fantasy", " Mystery "],
      bookTag: { title: "  New Tag ", author: "" },
    });

    expect(mockPostRepository.updateById).toHaveBeenCalledWith("post-1", {
      title: "Updated",
      content: "Edited body",
      genre: ["Fantasy", "Mystery"],
      bookTag: { title: "New Tag", author: null },
    });
  });

  it("deletePost allows admins and owners but rejects others", async () => {
    mockPostRepository.findById.mockResolvedValue({
      _id: "post-1",
      authorId: { _id: "owner-1" },
      isRemoved: false,
    });
    mockPostRepository.softDeleteById.mockResolvedValue({ success: true });

    await expect(
      postService.deletePost("post-1", { id: "other", role: "Registered" }),
    ).rejects.toThrow("You can't delete this post");

    await expect(
      postService.deletePost("post-1", { id: "admin-id", role: "Admin" }),
    ).resolves.toEqual({ success: true });
  });

  it("toggleLike removes a prior dislike before adding a like", async () => {
    mockPostRepository.findById.mockResolvedValue({
      _id: "post-1",
      isRemoved: false,
      likes: [],
      dislikes: ["user-1"],
    });
    mockPostRepository.addLike.mockResolvedValue({ _id: "post-1", likes: ["user-1"] });

    const out = await postService.toggleLike("post-1", "user-1");

    expect(mockPostRepository.removeDislike).toHaveBeenCalledWith("post-1", "user-1");
    expect(mockPostRepository.addLike).toHaveBeenCalledWith("post-1", "user-1");
    expect(out).toEqual({ _id: "post-1", likes: ["user-1"] });
  });

  it("toggleDislike removes a prior like before adding a dislike", async () => {
    mockPostRepository.findById.mockResolvedValue({
      _id: "post-1",
      isRemoved: false,
      likes: ["user-1"],
      dislikes: [],
    });
    mockPostRepository.addDislike.mockResolvedValue({ _id: "post-1", dislikes: ["user-1"] });

    const out = await postService.toggleDislike("post-1", "user-1");

    expect(mockPostRepository.removeLike).toHaveBeenCalledWith("post-1", "user-1");
    expect(mockPostRepository.addDislike).toHaveBeenCalledWith("post-1", "user-1");
    expect(out).toEqual({ _id: "post-1", dislikes: ["user-1"] });
  });
});
