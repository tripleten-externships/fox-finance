import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/src"],
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/src/tests/integration"],
  collectCoverageFrom: [
    "src/routes/**/*.ts",
    "src/middleware/auth.ts",
    "src/middleware/errorHandler.ts",
    "src/middleware/uploadAuth.ts",
    "src/middleware/validation.ts",
    "src/schemas/**/*.ts",
    "!src/**/index.ts",
    "!src/**/__tests__/**",
  ],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov", "json-summary"],
  moduleFileExtensions: ["ts", "js", "json"],
};

export default config;
