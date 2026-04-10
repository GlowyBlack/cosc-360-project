export default {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  testMatch: [
    "<rootDir>/../tests/unit/frontend/**/*.test.jsx",
    "<rootDir>/../tests/frontend/**/*.test.jsx",
    "<rootDir>/../tests/frontend/**/*.test.js",
  ],
  moduleNameMapper: {
    "\\.(css|less|scss)$": "<rootDir>/__mocks__/styleMock.js",
    "\\.(png|jpg|jpeg|gif|svg|webp)$": "<rootDir>/__mocks__/fileMock.js",
  },
};
