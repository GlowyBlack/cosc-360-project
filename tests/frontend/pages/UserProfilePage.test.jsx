import React from "react";
import { describe, it, expect, beforeAll, beforeEach, jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const mockUseAuth = jest.fn();

jest.unstable_mockModule("../../../book-buddy/src/context/AuthContext.jsx", () => ({
  useAuth: () => mockUseAuth(),
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

let UserProfilePage;

beforeAll(async () => {
  const mod = await import("../../../book-buddy/src/pages/UserProfilePage/UserProfilePage.jsx");
  UserProfilePage = mod.default;
});

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  localStorage.setItem("token", "tok");
});

describe("UserProfilePage", () => {
  it("loads profile, books, and lets the viewer follow the user", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "507f1f77bcf86cd799439099" } });
    global.fetch.mockImplementation((url, init = {}) => {
      const u = String(url);
      if (u.includes("/profile")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            username: "Reader A",
            bio: "Avid reader",
            location: "Kelowna, BC",
            stats: { booksBorrowed: 3, inLibrary: 6, rating: 4.5, reviewCounts: 2 },
          }),
        });
      }
      if (u.includes("/books?")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ books: [{ _id: "b1", bookTitle: "Post Book", bookAuthor: "Auth" }], total: 1, totalPages: 1 }),
        });
      }
      if (u.includes("/is-following")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: { isFollowing: false } }) });
      }
      if (u.includes("/follow-stats")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: { followersCount: 2, followingCount: 5 } }) });
      }
      if (u.endsWith("/follow") && init.method === "POST") {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      throw new Error(`Unhandled fetch ${u}`);
    });

    render(
      <MemoryRouter initialEntries={["/user/507f1f77bcf86cd799439011"]}>
        <Routes>
          <Route path="/user/:userId" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Reader A")).toBeInTheDocument();
    expect(screen.getByText(/Avid reader/i)).toBeInTheDocument();
    expect(screen.getByText(/K E L O W N A/i)).not.toBeInTheDocument();

    const user = userEvent.setup();
    const followBtn = screen.getByRole("button", { name: /follow/i });
    await user.click(followBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/follow$/),
        expect.objectContaining({ method: "POST" }),
      );
    });
  });
});
