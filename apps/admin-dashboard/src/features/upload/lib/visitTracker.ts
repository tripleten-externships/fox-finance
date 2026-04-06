/**
 * API helper for tracking when a client visits the Document Upload page
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

export function trackVisit() {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/admin/upload-links/visits/increment`;

    const incrementVisit = async () => {
        try {
            await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ page: "document-upload"}),
            })
        } catch (error) {
            console.error("Failed to increment visit count:", error);
        }
    }

    incrementVisit();
}