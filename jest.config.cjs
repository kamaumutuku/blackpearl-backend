/** @type {import('jest').Config} */
module.exports = {
  // 🧪 Test environment
  testEnvironment: "node",

  // 📂 Where tests live
  testMatch: ["**/tests/**/*.test.js"],

  // ⏱️ Some DB operations can be slow
  testTimeout: 30000,

  // 🔄 Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,

  // 🌱 Load environment variables for tests
  setupFiles: ["dotenv/config"],

  // 📊 Coverage (optional but recommended)
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "routes/**/*.js",
    "middleware/**/*.js",
    "utils/**/*.js",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],

  // 🚫 Ignore these paths
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],

  // 📦 Module resolution
  moduleFileExtensions: ["js", "json"],

  // 🧩 Handle ES Modules
  transform: {},

  // 🔕 Cleaner output
  verbose: true,
};
