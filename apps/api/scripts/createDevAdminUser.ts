#!/usr/bin/env ts-node

import "dotenv/config";
import { Role } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { admin } from "../src/firebase";
import * as fs from "fs";
import * as path from "path";

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const email = getArg("--email");
  const name = getArg("--name");
  const password = getArg("--password") || "password123"; // Default dev password
  const roleArg = (getArg("--role") || "ADMIN").toUpperCase();

  if (!email || !name) {
    console.error(
      'Usage: ts-node scripts/createDevAdminUser.ts --email <email> --name "<name>" [--password <password>] [--role ADMIN|USER]'
    );
    console.error(
      'If --password is omitted, default password "password123" will be used'
    );
    process.exit(1);
  }

  if (!Object.prototype.hasOwnProperty.call(Role, roleArg)) {
    console.error(
      `Invalid role "${roleArg}". Must be one of: ${Object.keys(Role).join(
        ", "
      )}`
    );
    process.exit(1);
  }

  const role = Role[roleArg as keyof typeof Role];

  if (!admin) {
    console.error(
      "Firebase admin is not initialized. Check FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL env vars."
    );
    process.exit(1);
  }

  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) {
    console.error("FIREBASE_API_KEY is not set in environment (.env).");
    process.exit(1);
  }

  try {
    console.log("➡️  Ensuring Firebase user exists…");

    // 1. Create or fetch Firebase Auth user
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(email);
      console.log(
        `ℹ️  Firebase user already exists with UID: ${firebaseUser.uid}`
      );

      // Update existing user with password if it doesn't have one
      console.log("➡️  Setting/updating password for existing user…");
      await admin.auth().updateUser(firebaseUser.uid, { password });
      console.log("✅ Password updated for existing user");
    } catch (err: any) {
      if (err?.code === "auth/user-not-found") {
        firebaseUser = await admin.auth().createUser({
          email,
          displayName: name,
          password,
        });
        console.log(
          `✅ Created Firebase user with UID: ${firebaseUser.uid} and password`
        );
      } else {
        console.error("❌ Error fetching/creating Firebase user:", err);
        process.exit(1);
      }
    }

    const uid = firebaseUser.uid;

    // 2. Upsert into Prisma User table
    console.log("➡️  Upserting user into Prisma…");

    const user = await prisma.user.upsert({
      where: { id: uid },
      update: { email, name, role },
      create: { id: uid, email, name, role },
    });

    console.log(
      `✅ Prisma user upserted. id=${user.id}, email=${user.email}, role=${user.role}`
    );

    // 3. Create a custom token
    console.log("➡️  Creating Firebase custom token…");
    const customToken = await admin.auth().createCustomToken(uid);

    // 4. Exchange custom token for ID token via Firebase REST API
    console.log("➡️  Exchanging custom token for ID token via REST…");

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(
        "❌ Failed to exchange custom token for ID token:",
        response.status,
        text
      );
      process.exit(1);
    }

    const data: any = await response.json();
    const idToken = data.idToken;
    const refreshToken = data.refreshToken;

    if (!idToken) {
      console.error("❌ No idToken returned from Firebase token exchange.");
      process.exit(1);
    }

    // 5. Save credentials to a .gitignored folder
    const outDir = path.resolve(process.cwd(), "scripts/credentials");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const safeEmail = email.replace(/[^a-zA-Z0-9._-]/g, "_");
    const outPath = path.join(outDir, `${safeEmail}.credentials.json`);

    const payload = {
      email,
      uid,
      role,
      password, // Include password in credentials file for easy reference
      idToken,
      refreshToken,
      createdAt: new Date().toISOString(),
    };

    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");

    console.log("✅ Dev credentials written to:");
    console.log(`   ${outPath}`);
    console.log("\nFrontend Login Credentials:");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log("\nAPI Authentication Token for Apollo Sandbox/Postman:");
    console.log("  {");
    console.log('    "authorization": "Bearer ' + idToken + '"');
    console.log("  }");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
