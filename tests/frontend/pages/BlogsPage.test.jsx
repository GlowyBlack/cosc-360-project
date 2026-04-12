import React from "react";
import { describe, it, expect, beforeAll, beforeEach, jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const mockUseAuth = jest.fn();
const socketMock = { emit: jest.fn(), on: jest.fn(), off: jest.fn() };
const mockTogglePostReaction = jest.fn();
const mockDeletePost = jest.fn();
const mockPreviewPlainContent = jest.fn();

jest.unstable_mockModule("../../../book-buddy/src/context/AuthContext.jsx", () => ({
  useAuth: () => mockUseAuth(),
}));
jest.unstable_mockModule("../../../book-buddy/src/config/socket.js", () => ({
  createAppSocket: () => socketMock,
}));
jest.unstable_mockModule("../../../book-buddy/src/components/Header/Header.jsx", () => ({
  default: ({ variant }) => <div>header-{variant}</div>,
}));
jest.unstable_mockModule("../../../book-buddy/src/components/Footer/Footer.jsx", () => ({
  default: () => <div>footer</div>,
}));
jest.unstable_mockModule("../../../book-buddy/src/components/MaterialIcon/MaterialIcon.jsx", () => ({
  default: ({ name }) => <span>{name}</span>,
}));
jest.unstable_mockModule("../../../book-buddy/src/pages/BlogsPage/CreatePostComposer.jsx", () => ({
  default: () => <div>composer</div>,
}));
jest.unstable_mockModule("../../../book-buddy/src/pages/BlogsPage/PostMoreMenu.jsx", () => ({
  default: () => <button type="button">more</button>,
}));
jest.unstable_mockModule("../../../book-buddy/src/components/ReportReasonModal/ReportReasonModal.jsx", () => ({
  default: ({ open, targetType, onSuccess }) =>
    open ? (
      <div>
        report-modal-{targetType}
        <button type="button" onClick={onSuccess}>report-success</button>
      </div>
    ) : null,
}));
jest.unstable_mockModule("../../../book-buddy/src/pages/BlogsPage/blogPostShared.jsx", () => ({
  PREVIEW_MAX_CHARS: 120,
  deletePost: (...args) => mockDeletePost(...args),
  isPostOwner: () => false,
  postTag: () => "Fantasy",
  previewPlainContent: (...args) => mockPreviewPlainContent(...args),
  togglePostReaction: (...args) => mockTogglePostReaction(...args),
}));

let BlogsPage;

beforeAll(async () => {
  const mod = await import("../../../book-buddy/src/pages/BlogsPage/BlogsPage.jsx");
  BlogsPage = mod.default;
});

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  mockPreviewPlainContent.mockImplementation((content) => ({ text: content, truncated: false }));
});

describe("BlogsPage", () => {
  it("loads posts and lets a signed-in user like and report a post", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1", username: "reader" }, logout: jest.fn() });
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          _id: "post-1",
          title: "Community Post",
          content: "Hello readers",
          createdAt: "2026-01-01T00:00:00.000Z",
          authorId: { username: "Poster" },
          likeCount: 1,
          dislikeCount: 0,
          likes: [],
          dislikes: [],
        },
      ],
    });
    mockTogglePostReaction.mockResolvedValue({
      _id: "post-1",
      title: "Community Post",
      content: "Hello readers",
      createdAt: "2026-01-01T00:00:00.000Z",
      authorId: { username: "Poster" },
      likeCount: 2,
      dislikeCount: 0,
      likes: ["u1"],
      dislikes: [],
    });

    render(<MemoryRouter><BlogsPage /></MemoryRouter>);

    expect(await screen.findByText("Community Post")).toBeInTheDocument();

    const user = userEvent.setup();
    const buttons = screen.getAllByRole("button");
    await user.click(buttons.find((btn) => btn.textContent.includes("arrow_upward")));
    await waitFor(() => expect(mockTogglePostReaction).toHaveBeenCalled());
    expect(socketMock.emit).toHaveBeenCalledWith("post_reacted", expect.any(Object));

    await user.click(screen.getByRole("button", { name: /report/i }));
    expect(screen.getByText("report-modal-Post")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /report-success/i }));
    expect(await screen.findByText(/moderators will review your report/i)).toBeInTheDocument();
  });

  it("shows an API error state when posts fail to load", async () => {
    mockUseAuth.mockReturnValue({ user: null, logout: jest.fn() });
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Could not load posts" }),
    });

    render(<MemoryRouter><BlogsPage /></MemoryRouter>);

    expect(await screen.findByText(/could not load posts/i)).toBeInTheDocument();
  });
});
