module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "backend/**/*.js",
    "!backend/tests/**",
    "!backend/db/seed.js",
  ],
  testMatch: ["**/backend/tests/**/*.test.js"],
  verbose: true,
};
