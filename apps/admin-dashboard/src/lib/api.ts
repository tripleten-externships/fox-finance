import { getAuthToken } from "./authToken";

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

/**
 * API client that wraps fetch with automatic base URL prepending
 *
 * @param path - The API endpoint path (e.g., '/admin/clients')
 * @param options - Standard fetch options (method, headers, body, etc.)
 * @returns The fetch Response
 *
 * @example
 * ```typescript
 * // GET request
 * const response = await apiClient('/admin/clients');
 * const data = await response.json();
 *
 * // POST request with JSON body
 * const response = await apiClient('/admin/clients', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ name: 'John Doe' })
 * });
 * ```
 */
export async function apiClient(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;

  // Get the authentication token
  const token = getAuthToken();

  // Prepare headers with authorization if token exists
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Merge headers with options
  const requestOptions: RequestInit = {
    ...options,
    headers,
  };

  return fetch(url, requestOptions);
}
