import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { verifyUploadToken } from "../lib/verifyToken";
import { setUploadAuth, getUploadAuth } from "../lib/tokenStorage";
import { Card } from "@fox-finance/ui";

type VerificationState = "loading" | "success" | "error";

export function DocumentUpload() {
  const { token } = useParams();
  const [state, setState] = useState<VerificationState>("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const verifyToken = async () => {
      // Check if we already have a valid token in storage
      const existingAuth = getUploadAuth();
      if (existingAuth) {
        setState("success");
        return;
      }

      if (!token) {
        setError("No token provided in URL");
        setState("error");
        return;
      }

      try {
        // Verify the JWT token and get bearer token
        const response = await verifyUploadToken(token);

        // Calculate expiration timestamp
        const expiresAt = Date.now() + response.expiresIn * 1000;

        // Store the authentication data
        setUploadAuth({
          bearerToken: response.token,
          expiresAt,
          uploadLinkId: response.uploadLinkId,
          clientId: response.clientId,
        });

        setState("success");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Token verification failed";
        setError(message);
        setState("error");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        {state === "loading" && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-600">Verifying your access...</p>
          </div>
        )}

        {state === "error" && (
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Please check your upload link or contact support if you believe
              this is an error.
            </p>
          </div>
        )}

        {state === "success" && (
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-12 w-12 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Document Upload
            </h1>
            <p className="text-gray-600">
              Your access has been verified successfully.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
