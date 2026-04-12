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

let ReportReasonModal;

beforeAll(async () => {
  const mod = await import("../../../book-buddy/src/components/ReportReasonModal/ReportReasonModal.jsx");
  ReportReasonModal = mod.default;
});

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  mockUseAuth.mockReturnValue({ logout: jest.fn() });
  localStorage.setItem("token", "tok");
});

describe("ReportReasonModal", () => {
  it("submits a report and calls success handlers", async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ _id: "report-1" }) });

    render(
      <ReportReasonModal
        open={true}
        onClose={onClose}
        targetType="Post"
        targetId="507f1f77bcf86cd799439011"
        subjectHint="Bad post"
        onSuccess={onSuccess}
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/details/i), "Spam content");
    await user.click(screen.getByRole("button", { name: /submit report/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
