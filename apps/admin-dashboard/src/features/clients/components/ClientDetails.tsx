import React, { useState, useEffect } from "react";

interface ClientDetailsProps {
  clientId: string;
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({ clientId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  /* Mock data until API is ready */
  useEffect(() => {
    if (!data) {
      setLoading(true);
      setTimeout(() => {
        setData({
          client: {
            email: "mock@example.com",
            firstName: "Mock",
            lastName: "Client",
            company: "Acme Corp",
            phone: "555-1234",
            status: "In Progress",
          },
          uploadLinks: [
            { id: "link1", token: "abc123", status: "Active" },
            { id: "link2", token: "xyz789", status: "Expired" },
          ],
          recentUploads: [
            { id: "u1", fileName: "id-front.jpg", size: "239.92 KB" },
            { id: "u2", fileName: "id-back.jpg", size: "233.31 KB" },
            { id: "u3", fileName: "pay-stub-jan.pdf", size: "500.33 KB" },
            { id: "u4", fileName: "bank-statement.pdf", size: "770.95 KB" },
            { id: "u5", fileName: "ssa-letter.pdf", size: "337.58 KB" },
          ],
        });
        setLoading(false);
      }, 500);
    }
  }, [isOpen, data]);

  // useEffect(() => {
  //   fetch(`/api/admin/clients/${clientId}/summary`)
  //     .then((res) => res.json())
  //     .then((json) => setData({ client: json }))
  //     .catch(() => setError("Failed to load client summary"));
  // }, [clientId]);

  // useEffect(() => {
  //   if (isOpen && data && !data.recentUploads) {
  //     fetch(`/api/admin/clients/${clientId}/uploads`)
  //       .then((res) => res.json())
  //       .then((json) => setData((prev: any) => ({ ...prev, recentUploads: json })))
  //       .catch(() => setError("Failed to load uploads"));
  //   }
  // }, [isOpen, clientId, data]);

  const getStatus = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-black text-white rounded px-2 py-0.5 text-xs";
      case "Not Started":
        return "bg-gray-300 text-black rounded px-2 py-0.5 text-xs";
      case "Approved":
        return "bg-green-100 text-green-700 rounded px-2 py-0.5 text-xs";
      case "Rejected":
        return "bg-red-600 text-white rounded px-2 py-0.5 text-xs";
      default:
        return "bg-gray-200 text-gray-600 rounded px-3 py-0.5 text-xs";
    }
  };

  return (
    <div className="border rounded-md bg-gray-100 shadow-sm mb-4">
      {/* COLLAPSED ROW */}
      <div className="flex items-center justify-between p-4">
        {/* CLIENT INFO */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-black">
              {data?.client?.firstName} {data?.client?.lastName}
            </span>
            {data?.client?.status && (
              <span className={getStatus(data.client.status)}>
                {data.client.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <img src="/icons/email.svg" alt="Email" className="w-4 h-4" />
              <span>{data?.client?.email}</span>
            </div>
            <div className="flex items-center gap-1">
              <img src="/icons/phone.svg" alt="Phone" className="w-4 h-4" />
              <span>{data?.client?.phone}</span>
            </div>
          </div>
        </div>
        {/* CONTROL BUTTONS && EXPAND/COLLAPSE */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded  bg-gray-200 hover:bg-gray-300"
            title="Generate upload link"
          >
            <img
              src="/icons/link.svg"
              alt="Generate Link"
              className="w-4 h-4"
            />
          </button>
          <button
            className="p-2 rounded cursor-pointer bg-gray-200 hover:bg-gray-300"
            title="Edit client"
          >
            <img src="/icons/edit.svg" alt="Edit Details" className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            className="p-2 rounded cursor-pointer text-gray-600 hover:text-gray-900"
            title="Toggle details"
          >
            <img
              src={isOpen ? "/icons/up-arrow.svg" : "/icons/arrow.svg"}
              alt="Toggle"
              className="w-4 h-4"
            />
          </button>
        </div>
      </div>
      {/* EXPANDED CONTENT */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-4 border-t">
          {loading && <p className="text-gray-500">Loading documents...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {data?.recentUploads && (
            <>
              {/* EXPANDED HEADER */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  <img src="/icons/file.svg" className="w-4 h-4" />
                  Documents ({data.recentUploads.length})
                </div>

                <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black">
                  <img src="/icons/download.svg" className="w-4 h-4" />
                  Download All
                </button>
              </div>

              {/* EXPANDED DOC LIST */}
              <div className="space-y-3">
                {data.recentUploads.map((file: any) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    {/* FILE NAME & ICONS */}
                    <div className="flex items-center gap-3">
                      <img
                        src="/icons/file.svg"
                        alt="file"
                        className="w-6 h-6 text-gray-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {file.fileName}
                        </p>
                        <p className="text-sm text-gray-500">{file.size}</p>
                      </div>
                    </div>

                    {/* DOWNLOAD ICON */}
                    <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black">
                      <img src="/icons/download.svg" className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {/* UPLOAD LINKS TABLE */}
      {data?.uploadLinks && (
        <div className="p-4 border-t bg-gray-50">
          {/* HEADER */}
          <div className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
            <img src="/icons/link-intact.svg" className="w-4 h-4" />
            Upload Links ({data.uploadLinks.length})
          </div>

          {/* LINKS LIST */}
          <div className="space-y-2">
            {data.uploadLinks.map((link: any) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50"
              >
                {/* LEFT */}
                <div className="flex items-center gap-3">
                  <img
                    src="/icons/link.svg"
                    className="w-5 h-5 text-gray-500"
                  />

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {link.id}
                    </p>
                    <p className="text-xs text-gray-500">{link.token}</p>
                  </div>
                </div>

                {/* RIGHT */}
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    link.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {link.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
