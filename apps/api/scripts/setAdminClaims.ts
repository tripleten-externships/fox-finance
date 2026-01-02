#!/usr/bin/env ts-node

import "dotenv/config";
import { admin } from "../src/firebase";

async function setAdminClaims() {
  const uid = "VySjei22qmO6xSpMs9GyXgg2EKU2"; // Your user ID from the logs

  try {
    if (!admin) {
      throw new Error("Firebase admin not initialized");
    }

    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, { role: "ADMIN" });
    console.log("✅ Admin claims set successfully for user:", uid);

    // Verify the claims were set
    const user = await admin.auth().getUser(uid);
    console.log("User custom claims:", user.customClaims);

    console.log("🔄 User needs to get a fresh token (logout/login or refresh)");
  } catch (error) {
    console.error("❌ Error setting custom claims:", error);
  }
}

setAdminClaims();
