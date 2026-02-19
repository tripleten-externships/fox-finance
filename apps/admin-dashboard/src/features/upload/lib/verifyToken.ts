/**
 * API helper for upload token verification
 * This does NOT use the admin API client with Firebase auth
 */

/**
 * Determines the API base URL based on the current hostname
 */
function getApiBaseUrl(): string {
  const hostname = window.location.hostname;

  if (hostname === "localhost") {
    return "http://localhost:4000";
  }

  if (hostname.includes("dev.")) {
    return "https://api.dev.fox-finance.net";
  }

  return "https://api.fox-finance.net";
}

export interface VerifyTokenResponse {
  token: string;
  expiresIn: number;
  uploadLinkId: string;
  clientId: string;
}

/**
 * Verify an upload JWT token and get a bearer token
 * @param jwtToken The JWT token from the URL parameter
 * @returns Bearer token and related data
 * @throws Error if verification fails
 */
export async function verifyUploadToken(
  jwtToken: string,
): Promise<VerifyTokenResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/upload/verify?token=${encodeURIComponent(jwtToken)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid or expired token");
    }
    if (response.status === 404) {
      throw new Error("Upload link not found");
    }
    throw new Error(`Verification failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
