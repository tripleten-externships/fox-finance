/**
 * API helper for tracking when a client visits the Document Upload page
 */

import { getUploadToken } from "./tokenStorage";

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
 * Sends PATCH request to api for tracking page views
 */
export function pageView() {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/upload/analytics/page-views`;
    const token = getUploadToken();

    const incrementCount = async () => {
        if (!token) {
          console.error("No upload bearer token available; not incrementing page view");
          return;
        }

        try {
            const response = await fetch(url, {
              method: "PATCH",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ page: "document-upload"})
            });

            if (!response.ok) {
              const text = await response.text();
              throw new Error(`View counter failed (${response.status}): ${text}`);
            }
        } catch (error) {
            console.error("Failed to increment visit count:", error);
        }
    }

    incrementCount();
}