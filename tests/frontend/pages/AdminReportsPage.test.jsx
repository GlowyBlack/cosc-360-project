import React from "react";
import { describe, it, expect, beforeAll, beforeEach, jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

let AdminReportsPage;

beforeAll(async () => {
  const mod = await import("../../../book-buddy/src/pages/admin/AdminReportsPage/AdminReportsPage.jsx");
  AdminReportsPage = mod.default;
});

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  localStorage.setItem("token", "tok");
});

describe("AdminReportsPage", () => {
  it("loads reports and lets an admin mark one reviewed", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              _id: "report-1",
              createdAt: "2026-01-01T00:00:00.000Z",
              reporterId: { username: "reader1", email: "reader1@gmail.com" },
              targetType: "Post",
              targetId: "507f1f77bcf86cd799439011",
              reason: "Spam",
              status: "Open",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ _id: "report-1", status: "Reviewed" }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              _id: "report-1",
              createdAt: "2026-01-01T00:00:00.000Z",
              reporterId: { username: "reader1", email: "reader1@gmail.com" },
              targetType: "Post",
              targetId: "507f1f77bcf86cd799439011",
              reason: "Spam",
              status: "Reviewed",
            },
          ],
        }),
      });

    render(<MemoryRouter><AdminReportsPage /></MemoryRouter>);

    expect(await screen.findByText(/reader1/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /reviewed/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/admin\/reports\/report-1\/resolve$/),
        expect.objectContaining({ method: "PUT" }),
      );
    });
  });
});
