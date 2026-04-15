const PLACEHOLDER_SECRET = "your-secret-key-here-change-in-production";

function resolveUploadTokenSecret(): string {
  const raw = process.env.UPLOAD_TOKEN_SECRET?.trim();
  const isProd = process.env.NODE_ENV === "production";

  if (!raw) {
    if (isProd) {
      throw new Error(
        "UPLOAD_TOKEN_SECRET must be set to a strong random value in production (e.g. openssl rand -base64 32).",
      );
    }
    return PLACEHOLDER_SECRET;
  }

  if (isProd && raw === PLACEHOLDER_SECRET) {
    throw new Error(
      "UPLOAD_TOKEN_SECRET must not use the documented placeholder value in production.",
    );
  }

  return raw;
}

export const UPLOAD_TOKEN_SECRET = resolveUploadTokenSecret();
