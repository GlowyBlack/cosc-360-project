import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BookForm from "../../../book-buddy/src/components/BookForm/BookForm.jsx";

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({ genres: ["Fiction", "Fantasy"] }),
    })
  );
});

describe("BookForm", () => {
  it("renders expected fields", async () => {
    const onSubmit = jest.fn();
    render(<BookForm onSubmit={onSubmit} submitLabel="Save" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(screen.getByLabelText(/^title$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^author$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/book summary/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("shows validation errors for empty required fields", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<BookForm onSubmit={onSubmit} submitLabel="Save" />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with correct shape when valid", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    const file = new File(["x"], "cover.png", { type: "image/png" });

    render(
      <BookForm
        onSubmit={onSubmit}
        submitLabel="Save"
        existingImageUrl="https://example.com/existing.jpg"
      />
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    await user.type(screen.getByLabelText(/^title$/i), "My Book");
    await user.type(screen.getByLabelText(/^author$/i), "Some Author");
    await user.type(screen.getByLabelText(/book summary/i), "A great summary.");
    await user.click(screen.getByRole("radio", { name: /good/i }));
    await user.click(screen.getByRole("checkbox", { name: /^fiction$/i }));

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({
      title: "My Book",
      author: "Some Author",
      description: "A great summary.",
      condition: "Good",
      genres: ["Fiction"],
    });
  });
});
