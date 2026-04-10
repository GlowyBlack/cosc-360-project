# Book Buddy — Test Suite

## How to Run

### Backend
```bash
cd server
npm test
```

### Frontend
```bash
cd book-buddy
npm test
```

---

## What's Tested

### Backend Unit Tests
| Test File | What It Covers |
|-----------|----------------|
| `tests/unit/server/auth.middleware.test.js` | Valid token, missing token, expired token, banned/suspended user |
| `tests/unit/server/adminService.test.js` | User search, pagination, delete book blocked when active borrow request |

### Backend Integration Tests
| Test File | What It Covers |
|-----------|----------------|
| `tests/integration/server/auth.routes.test.js` | Register (success + duplicate email + missing fields), Login (success + wrong password), Protected route without token |

### Frontend Tests
| Test File | What It Covers |
|-----------|----------------|
| `tests/unit/frontend/registerForm.validation.test.jsx` | Password rules, password mismatch, submit disabled on invalid input |
| `tests/frontend/components/LoginForm.test.jsx` | Fields render, form submission, API error message, loading state |
| `tests/frontend/components/RegisterForm.test.jsx` | Fields render, valid submission, password mismatch blocks API call |
| `tests/frontend/components/BookForm.test.jsx` | Fields render, required field validation, submit payload shape |

---

## Coverage Summary

| Requirement | Covered By |
|-------------|------------|
| Core functionality | Auth routes, login/register flows |
| Logic-heavy code | Auth middleware, admin service |
| Edge cases | Duplicate email, missing fields, bad token, password mismatch |
| Critical user flows | Register → Login → Protected route |
| Frontend components | LoginForm, RegisterForm, BookForm |