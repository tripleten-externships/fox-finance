import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(__dirname, "../../../.env.test");
dotenv.config({ path: envPath });

process.env.NODE_ENV = "test";
process.env.MALWARE_SCAN_DELAY_MS =
  process.env.MALWARE_SCAN_DELAY_MS || "10";

const required = [
  "DATABASE_URL",
  "UPLOAD_TOKEN_SECRET",
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "S3_UPLOADS_BUCKET",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required env vars for integration tests: ${missing.join(", ")}. ` +
      "Create apps/api/.env.test based on apps/api/.env.test.example.",
  );
}

const timeout = Number(process.env.INTEGRATION_TEST_TIMEOUT_MS || 60000);
jest.setTimeout(timeout);
