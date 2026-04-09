import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  toast,
} from "@fox-finance/ui";
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
  FaTrash,
  FaRedo,
  FaExclamationCircle,
} from "react-icons/fa";
import { apiClient } from "../../../lib/api";
import { formatPhoneNumber } from "../../../lib/phoneUtils";
import CreateLinkForm from "../../upload-links/components/CreateLinkForm";
import CreateClientForm from "./CreateClientForm";

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
  fileSize: number | string;
  s3Key: string;
  s3Bucket: string;
  fileType: string;
  uploadedAt: string;
  status: "UPLOADING" | "SCANNING" | "PROCESSING" | "READY" | "FAILED";
  progress: number;
  errorMessage?: string | null;
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
  onClientUpdated?: () => void; // Callback to refresh client list
  onClientDeleted?: () => void; // Callback when client is deleted
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({
  client,
  onClientUpdated,
  onClientDeleted,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [uploadLinks, setUploadLinks] = useState<UploadLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [retryingUploadId, setRetryingUploadId] = useState<string | null>(null);
  const [selectedUploadIds, setSelectedUploadIds] = useState<string[]>([]);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [bulkDownloadProgress, setBulkDownloadProgress] = useState(0);
  const bulkDownloadAbortRef = useRef<AbortController | null>(null);

  const MAX_BULK_DOWNLOAD_FILES = 50;
  const MAX_BULK_DOWNLOAD_BYTES = 100 * 1024 * 1024;

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

  const selectedUploads = useMemo(
    () => allUploads.filter((upload) => selectedUploadIds.includes(upload.id)),
    [allUploads, selectedUploadIds],
  );

  const selectedTotalBytes = useMemo(
    () =>
      selectedUploads.reduce((sum, upload) => {
        const size =
          typeof upload.fileSize === "number"
            ? upload.fileSize
            : Number(upload.fileSize);
        return sum + (Number.isFinite(size) ? size : 0);
      }, 0),
    [selectedUploads],
  );

  const isOverBulkSizeLimit = selectedTotalBytes > MAX_BULK_DOWNLOAD_BYTES;
  const areAllUploadsSelected =
    allUploads.length > 0 && selectedUploadIds.length === allUploads.length;

  useEffect(() => {
    // Prune selections that no longer exist after list refresh.
    setSelectedUploadIds((prev) => {
      const next = prev.filter((selectedId) =>
        allUploads.some((upload) => upload.id === selectedId),
      );

      if (next.length === prev.length && next.every((id, idx) => id === prev[idx])) {
        return prev;
      }

      return next;
    });
  }, [allUploads]);

  const getStatusVariant = (
    status: Client["status"],
  ): "default" | "secondary" => {
    return status === "ACTIVE" ? "default" : "secondary";
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number | string): string => {
    const size = typeof bytes === "number" ? bytes : Number(bytes);
    if (!Number.isFinite(size) || size <= 0) return "0 B";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getUploadStatusLabel = (status: Upload["status"]): string => {
    switch (status) {
      case "UPLOADING":
        return "Uploading";
      case "SCANNING":
        return "Scanning";
      case "PROCESSING":
        return "Processing";
      case "READY":
        return "Ready";
      case "FAILED":
        return "Failed";
      default:
        return status;
    }
  };

  const getUploadStatusBadgeClass = (status: Upload["status"]): string => {
    switch (status) {
      case "UPLOADING":
        return "bg-blue-600 text-white hover:bg-blue-700";
      case "SCANNING":
      case "PROCESSING":
        return "bg-yellow-500 text-black hover:bg-yellow-600";
      case "READY":
        return "bg-green-600 text-white hover:bg-green-700";
      case "FAILED":
        return "bg-red-600 text-white hover:bg-red-700";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const isUploadInProgress = (status: Upload["status"]): boolean =>
    status === "UPLOADING" || status === "SCANNING" || status === "PROCESSING";

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
    await handleDownloadSelected([upload.id]);
  };

  const getDownloadFileName = (response: Response): string => {
    const contentDisposition = response.headers.get("Content-Disposition");
    const fileNameMatch = contentDisposition?.match(/filename="?([^"]+)"?/i);
    return fileNameMatch?.[1] || "uploads.zip";
  };

  const saveBlobAsFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSelected = async (overrideIds?: string[]) => {
    const uploadIds = overrideIds ?? selectedUploadIds;

    if (uploadIds.length === 0) {
      return;
    }

    if (uploadIds.length > MAX_BULK_DOWNLOAD_FILES) {
      toast.error(`You can only download up to ${MAX_BULK_DOWNLOAD_FILES} files at once.`);
      return;
    }

    const uploadMap = new Map(allUploads.map((upload) => [upload.id, upload]));
    const totalBytes = uploadIds.reduce((sum, id) => {
      const upload = uploadMap.get(id);
      if (!upload) return sum;
      const size =
        typeof upload.fileSize === "number"
          ? upload.fileSize
          : Number(upload.fileSize);
      return sum + (Number.isFinite(size) ? size : 0);
    }, 0);

    if (totalBytes > MAX_BULK_DOWNLOAD_BYTES) {
      toast.error("Selected files exceed the 100MB limit.");
      return;
    }

    const abortController = new AbortController();
    bulkDownloadAbortRef.current = abortController;
    setIsBulkDownloading(true);
    setBulkDownloadProgress(5);

    const interval = window.setInterval(() => {
      setBulkDownloadProgress((prev) => (prev >= 90 ? prev : prev + 5));
    }, 300);

    try {
      const response = await apiClient("/api/admin/uploads/bulk-download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uploadIds }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to create ZIP archive");
      }

      const blob = await response.blob();
      setBulkDownloadProgress(100);
      saveBlobAsFile(blob, getDownloadFileName(response));
      toast.success("Download started");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        toast("Download canceled");
      } else {
        toast.error(
          err instanceof Error ? err.message : "Bulk download failed",
        );
      }
    } finally {
      window.clearInterval(interval);
      setIsBulkDownloading(false);
      setBulkDownloadProgress(0);
      bulkDownloadAbortRef.current = null;
    }
  };

  const cancelBulkDownload = () => {
    bulkDownloadAbortRef.current?.abort();
  };

  const toggleUploadSelection = (uploadId: string, checked: boolean) => {
    setSelectedUploadIds((prev) => {
      if (checked) {
        if (prev.length >= MAX_BULK_DOWNLOAD_FILES) {
          toast.error(`Maximum ${MAX_BULK_DOWNLOAD_FILES} files per batch.`);
          return prev;
        }
        if (prev.includes(uploadId)) {
          return prev;
        }
        return [...prev, uploadId];
      }
      return prev.filter((id) => id !== uploadId);
    });
  };

  const toggleSelectAllUploads = (checked: boolean) => {
    if (!checked) {
      setSelectedUploadIds([]);
      return;
    }
    setSelectedUploadIds(allUploads.slice(0, MAX_BULK_DOWNLOAD_FILES).map((upload) => upload.id));
    if (allUploads.length > MAX_BULK_DOWNLOAD_FILES) {
      toast(`Only the first ${MAX_BULK_DOWNLOAD_FILES} files were selected.`);
    }
  };

  const handleRetryUpload = async (uploadId: string) => {
    setRetryingUploadId(uploadId);
    try {
      const response = await apiClient(
        `/api/admin/upload-links/uploads/${uploadId}/retry`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to retry upload");
      }

      setUploadLinks((prevLinks) =>
        prevLinks.map((link) => ({
          ...link,
          uploads: link.uploads.map((upload) =>
            upload.id === uploadId
              ? {
                  ...upload,
                  status: "UPLOADING",
                  progress: 10,
                  errorMessage: null,
                }
              : upload,
          ),
        })),
      );

      toast.success("Retry started. New upload URL generated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to retry upload");
    } finally {
      setRetryingUploadId(null);
    }
  };

  // Handler for successful link creation
  const handleLinkCreated = async () => {
    setIsDialogOpen(false);
    // Refresh upload links if the accordion is open
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      try {
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
    }
  };

  // Handler for successful client edit
  const handleClientUpdated = () => {
    setIsEditDialogOpen(false);
    // Notify parent to refresh the client list
    if (onClientUpdated) {
      onClientUpdated();
    }
  };

  // Handler for client deletion
  const handleDeleteClient = async () => {
    setIsDeleting(true);
    try {
      const response = await apiClient(`/api/admin/clients/${client.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete client");
      }

      toast.success("Client deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeleteConfirmName("");

      // Notify parent to refresh the client list
      if (onClientDeleted) {
        onClientDeleted();
      }
    } catch (err) {
      console.error("Error deleting client:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete client",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if delete button should be enabled
  const fullName = `${client.firstName} ${client.lastName}`;
  const isDeleteEnabled = deleteConfirmName === fullName;

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
                <span>{formatPhoneNumber(client.phone)}</span>
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                title="Generate upload link"
                aria-label="Generate upload link"
              >
                <FaLink className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Create Upload Link for {client.firstName} {client.lastName}
                </DialogTitle>
              </DialogHeader>
              <CreateLinkForm
                initialClientId={client.id}
                onSuccess={handleLinkCreated}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                title="Edit client"
                aria-label="Edit client details"
              >
                <MdEdit className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Edit Client: {client.firstName} {client.lastName}
                </DialogTitle>
              </DialogHeader>
              <CreateClientForm
                client={client}
                onSuccess={handleClientUpdated}
              />
            </DialogContent>
          </Dialog>
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={(open) => {
              setIsDeleteDialogOpen(open);
              if (!open) {
                setDeleteConfirmName("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="destructive-outline"
                size="icon"
                title="Delete client"
                aria-label="Delete client"
              >
                <FaTrash className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-destructive">
                  Delete Client: {client.firstName} {client.lastName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-destructive font-semibold mb-2">
                    Warning: This action is permanent and cannot be undone
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete:
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside mt-2 space-y-1">
                    <li>The client record</li>
                    <li>All upload links</li>
                    <li>All document requests</li>
                    <li>All upload records</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Note: S3 files will remain and must be deleted manually if
                    needed.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    To confirm, type the client's full name:{" "}
                    <span className="font-semibold text-foreground">
                      {fullName}
                    </span>
                  </label>
                  <Input
                    type="text"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder={fullName}
                    disabled={isDeleting}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteDialogOpen(false);
                      setDeleteConfirmName("");
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteClient}
                    disabled={!isDeleteEnabled || isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin mr-2" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <FaTrash className="w-4 h-4 mr-2" />
                        Delete Client
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={areAllUploadsSelected}
                          onChange={(e) => toggleSelectAllUploads(e.target.checked)}
                          disabled={isBulkDownloading}
                        />
                        Select all
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadSelected()}
                        className="flex items-center gap-2"
                        disabled={
                          selectedUploadIds.length === 0 ||
                          isOverBulkSizeLimit ||
                          isBulkDownloading
                        }
                      >
                        {isBulkDownloading ? (
                          <FaSpinner className="w-3 h-3 animate-spin" />
                        ) : (
                          <FaDownload className="w-3 h-3" />
                        )}
                        Download selected
                      </Button>
                      {isBulkDownloading && (
                        <Button
                          variant="destructive-outline"
                          size="sm"
                          onClick={cancelBulkDownload}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {selectedUploadIds.length > 0 && (
                  <div className="mb-3 text-xs text-muted-foreground">
                    <span>
                      Selected {selectedUploadIds.length} file
                      {selectedUploadIds.length === 1 ? "" : "s"} (
                      {formatFileSize(selectedTotalBytes)})
                    </span>
                    {isOverBulkSizeLimit && (
                      <p className="text-red-600 dark:text-red-500 mt-1">
                        Warning: selected files exceed 100MB limit.
                      </p>
                    )}
                  </div>
                )}

                {isBulkDownloading && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Creating ZIP archive...</span>
                      <span>{bulkDownloadProgress}%</span>
                    </div>
                    <div className="h-2 w-full rounded bg-muted overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${bulkDownloadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {allUploads.length === 0 ? (
                  <div className="p-4 bg-card border border-border rounded-lg text-center text-muted-foreground text-sm">
                    No documents uploaded yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allUploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="p-3 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedUploadIds.includes(upload.id)}
                              onChange={(e) =>
                                toggleUploadSelection(upload.id, e.target.checked)
                              }
                              disabled={isBulkDownloading}
                            />
                            <FaFile className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {upload.fileName}
                                </p>
                                <Badge
                                  className={getUploadStatusBadgeClass(
                                    upload.status,
                                  )}
                                >
                                  {getUploadStatusLabel(upload.status)}
                                </Badge>
                                {upload.status === "FAILED" &&
                                  upload.errorMessage && (
                                    <span
                                      className="text-red-600 dark:text-red-500"
                                      title={upload.errorMessage}
                                      aria-label={upload.errorMessage}
                                    >
                                      <FaExclamationCircle className="w-4 h-4" />
                                    </span>
                                  )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatFileSize(upload.fileSize)}</span>
                                <span>•</span>
                                <span>{formatDate(upload.uploadedAt)}</span>
                                {typeof upload.progress === "number" && (
                                  <>
                                    <span>•</span>
                                    <span>{upload.progress}%</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {upload.status === "FAILED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRetryUpload(upload.id)}
                                disabled={retryingUploadId === upload.id}
                                title="Retry failed upload"
                              >
                                {retryingUploadId === upload.id ? (
                                  <FaSpinner className="w-3 h-3 animate-spin" />
                                ) : (
                                  <FaRedo className="w-3 h-3" />
                                )}
                                <span className="ml-1">Retry</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Download file"
                              onClick={() => handleDownload(upload)}
                            >
                              <FaDownload className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {isUploadInProgress(upload.status) && (
                          <div className="mt-3">
                            <div className="h-2 w-full rounded bg-muted overflow-hidden">
                              <div
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{
                                  width: `${Math.max(0, Math.min(100, upload.progress || 0))}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
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
