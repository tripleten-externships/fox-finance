/**
 * Authentication token storage utilities
 * Manages Firebase ID token persistence in localStorage
 */

const AUTH_TOKEN_KEY = "firebase_auth_token";

/**
 * Store the authentication token in localStorage
 * @param token - Firebase ID token to store
 */
export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Retrieve the authentication token from localStorage
 * @returns The stored token or null if not found
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Remove the authentication token from localStorage
 */
export function removeAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}
