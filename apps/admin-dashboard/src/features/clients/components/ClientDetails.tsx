import React, { useState, useEffect } from "react";
import { Badge, Button } from "@fox-finance/ui";
import { MdEdit, MdEmail, MdPhone } from "react-icons/md";
import {
  FaBuilding,
  FaChevronDown,
  FaChevronUp,
  FaLink,
  FaFile,
  FaDownload,
  FaCopy,
  FaSpinner,
} from "react-icons/fa";
import { apiClient } from "../../../lib/api";

// Type definitions based on Prisma schema
interface Client {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string | null;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

interface Upload {
  id: string;
  fileName: string;
  fileSize: number;
  s3Key: string;
  s3Bucket: string;
  fileType: string;
  uploadedAt: string;
}

interface UploadLink {
  id: string;
  token: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  uploads: Upload[];
  _count: {
    uploads: number;
  };
}

interface ClientDetailsProps {
  client: Client;
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({ client }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadLinks, setUploadLinks] = useState<UploadLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch upload links and uploads when accordion is expanded
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch upload links for this client
        const response = await apiClient(
          `/api/admin/upload-links?clientId=${client.id}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch upload links");
        }
        const data = await response.json();
        setUploadLinks(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching upload links:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen, client.id]);

  // Extract all uploads from upload links
  const allUploads = uploadLinks.flatMap((link) => link.uploads || []);

  const getStatusVariant = (
    status: Client["status"],
  ): "default" | "secondary" => {
    return status === "ACTIVE" ? "default" : "secondary";
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to copy link to clipboard
  const copyToClipboard = async (token: string) => {
    const uploadUrl = `${window.location.origin}/upload/${token}`;
    try {
      await navigator.clipboard.writeText(uploadUrl);
      // TODO: Add toast notification for success
      console.log("Link copied to clipboard");
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // Helper function to handle download
  const handleDownload = async (upload: Upload) => {
    // TODO: Implement presigned URL generation via API
    console.log("Download file:", upload.fileName);
    // Placeholder: In production, this would call an API endpoint to get a presigned S3 URL
  };

  // Helper function to download all files
  const handleDownloadAll = () => {
    // TODO: Implement bulk download functionality
    console.log("Download all files");
  };

  return (
    <div className="border border-border rounded-lg bg-muted shadow-sm mb-4 transition-colors">
      {/* COLLAPSED ROW */}
      <div className="flex items-center justify-between p-4">
        {/* CLIENT INFO */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-foreground truncate">
              {client.firstName} {client.lastName}
            </span>
            <Badge variant={getStatusVariant(client.status)}>
              {client.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5">
              <MdEmail className="w-4 h-4 fill-muted-foreground opacity-70" />
              <span className="truncate">{client.email}</span>
            </div>
            {client.phone && (
              <div className="flex items-center gap-1.5">
                <MdPhone className="w-4 h-4 fill-muted-foreground opacity-70" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.company && (
              <div className="flex items-center gap-1.5">
                <FaBuilding className="w-4 h-4 fill-muted-foreground opacity-70" />
                <span>{client.company}</span>
              </div>
            )}
          </div>
        </div>

        {/* CONTROL BUTTONS && EXPAND/COLLAPSE */}
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="secondary"
            size="icon"
            title="Generate upload link"
            aria-label="Generate upload link"
          >
            <FaLink className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            title="Edit client"
            aria-label="Edit client details"
          >
            <MdEdit className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            variant="secondary"
            size="icon"
            title={isOpen ? "Collapse details" : "Expand details"}
            aria-label={isOpen ? "Collapse details" : "Expand details"}
          >
            {isOpen ? (
              <FaChevronUp className="w-4 h-4" />
            ) : (
              <FaChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-4 border-t border-border space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <FaSpinner className="w-5 h-5 animate-spin mr-2" />
              <span>Loading data...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              Error: {error}
            </div>
          )}

          {/* Content - Only show when not loading */}
          {!isLoading && (
            <>
              {/* UPLOAD LINKS SECTION */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FaLink className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">
                      Upload Links ({uploadLinks.length})
                    </h3>
                  </div>
                </div>

                {uploadLinks.length === 0 ? (
                  <div className="p-4 bg-card border border-border rounded-lg text-center text-muted-foreground text-sm">
                    No upload links found for this client.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {uploadLinks.map((link) => {
                      const isExpired = new Date(link.expiresAt) < new Date();
                      const statusText = !link.isActive
                        ? "Inactive"
                        : isExpired
                          ? "Expired"
                          : "Active";
                      const statusColor =
                        !link.isActive || isExpired
                          ? "text-muted-foreground"
                          : "text-green-600 dark:text-green-500";

                      return (
                        <div
                          key={link.id}
                          className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FaLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-sm font-medium ${statusColor}`}
                                >
                                  {statusText}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  • {link._count.uploads} upload
                                  {link._count.uploads !== 1 ? "s" : ""}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Expires: {formatDate(link.expiresAt)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Copy link"
                            onClick={() => copyToClipboard(link.token)}
                          >
                            <FaCopy className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* DOCUMENTS/RECENT UPLOADS SECTION */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FaFile className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">
                      Documents ({allUploads.length})
                    </h3>
                  </div>
                  {allUploads.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadAll}
                      className="flex items-center gap-2"
                    >
                      <FaDownload className="w-3 h-3" />
                      Download All
                    </Button>
                  )}
                </div>

                {allUploads.length === 0 ? (
                  <div className="p-4 bg-card border border-border rounded-lg text-center text-muted-foreground text-sm">
                    No documents uploaded yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allUploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FaFile className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {upload.fileName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatFileSize(upload.fileSize)}</span>
                              <span>•</span>
                              <span>{formatDate(upload.uploadedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Download file"
                          onClick={() => handleDownload(upload)}
                        >
                          <FaDownload className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
