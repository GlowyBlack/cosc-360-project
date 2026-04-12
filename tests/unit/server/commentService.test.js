import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  jest,
} from "@jest/globals";

const mockCommentRepository = {
  findByAuthorPaginated: jest.fn(),
  findByPostId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateContentById: jest.fn(),
  softDeleteById: jest.fn(),
  addLike: jest.fn(),
  removeLike: jest.fn(),
  addDislike: jest.fn(),
  removeDislike: jest.fn(),
};

const mockPostRepository = {
  findById: jest.fn(),
};

jest.unstable_mockModule("../../../server/src/repositories/commentRepository.js", () => ({
  default: mockCommentRepository,
}));

jest.unstable_mockModule("../../../server/src/repositories/postRepository.js", () => ({
  default: mockPostRepository,
}));

let commentService;

beforeAll(async () => {
  const mod = await import("../../../server/src/services/commentService.js");
  commentService = mod.default;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("commentService", () => {
  it("createComment prevents commenting on your own post", async () => {
    mockPostRepository.findById.mockResolvedValue({
      _id: "post-1",
      authorId: { _id: "user-1" },
      isRemoved: false,
    });

    await expect(
      commentService.createComment({
        authorId: "user-1",
        postId: "post-1",
        content: "Hello there",
      }),
    ).rejects.toThrow("You can't comment on your own post");
  });

  it("createComment validates parent replies and trims content", async () => {
    mockPostRepository.findById.mockResolvedValue({
      _id: "post-1",
      authorId: { _id: "owner-1" },
      isRemoved: false,
    });
    mockCommentRepository.findById
      .mockResolvedValueOnce({ _id: "parent-1", postId: "other-post", isRemoved: false })
      .mockResolvedValueOnce({ _id: "parent-2", postId: "post-1", isRemoved: false });
    mockCommentRepository.create.mockResolvedValue({ _id: "comment-1" });

    await expect(
      commentService.createComment({
        authorId: "user-2",
        postId: "post-1",
        content: "Reply",
        parentId: "parent-1",
      }),
    ).rejects.toThrow("Comment and reply must belong to the same post");

    await commentService.createComment({
      authorId: "user-2",
      postId: "post-1",
      content: "  Reply text  ",
      parentId: "parent-2",
    });

    expect(mockCommentRepository.create).toHaveBeenCalledWith({
      authorId: "user-2",
      postId: "post-1",
      content: "Reply text",
      parentId: "parent-2",
    });
  });

  it("editComment rejects non-owners and blank content", async () => {
    mockCommentRepository.findById
      .mockResolvedValueOnce({
        _id: "comment-1",
        authorId: { _id: "owner-1" },
        isRemoved: false,
      })
      .mockResolvedValueOnce({
        _id: "comment-1",
        authorId: { _id: "owner-1" },
        isRemoved: false,
      });

    await expect(
      commentService.editComment({
        commentId: "comment-1",
        userId: "user-2",
        content: "edited",
      }),
    ).rejects.toThrow("You can't edit this comment");

    await expect(
      commentService.editComment({
        commentId: "comment-1",
        userId: "owner-1",
        content: "   ",
      }),
    ).rejects.toThrow("Comment content cannot be empty");
  });

  it("deleteComment allows admins and owners", async () => {
    mockCommentRepository.findById.mockResolvedValue({
      _id: "comment-1",
      authorId: { _id: "owner-1" },
      isRemoved: false,
    });
    mockCommentRepository.softDeleteById.mockResolvedValue({ _id: "comment-1", isRemoved: true });

    await expect(
      commentService.deleteComment({
        commentId: "comment-1",
        user: { id: "other-user", role: "Registered" },
      }),
    ).rejects.toThrow("You can't delete this comment");

    await expect(
      commentService.deleteComment({
        commentId: "comment-1",
        user: { id: "admin-id", role: "Admin" },
      }),
    ).resolves.toEqual({ _id: "comment-1", isRemoved: true });
  });

  it("toggleLike and toggleDislike swap reactions correctly", async () => {
    mockCommentRepository.findById
      .mockResolvedValueOnce({
        _id: "comment-1",
        isRemoved: false,
        likes: [],
        dislikes: ["user-1"],
      })
      .mockResolvedValueOnce({
        _id: "comment-1",
        isRemoved: false,
        likes: ["user-1"],
        dislikes: [],
      });
    mockCommentRepository.addLike.mockResolvedValue({ _id: "comment-1", likes: ["user-1"] });
    mockCommentRepository.addDislike.mockResolvedValue({ _id: "comment-1", dislikes: ["user-1"] });

    await commentService.toggleLike({ commentId: "comment-1", userId: "user-1" });
    expect(mockCommentRepository.removeDislike).toHaveBeenCalledWith("comment-1", "user-1");
    expect(mockCommentRepository.addLike).toHaveBeenCalledWith("comment-1", "user-1");

    await commentService.toggleDislike({ commentId: "comment-1", userId: "user-1" });
    expect(mockCommentRepository.removeLike).toHaveBeenCalledWith("comment-1", "user-1");
    expect(mockCommentRepository.addDislike).toHaveBeenCalledWith("comment-1", "user-1");
  });
});
