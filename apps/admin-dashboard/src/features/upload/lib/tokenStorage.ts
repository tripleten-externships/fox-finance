/**
 * Token storage for upload authentication
 * This is separate from Firebase admin auth tokens
 */

const UPLOAD_TOKEN_KEY = "upload_bearer_token";
const UPLOAD_TOKEN_EXPIRES_KEY = "upload_token_expires";
const UPLOAD_LINK_ID_KEY = "upload_link_id";
const CLIENT_ID_KEY = "upload_client_id";

export interface UploadAuthData {
  bearerToken: string;
  expiresAt: number;
  uploadLinkId: string;
  clientId: string;
}

/**
 * Store upload authentication data in localStorage
 */
export function setUploadAuth(data: UploadAuthData): void {
  localStorage.setItem(UPLOAD_TOKEN_KEY, data.bearerToken);
  localStorage.setItem(UPLOAD_TOKEN_EXPIRES_KEY, data.expiresAt.toString());
  localStorage.setItem(UPLOAD_LINK_ID_KEY, data.uploadLinkId);
  localStorage.setItem(CLIENT_ID_KEY, data.clientId);
}

/**
 * Get the current upload bearer token
 * Returns null if token doesn't exist or has expired
 */
export function getUploadToken(): string | null {
  const token = localStorage.getItem(UPLOAD_TOKEN_KEY);
  const expiresAt = localStorage.getItem(UPLOAD_TOKEN_EXPIRES_KEY);

  if (!token || !expiresAt) {
    return null;
  }

  const expiresAtNum = parseInt(expiresAt, 10);
  if (Date.now() >= expiresAtNum) {
    clearUploadAuth();
    return null;
  }

  return token;
}

/**
 * Get all upload auth data
 */
export function getUploadAuth(): UploadAuthData | null {
  const token = getUploadToken();
  const uploadLinkId = localStorage.getItem(UPLOAD_LINK_ID_KEY);
  const clientId = localStorage.getItem(CLIENT_ID_KEY);
  const expiresAt = localStorage.getItem(UPLOAD_TOKEN_EXPIRES_KEY);

  if (!token || !uploadLinkId || !clientId || !expiresAt) {
    return null;
  }

  return {
    bearerToken: token,
    expiresAt: parseInt(expiresAt, 10),
    uploadLinkId,
    clientId,
  };
}

/**
 * Clear upload authentication data
 */
export function clearUploadAuth(): void {
  localStorage.removeItem(UPLOAD_TOKEN_KEY);
  localStorage.removeItem(UPLOAD_TOKEN_EXPIRES_KEY);
  localStorage.removeItem(UPLOAD_LINK_ID_KEY);
  localStorage.removeItem(CLIENT_ID_KEY);
}
