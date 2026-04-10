import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginForm from "../../../book-buddy/src/components/LoginForm/LoginForm.jsx";
import { AuthProvider } from "../../../book-buddy/src/context/AuthContext.jsx";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  global.fetch = jest.fn((url) => {
    const u = String(url);
    if (u.includes("/auth/me")) {
      return Promise.resolve({ ok: false, status: 401, json: async () => ({}) });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
});

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("LoginForm", () => {
  it("renders email, password, and submit", () => {
    renderLogin();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("POST /auth/login with email and password JSON body", async () => {
    const user = userEvent.setup();
    global.fetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes("/auth/login")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            access_token: "tok123",
            user: { email: "a@gmail.com", id: "1" },
          }),
        });
      }
      if (u.includes("/auth/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ email: "a@gmail.com", id: "1" }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderLogin();

    await user.type(screen.getByLabelText(/email address/i), "a@gmail.com");
    await user.type(screen.getByLabelText(/^password$/i), "Secret1!");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/auth\/login$/),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "a@gmail.com", password: "Secret1!" }),
        })
      );
    });
    expect(localStorage.getItem("token")).toBe("tok123");
  });

  it("shows API error in alert", async () => {
    const user = userEvent.setup();
    global.fetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes("/auth/login")) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ detail: "Wrong email or password" }),
        });
      }
      if (u.includes("/auth/me")) {
        return Promise.resolve({ ok: false, status: 401, json: async () => ({}) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderLogin();
    await user.type(screen.getByLabelText(/email address/i), "a@gmail.com");
    await user.type(screen.getByLabelText(/^password$/i), "bad");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /wrong email or password/i
      );
    });
  });

  it("shows logging in state while request in flight", async () => {
    const user = userEvent.setup();
    let resolveLogin;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    global.fetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes("/auth/login")) {
        return loginPromise.then(() => ({
          ok: true,
          json: async () => ({
            access_token: "t",
            user: { email: "a@gmail.com" },
          }),
        }));
      }
      if (u.includes("/auth/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ email: "a@gmail.com" }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderLogin();
    await user.type(screen.getByLabelText(/email address/i), "a@gmail.com");
    await user.type(screen.getByLabelText(/^password$/i), "Secret1!");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(screen.getByRole("button", { name: /logging in/i })).toBeInTheDocument();
    resolveLogin();
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /logging in/i })).not.toBeInTheDocument();
    });
  });
});
