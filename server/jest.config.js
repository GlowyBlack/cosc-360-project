import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Tests live under repo-root tests/; resolve npm deps from this package. */
export default {
  testEnvironment: "node",
  transform: {},
  roots: [
    "<rootDir>/../tests/unit/server",
    "<rootDir>/../tests/integration/server",
  ],
  testMatch: ["**/*.test.js"],
  modulePaths: [path.join(__dirname, "node_modules")],
};
