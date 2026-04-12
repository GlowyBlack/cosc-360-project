import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  testEnvironment: "node",
  transform: {},
  roots: [
    "<rootDir>/../tests/unit/server",
    "<rootDir>/../tests/unit/frontend",
    "<rootDir>/../tests/integration/server",
    "<rootDir>/../tests/frontend",
  ],
  testMatch: ["**/*.test.js", "**/*.test.jsx"],
  modulePaths: [path.join(__dirname, "node_modules")],
};