import React from "react";
import { describe, it, expect, beforeAll, beforeEach, jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const mockUseAuth = jest.fn();
const socketMock = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

jest.unstable_mockModule(
  "../../../book-buddy/src/context/AuthContext.jsx",
  () => ({
    useAuth: () => mockUseAuth(),
  }),
);

jest.unstable_mockModule("../../../book-buddy/src/config/socket.js", () => ({
  createAppSocket: () => socketMock,
}));

jest.unstable_mockModule("../../../book-buddy/src/components/Header/Header.jsx", () => ({
  default: ({ variant }) => <div data-testid="header">header-{variant}</div>,
}));

jest.unstable_mockModule("../../../book-buddy/src/components/Footer/Footer.jsx", () => ({
  default: () => <div data-testid="footer">footer</div>,
}));

jest.unstable_mockModule(
  "../../../book-buddy/src/components/MaterialIcon/MaterialIcon.jsx",
  () => ({
    default: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>,
  }),
);

let LibraryPage;

beforeAll(async () => {
  const mod = await import(
    "../../../book-buddy/src/pages/LibraryPage/LibraryPage.jsx"
  );
  LibraryPage = mod.default;
});

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  window.confirm = jest.fn(() => true);
  localStorage.setItem("token", "test-token");
});

function renderPage() {
  return render(
    <MemoryRouter>
      <LibraryPage />
    </MemoryRouter>,
  );
}

describe("LibraryPage", () => {
  it("loads the personal library and wishlist tabs", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "507f1f77bcf86cd799439099",
        username: "Reader",
        location: "Kelowna, BC",
      },
      logout: jest.fn(),
    });

    global.fetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes("/books/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              _id: "book-1",
              bookTitle: "My Library Book",
              bookAuthor: "Owner Author",
              bookImage: "https://example.com/book-1.png",
              isAvailable: true,
              pendingRequestCount: 2,
            },
          ],
        });
      }
      if (u.includes("/requests/me")) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (u.includes("/user/wishlist")) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              _id: "wish-1",
              bookTitle: "Wishlisted Book",
              bookAuthor: "Wish Author",
              bookImage: "https://example.com/wish.png",
              isAvailable: true,
              bookOwner: { username: "Another User", location: "Vancouver, BC" },
            },
          ],
        });
      }
      throw new Error(`Unhandled fetch: ${u}`);
    });

    renderPage();

    expect(await screen.findByText("My Library Book")).toBeInTheDocument();
    expect(screen.getByText(/2 ACTIVE REQUESTS/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /wishlist/i }));

    expect(await screen.findByText("Wishlisted Book")).toBeInTheDocument();
    expect(screen.getByText("Vancouver, BC")).toBeInTheDocument();
  });

  it("toggles availability and deletes a book from the library", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "507f1f77bcf86cd799439099",
        username: "Reader",
        location: "Kelowna, BC",
      },
      logout: jest.fn(),
    });

    global.fetch.mockImplementation((url, init = {}) => {
      const u = String(url);
      if (u.includes("/books/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              _id: "book-1",
              bookTitle: "Toggle Me",
              bookAuthor: "Author",
              bookImage: "https://example.com/book-1.png",
              isAvailable: true,
              pendingRequestCount: 0,
            },
          ],
        });
      }
      if (u.includes("/requests/me")) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (u.includes("/user/wishlist")) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (u.includes("/books/book-1/toggle-availability")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ _id: "book-1", isAvailable: false }),
        });
      }
      if (u.endsWith("/books/book-1") && init.method === "DELETE") {
        return Promise.resolve({
          ok: true,
          status: 204,
          json: async () => ({}),
        });
      }
      throw new Error(`Unhandled fetch: ${u} ${init.method ?? "GET"}`);
    });

    renderPage();

    expect(await screen.findByText("Toggle Me")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", {
        name: /mark as not available for requests/i,
      }),
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/books\/book-1\/toggle-availability$/),
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
    expect(screen.getByText("NOT AVAILABLE")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /delete toggle me/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/books\/book-1$/),
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });
    await waitFor(() => {
      expect(screen.queryByText("Toggle Me")).not.toBeInTheDocument();
    });
    expect(socketMock.emit).toHaveBeenCalledWith("book_update");
  });
});
