import React from "react";
import { describe, it, expect, beforeAll, beforeEach, jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseAuth = jest.fn();

jest.unstable_mockModule("../../../book-buddy/src/context/AuthContext.jsx", () => ({
  useAuth: () => mockUseAuth(),
}));
jest.unstable_mockModule("../../../book-buddy/src/components/MaterialIcon/MaterialIcon.jsx", () => ({
  default: ({ name }) => <span>{name}</span>,
}));

let ReviewInteractionModal;

beforeAll(async () => {
  const mod = await import("../../../book-buddy/src/components/ReviewInteractionModal/ReviewInteractionModal.jsx");
  ReviewInteractionModal = mod.default;
});

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  mockUseAuth.mockReturnValue({ logout: jest.fn() });
  localStorage.setItem("token", "tok");
});

describe("ReviewInteractionModal", () => {
  it("loads eligibility and submits a review", async () => {
    const onClose = jest.fn();
    const onSubmitted = jest.fn();
    global.fetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes("/eligibility/")) {
        return Promise.resolve({ ok: true, json: async () => ({ eligible: true }) });
      }
      if (u.endsWith("/reviews")) {
        return Promise.resolve({ ok: true, json: async () => ({ _id: "review-1" }) });
      }
      throw new Error(`Unhandled ${u}`);
    });

    render(
      <ReviewInteractionModal
        open={true}
        onClose={onClose}
        requestId="507f1f77bcf86cd799439011"
        interactionLabel="Reader B"
        onSubmitted={onSubmitted}
      />,
    );

    expect(await screen.findByText(/How was your interaction with Reader B/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /4 stars/i }));
    await user.type(screen.getByLabelText(/comment/i), "Great exchange");
    await user.click(screen.getByRole("button", { name: /submit review/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/reviews$/),
      expect.objectContaining({ method: "POST" }),
    ));
    expect(onSubmitted).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
