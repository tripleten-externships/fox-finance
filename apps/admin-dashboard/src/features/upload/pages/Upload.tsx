import { useState } from "react";
import { FaArrowUpFromBracket } from "react-icons/fa6";
import FileDropzone from "../../upload-portal/components/FileDropzone";

type RequiredDoc = {
  id: string;
  title: string;
  helper: string;
};

type UploadProps = {
  clientName: string;
  brandingCompanyName: string | null;
  requiredDocs: RequiredDoc[];
};

export function Upload({
  clientName,
  brandingCompanyName,
  requiredDocs,
}: UploadProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Document Upload
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Please upload the required documents to continue with your
              application.
            </p>
            {brandingCompanyName && (
              <p className="mt-1 text-xs text-gray-500">{brandingCompanyName}</p>
            )}
          </div>
          {clientName ? (
            <div className="text-left sm:text-right sm:shrink-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Client
              </p>
              <p className="text-xl font-semibold text-gray-900">{clientName}</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">
              Required Documents
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              All documents below must be uploaded to proceed
            </p>

            <div className="mt-4 space-y-3">
              {requiredDocs.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No required documents were specified for this upload link.
                </p>
              ) : (
                requiredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-md border border-gray-200 bg-white px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {doc.title}
                      </p>
                      {doc.helper ? (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {doc.helper}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50"
                        onClick={() => {
                          console.log("Upload clicked:", doc.id);
                        }}
                      >
                        <FaArrowUpFromBracket
                          className="h-3 w-3"
                          aria-hidden="true"
                        />
                        Upload File
                      </button>
                      <FileDropzone maxFiles={3}/>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">
              Additional Documents
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Upload any supporting documents (optional)
            </p>

            <div className="mt-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50"
                onClick={() => {
                  console.log("Add documents clicked");
                }}
              >
                <span className="text-base leading-none" aria-hidden>
                  +
                </span>
                Add Documents
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">
              Disclosure Statement
            </h2>

            <div className="mt-3 text-xs text-gray-600">
              <p>
                By submitting these documents, you authorize us to verify the
                information provided and acknowledge that:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  All documents provided are true, accurate, and complete to the
                  best of your knowledge
                </li>
                <li>
                  We may use third-party services to verify your identity and
                  the authenticity of your documents
                </li>
                <li>
                  Your information will be stored securely and used only for the
                  purposes stated in our privacy policy
                </li>
                <li>
                  False or misleading information may result in rejection of
                  your application
                </li>
              </ul>
            </div>

            <label className="mt-4 flex items-start gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                I have read and agree to the disclosure statement above and
                consent to the verification of my documents
              </span>
            </label>
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!agreed}
              className={[
                "rounded-md px-4 py-2 text-xs font-semibold",
                agreed
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "bg-gray-300 text-white cursor-not-allowed",
              ].join(" ")}
              onClick={() => {
                console.log("Submit clicked");
              }}
            >
              Submit Documents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
