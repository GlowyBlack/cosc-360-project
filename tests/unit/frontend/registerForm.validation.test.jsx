import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
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

describe("RegisterForm validation", () => {
  it("shows password mismatch and does not call API when passwords differ", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/email address/i), "jane@gmail.com");
    await user.type(screen.getByLabelText(/^city$/i), "Kelowna");
    await user.type(screen.getByLabelText(/province/i), "BC");
    await user.type(screen.getByLabelText(/^password$/i), "Valid1!Aa");
    await user.type(screen.getByLabelText(/confirm password/i), "Other1!Aa");

    expect(screen.getByText(/password does not match/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows password requirements warning when password too short", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/^password$/i), "Ab1!");
    expect(
      screen.getByText(/at least 8 characters/i)
    ).toBeInTheDocument();
  });

  it("submit button disabled when required pieces missing", () => {
    renderForm();
    const submit = screen.getByRole("button", { name: /create account/i });
    expect(submit).toBeDisabled();
  });

  it("submit enabled when password rules pass, match, photo and allowed email", async () => {
    const user = userEvent.setup();
    renderForm();

    const file = new File(["x"], "avatar.png", { type: "image/png" });
    const fileInput = document.querySelector('input[type="file"]');
    await user.upload(fileInput, file);

    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/email address/i), "jane@gmail.com");
    await user.type(screen.getByLabelText(/^city$/i), "Kelowna");
    await user.type(screen.getByLabelText(/province/i), "BC");
    await user.type(screen.getByLabelText(/^password$/i), "Valid1!Aa");
    await user.type(screen.getByLabelText(/confirm password/i), "Valid1!Aa");

    const submit = screen.getByRole("button", { name: /create account/i });
    expect(submit).not.toBeDisabled();
  });
});
