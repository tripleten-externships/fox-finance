import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/src/tests/integration"],
  setupFilesAfterEnv: ["<rootDir>/src/tests/integration/setup.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
};

export default config;
