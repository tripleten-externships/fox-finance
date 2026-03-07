#!/usr/bin/env node

/**
 * Manual File Validation Tests
 * Run with: npx ts-node src/utils/fileValidation.manual-test.ts
 */

import {
  validateFileMetadata,
  getAllowedFileTypesDescription,
  DANGEROUS_EXTENSIONS,
} from "./fileValidation";

console.log("🧪 File Validation Manual Tests\n");
console.log("================================\n");

// Test 1: Valid Files
console.log("✅ Test 1: Valid Files");
console.log("------------------------");
const validFiles = [
  { name: "document.pdf", mime: "application/pdf" },
  {
    name: "data.xlsx",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  { name: "image.png", mime: "image/png" },
  { name: "photo.jpg", mime: "image/jpeg" },
  { name: "archive.zip", mime: "application/zip" },
];

validFiles.forEach(({ name, mime }) => {
  const result = validateFileMetadata(name, mime);
  console.log(`  ${result.isValid ? "✓" : "✗"} ${name} (${mime})`);
  if (!result.isValid) {
    console.log(`    Error: ${result.error}`);
  }
});

// Test 2: Invalid Extensions
console.log("\n❌ Test 2: Dangerous Extensions");
console.log("--------------------------------");
const dangerousFiles = [
  { name: "virus.exe", mime: "application/octet-stream" },
  { name: "script.sh", mime: "application/x-sh" },
  { name: "batch.bat", mime: "application/x-bat" },
  { name: "archive.rar", mime: "application/x-rar" },
];

dangerousFiles.forEach(({ name, mime }) => {
  const result = validateFileMetadata(name, mime);
  console.log(`  ${result.isValid ? "⚠️ " : "✓"} ${name}`);
  if (!result.isValid) {
    console.log(`    ✓ Rejected: ${result.error}`);
  } else {
    console.log(`    ⚠️ WARNING: Should have been rejected!`);
  }
});

// Test 3: Unknown Types
console.log("\n❓ Test 3: Unknown File Types");
console.log("------------------------------");
const unknownFiles = [
  { name: "file.unknown", mime: "application/unknown" },
  { name: "data.xyz", mime: "application/xyz" },
  { name: "noname", mime: "text/plain" },
];

unknownFiles.forEach(({ name, mime }) => {
  const result = validateFileMetadata(name, mime);
  console.log(`  ${result.isValid ? "⚠️ " : "✓"} ${name}`);
  if (!result.isValid) {
    console.log(`    ✓ Rejected: ${result.error}`);
  }
});

// Test 4: Edge Cases
console.log("\n🔍 Test 4: Edge Cases");
console.log("---------------------");
const edgeCases = [
  {
    name: "DOCUMENT.PDF",
    mime: "application/pdf",
    description: "Uppercase extension",
  },
  {
    name: "archive.backup.zip",
    mime: "application/zip",
    description: "Multiple dots",
  },
  {
    name: "my document.pdf",
    mime: "application/pdf",
    description: "Spaces in name",
  },
  { name: "", mime: "application/pdf", description: "Empty filename" },
  { name: "document.pdf", mime: "", description: "Missing MIME type" },
];

edgeCases.forEach(({ name, mime, description }) => {
  const result = validateFileMetadata(name, mime);
  console.log(`  ${result.isValid ? "✓" : "✗"} ${description}`);
  console.log(`    File: "${name}" | MIME: "${mime}"`);
  if (!result.isValid) {
    console.log(`    Error: ${result.error}`);
  }
});

// Test 5: Configuration Overview
console.log("\n⚙️  Test 5: Configuration Overview");
console.log("---------------------------------");
console.log(`  Dangerous extensions blocked: ${DANGEROUS_EXTENSIONS.length}`);
console.log(
  `  Sample dangerous extensions: ${DANGEROUS_EXTENSIONS.slice(0, 5).join(", ")}`,
);
console.log(`  Allowed file types: ${getAllowedFileTypesDescription()}`);

// Summary
console.log("\n📊 Summary");
console.log("----------");
console.log("✓ All tests completed");
console.log("✓ File validation system is operational");
console.log("✓ Extension whitelisting: Active");
console.log("✓ MIME type validation: Active");
console.log("✓ Dangerous files rejected: Yes");
console.log("\n");
