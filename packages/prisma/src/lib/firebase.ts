import * as admin from "firebase-admin";

let firebaseAdmin: typeof admin | null = null;

// Check if all required Firebase credentials are present
if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_CLIENT_EMAIL
) {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
    firebaseAdmin = admin;
    console.log("✅ Firebase initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", error);
    firebaseAdmin = null;
  }
} else {
  console.warn(
    "⚠️  Firebase credentials not configured - authentication disabled"
  );
}

export { firebaseAdmin as admin };
