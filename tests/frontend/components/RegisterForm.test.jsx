import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import RegisterForm from "../../../book-buddy/src/components/RegisterForm/RegisterForm.jsx";

beforeEach(() => {
  global.fetch = jest.fn();
});

function renderForm() {
  return render(
    <MemoryRouter>
      <RegisterForm loginHref="/login" />
    </MemoryRouter>
  );
}

describe("RegisterForm", () => {
  it("renders core fields", () => {
    renderForm();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^city$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/province/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("calls register API once with valid data", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    renderForm();

    const file = new File(["x"], "avatar.png", { type: "image/png" });
    await user.upload(document.querySelector('input[type="file"]'), file);

    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/email address/i), "jane@gmail.com");
    await user.type(screen.getByLabelText(/^city$/i), "Kelowna");
    await user.type(screen.getByLabelText(/province/i), "BC");
    await user.type(screen.getByLabelText(/^password$/i), "Valid1!Aa");
    await user.type(screen.getByLabelText(/confirm password/i), "Valid1!Aa");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    const [url, init] = global.fetch.mock.calls[0];
    expect(String(url)).toMatch(/\/auth\/register$/);
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
  });

  it("does not call API when passwords mismatch (submit disabled)", async () => {
    const user = userEvent.setup();
    renderForm();

    const file = new File(["x"], "avatar.png", { type: "image/png" });
    await user.upload(document.querySelector('input[type="file"]'), file);

    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/email address/i), "jane@gmail.com");
    await user.type(screen.getByLabelText(/^city$/i), "Kelowna");
    await user.type(screen.getByLabelText(/province/i), "BC");
    await user.type(screen.getByLabelText(/^password$/i), "Valid1!Aa");
    await user.type(screen.getByLabelText(/confirm password/i), "Other1!Aa");

    const btn = screen.getByRole("button", { name: /create account/i });
    expect(btn).toBeDisabled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error on submit without photo", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/email address/i), "jane@gmail.com");
    await user.type(screen.getByLabelText(/^city$/i), "Kelowna");
    await user.type(screen.getByLabelText(/province/i), "BC");
    await user.type(screen.getByLabelText(/^password$/i), "Valid1!Aa");
    await user.type(screen.getByLabelText(/confirm password/i), "Valid1!Aa");

    const btn = screen.getByRole("button", { name: /create account/i });
    expect(btn).toBeDisabled();
  });
});
