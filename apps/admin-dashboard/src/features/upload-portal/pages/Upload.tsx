import { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@fox-finance/ui";
import { verifyUploadToken } from "../../upload/lib/verifyToken";
import { setUploadAuth } from "../../upload/lib/tokenStorage";
import { pageView } from "../../upload/lib/pageView";

type VerificationState = "loading" | "success" | "error";

type UploadPortalData = {
  clientName: string;
  companyName: string;
  instructions: string;
  requestedDocuments: Array<{
    id: string;
    title: string;
    helper?: string | null;
  }>;
};

export function UploadPortal() {
  const { token } = useParams();
  const [state, setState] = useState<VerificationState>("loading");
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<UploadPortalData | null>(null);
  const visitTrackedRef = useRef(false);

  const brandName = useMemo(() => {
    if (data?.companyName) return data.companyName;
    return "Fox Finance";
  }, [data?.companyName]);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("No token provided in URL");
        setState("error");
        return;
      }

      try {
        const response = await verifyUploadToken(token);

        const expiresAt = Date.now() + response.expiresIn * 1000;
        setUploadAuth({
          bearerToken: response.token,
          expiresAt,
          uploadLinkId: response.uploadLinkId,
          clientId: response.clientId,
        });

        setData({
          clientName: response.clientName,
          companyName: response.branding.companyName || "",
          instructions: "Please upload the requested documents below.",
          requestedDocuments: response.requestedDocuments || [],
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


  {/* Track client's page visit on success */}
  useEffect(() => {
    // Check if the token validation succeeded or ref is true
    if (state !== "success" || visitTrackedRef.current) {
      return;
    }
    // If state === "success", ref switches to true and guards against page view counter incrementing twice
    visitTrackedRef.current = true;
    pageView();
  }, [ state ]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {brandName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Secure Document Upload
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            This portal is for clients only. No login required.
          </p>
        </div>

        <Card className="w-full p-8">
          {state === "loading" && (
            <div className="text-center">
              <div className="inline-flex h-12 w-12 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
              <p className="mt-4 text-sm text-slate-600">
                Verifying your access...
              </p>
            </div>
          )}

          {state === "error" && (
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-50 text-red-600">
                <svg
                  className="h-12 w-12 p-2"
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
              <h2 className="text-xl font-semibold text-slate-900">
                Link not valid
              </h2>
              <p className="mt-2 text-sm text-slate-600">{error}</p>
              <p className="mt-3 text-xs text-slate-500">
                Please request a new link or contact support.
              </p>
            </div>
          )}

          {state === "success" && data && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-slate-500">Client</p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {data.clientName || "Client"}
                </h2>
                {data.companyName && (
                  <p className="mt-1 text-sm text-slate-500">
                    {data.companyName}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Instructions
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {data.instructions}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Requested documents
                </p>
                <ul className="mt-3 space-y-3">
                  {data.requestedDocuments.length === 0 && (
                    <li className="text-sm text-slate-500">
                      No documents requested.
                    </li>
                  )}
                  {data.requestedDocuments.map((doc) => (
                    <li
                      key={doc.id}
                      className="rounded-lg border border-slate-200 bg-white p-3"
                    >
                      <div className="text-sm font-medium text-slate-900">
                        {doc.title}
                      </div>
                      {doc.helper && (
                        <p className="mt-1 text-xs text-slate-500">
                          {doc.helper}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                Upload controls will appear here once we wire the file picker in
                the next step.
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
