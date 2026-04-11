import React from "react";
import { describe, it, expect, beforeAll, beforeEach, jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

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

jest.unstable_mockModule(
  "../../../book-buddy/src/components/ExchangeProposalModal/ExchangeProposalModal.jsx",
  () => ({
    default: ({ open }) => (open ? <div>exchange modal</div> : null),
  }),
);

let BookDetailPage;

beforeAll(async () => {
  const mod = await import(
    "../../../book-buddy/src/pages/BookDetailPage/BookDetailPage.jsx"
  );
  BookDetailPage = mod.default;
});

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

function renderPage(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/book/:bookId" element={<BookDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("BookDetailPage", () => {
  it("shows an invalid-link error without fetching", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: jest.fn(),
    });

    renderPage("/book/not-a-real-id");

    expect(screen.getByText(/invalid book link/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("loads and displays book details for a valid listing", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: jest.fn(),
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        _id: "507f1f77bcf86cd799439011",
        bookTitle: "The Hobbit",
        bookAuthor: "J.R.R. Tolkien",
        bookImage: "https://example.com/hobbit.png",
        description: "A classic fantasy adventure.",
        ownerNote: "Minor shelf wear",
        condition: "Good",
        isAvailable: true,
        bookOwner: {
          _id: "507f1f77bcf86cd799439012",
          username: "Owner User",
          profileImage: "https://example.com/avatar.png",
        },
      }),
    });

    renderPage("/book/507f1f77bcf86cd799439011");

    expect(await screen.findByText("The Hobbit")).toBeInTheDocument();
    expect(screen.getByText(/By J.R.R. Tolkien/i)).toBeInTheDocument();
    expect(screen.getByText(/A classic fantasy adventure./i)).toBeInTheDocument();
    expect(screen.getByText(/Minor shelf wear/i)).toBeInTheDocument();
    expect(screen.getByText(/Available now/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /request to borrow/i })).toBeDisabled();
  });

  it("submits a borrow request for a signed-in user", async () => {
    const logout = jest.fn();
    mockUseAuth.mockReturnValue({
      user: { id: "507f1f77bcf86cd799439099", username: "Borrower" },
      logout,
    });

    global.fetch.mockImplementation((url, init = {}) => {
      const u = String(url);
      if (u.includes("/books/507f1f77bcf86cd799439011")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            _id: "507f1f77bcf86cd799439011",
            bookTitle: "Borrowable Book",
            bookAuthor: "Author",
            bookImage: "https://example.com/book.png",
            description: "A book ready to borrow",
            ownerNote: "",
            condition: "Good",
            isAvailable: true,
            bookOwner: {
              _id: "507f1f77bcf86cd799439012",
              username: "Shelf Owner",
            },
          }),
        });
      }
      if (u.includes("/requests/borrow")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      }
      throw new Error(`Unhandled fetch: ${u} ${init.method ?? "GET"}`);
    });

    renderPage("/book/507f1f77bcf86cd799439011");

    expect(await screen.findByText("Borrowable Book")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /request to borrow/i }));

    const dateInput = document.querySelector('input[type="date"]');
    expect(dateInput).toBeTruthy();
    await user.type(dateInput, "2030-01-15");
    await user.click(screen.getByRole("button", { name: /send request/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/requests\/borrow$/),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            bookId: "507f1f77bcf86cd799439011",
            ownerId: "507f1f77bcf86cd799439012",
            returnBy: "2030-01-15",
          }),
        }),
      );
    });

    expect(socketMock.emit).toHaveBeenCalledWith("new_request", {
      ownerId: "507f1f77bcf86cd799439012",
    });
  });
});
