# How to run tests

## Backend (Jest, native ESM)

From the repo root:

```bash
cd server
npm test
```

Uses `node --experimental-vm-modules` and `server/jest.config.js`. `testMatch` resolves `../tests/...` from the `server/` folder. Tests live under `tests/unit/server/` and `tests/integration/server/`.

## Frontend (Jest + jsdom + Testing Library)

```bash
cd book-buddy
npm test
```

Uses `book-buddy/jest.config.js` with `testMatch` `../tests/...` from `book-buddy/`. Tests live under `tests/unit/frontend/` and `tests/frontend/`.

## What is covered

| File | Scope |
|------|--------|
| `tests/unit/server/auth.middleware.test.js` | `requireAuth`: missing/invalid token, success + renewed header, banned/suspended |
| `tests/unit/server/adminService.test.js` | `searchUsers` merge + counts, `listUsers`, `deleteBook` guard |
| `tests/integration/server/auth.routes.test.js` | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` (upload middleware mocked) |
| `tests/unit/frontend/registerForm.validation.test.jsx` | Password rules, mismatch, disabled submit |
| `tests/frontend/components/LoginForm.test.jsx` | Fields, submit, errors, loading |
| `tests/frontend/components/RegisterForm.test.jsx` | Fields, API call, mismatch / validation |
| `tests/frontend/components/BookForm.test.jsx` | Fields, validation, `onSubmit` payload |

## Step 1 reference (exports)

- **`server/src/middleware/auth.js`**: `requireAuth`, `optionalAuth`, `requireAdmin`, `signAccessToken` — see source for JWT + `User` + `X-Renewed-Token`.
- **`server/src/routes/authRoute.js`**: default Express router; `POST /register`, `POST /login`, `GET /me`, etc.
- **`server/src/controllers/authController.js`**: default object `AuthController` with `register`, `login`, `me`, `updateMe`, `uploadMyImage`, `getMyStats`.
- **`server/src/services/adminService.js`**: default `AdminService` object (`listUsers`, `searchUsers`, `deleteBook`, …).
- **`server/src/app.js`**: creates Express `app`, mounts routes, exports `{ app }`; skips `listen` when `NODE_ENV === "test"`.
- **Login / Register / BookForm**: under `book-buddy/src/components/...` — see imports in test files.
- **`book-buddy/src/context/AuthContext.jsx`**: `AuthProvider`, `useAuth` — `setSessionUser`, `logout`, `user`.
- **`book-buddy/src/config/api.js`**: default API base URL, `authHeader`, `apiFetch`, session flash helpers.
