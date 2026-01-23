/**
 * Determines the API base URL based on the current hostname
 */
function getApiBaseUrl(): string {
  const hostname = window.location.hostname;

  if (hostname === "localhost") {
    return "http://localhost:4000";
  }

  if (hostname.includes(".dev.")) {
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

  return fetch(url, options);
}
