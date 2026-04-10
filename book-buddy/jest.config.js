import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  testEnvironment: "jsdom",
  /** Include repo-root tests/ so files outside book-buddy are indexed (default roots is only <rootDir>). */
  roots: ["<rootDir>", path.join(__dirname, "..", "tests")],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  testMatch: [
    path.join(__dirname, "../tests/unit/frontend/**/*.test.jsx"),
    path.join(__dirname, "../tests/frontend/**/*.test.jsx"),
    path.join(__dirname, "../tests/frontend/**/*.test.js"),
  ],
  moduleNameMapper: {
    "\\.(css|less|scss)$": "<rootDir>/__mocks__/styleMock.js",
    "\\.(png|jpg|jpeg|gif|svg|webp)$": "<rootDir>/__mocks__/fileMock.js",
  },
  /** Tests live under repo-root tests/; resolve packages from this app. */
  modulePaths: [path.join(__dirname, "node_modules")],
};
