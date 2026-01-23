import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  toast,
} from "@fox-finance/ui";
import { apiClient } from "../../../lib/api";

// Types based on Prisma schema
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
}

interface DocumentType {
  id: string;
  name: string;
  description: string;
}

interface RequestedDocument {
  name: string;
  description?: string;
}

interface CreateUploadLinkPayload {
  clientId: string;
  expiresAt: string;
  requestedDocuments: RequestedDocument[];
  instructions?: string;
}

interface CreateLinkFormProps {
  initialClientId?: string;
}

const DEFAULT_EXPIRATION_DAYS = 7;

export default function CreateLinkForm({
  initialClientId,
}: CreateLinkFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string>(initialClientId || "");
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);

  const [expirationDate, setExpirationDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() + DEFAULT_EXPIRATION_DAYS);
    return d;
  });

  const [requestedDocuments, setRequestedDocuments] = useState<
    RequestedDocument[]
  >([]);
  const [documentInput, setDocumentInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLinkUrl, setCreatedLinkUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load clients
  useEffect(() => {
    apiClient("/api/admin/clients")
      .then((res) => res.json())
      .then(({ items }: { items: Client[] }) => {
        setClients(items);
      })
      .catch(() => {
        toast("Failed to load clients");
      });
  }, []);

  // Load document types
  useEffect(() => {
    apiClient("/api/admin/document-types")
      .then((res) => res.json())
      .then((data: DocumentType[]) => {
        setDocumentTypes(data);
      })
      .catch(() => {
        toast("Failed to load document types");
      });
  }, []);

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!documentInput.trim()) return documentTypes;
    const search = documentInput.toLowerCase();
    return documentTypes.filter(
      (dt) =>
        dt.name.toLowerCase().includes(search) ||
        dt.description.toLowerCase().includes(search),
    );
  }, [documentInput, documentTypes]);

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredSuggestions]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showSuggestions]);

  // Document handlers
  const handleAddDocument = (name?: string, description?: string) => {
    const docName = name || documentInput.trim();
    if (!docName) return;

    if (!requestedDocuments.find((d) => d.name === docName)) {
      setRequestedDocuments((prev) => [
        ...prev,
        { name: docName, description },
      ]);
    }
    setDocumentInput("");
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = useCallback(
    (docType: DocumentType) => {
      handleAddDocument(docType.name, docType.description);
      setHighlightedIndex(0);
      inputRef.current?.focus();
    },
    [handleAddDocument],
  );

  const handleKeyNavigation = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions || filteredSuggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : prev,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredSuggestions[highlightedIndex]) {
            handleSelectSuggestion(filteredSuggestions[highlightedIndex]);
          } else {
            handleAddDocument();
          }
          break;
        case "Escape":
          e.preventDefault();
          setShowSuggestions(false);
          break;
        case "Tab":
          setShowSuggestions(false);
          break;
      }
    },
    [
      showSuggestions,
      filteredSuggestions,
      highlightedIndex,
      handleSelectSuggestion,
      handleAddDocument,
    ],
  );

  const handleRemoveDocument = (name: string) => {
    setRequestedDocuments((prev) => prev.filter((d) => d.name !== name));
  };

  // Copy handler
  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied to clipboard!");
    } catch {
      toast("Failed to copy link, try manually.");
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!clientId || !expirationDate) {
      toast("Client and expiration date are required");
      return;
    }

    setIsSubmitting(true);

    const payload: CreateUploadLinkPayload = {
      clientId,
      expiresAt: expirationDate.toISOString(),
      requestedDocuments,
      instructions: notes,
    };

    try {
      const res = await apiClient("/api/admin/upload-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();

      setCreatedLinkUrl(data.url);
    } catch {
      toast("Failed to create upload link");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAnother = () => {
    setCreatedLinkUrl(null);
    setClientId("");
    setExpirationDate(() => {
      const d = new Date();
      d.setDate(d.getDate() + DEFAULT_EXPIRATION_DAYS);
      return d;
    });
    setRequestedDocuments([]);
    setDocumentInput("");
    setNotes("");
  };

  // Show success view after link creation
  if (createdLinkUrl) {
    return (
      <div className="max-w-xl space-y-6">
        <div className="rounded-lg border border-border bg-muted/50 p-6 space-y-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7"></path>
            </svg>
            <h3 className="text-lg font-semibold text-foreground">
              Upload Link Created Successfully!
            </h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Share this link with your client:
            </label>
            <div className="flex gap-2">
              <Input
                value={createdLinkUrl}
                readOnly
                className="font-mono text-sm bg-background"
              />
              <Button
                variant="secondary"
                onClick={() => handleCopy(createdLinkUrl)}
              >
                Copy Link
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={handleCreateAnother} variant="outline">
              Create Another Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Client */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Client</label>
        <Select
          value={clientId}
          onValueChange={setClientId}
          disabled={!!clientId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select client" />
          </SelectTrigger>

          <SelectContent>
            {clients.length === 0 ? (
              <SelectItem value="none" disabled>
                No clients
              </SelectItem>
            ) : (
              clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.firstName} {client.lastName}
                  {client.company ? ` (${client.company})` : ""}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Expiration date */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Expiration date
        </label>
        <DatePicker
          selected={expirationDate}
          onChange={(date: Date | null) => setExpirationDate(date)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {/* Requested documents with combobox */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Requested documents
        </label>
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={documentInput}
                onChange={(e) => setDocumentInput(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyNavigation}
                placeholder="Add document (type to search or enter custom)"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-lg max-h-60 overflow-auto"
                >
                  {filteredSuggestions.map((docType, index) => (
                    <div
                      key={docType.id}
                      className={`px-3 py-2 cursor-pointer border-b border-border last:border-b-0 ${
                        index === highlightedIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      }`}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(docType);
                      }}
                    >
                      <div className="font-medium text-sm">{docType.name}</div>
                      {docType.description && (
                        <div className="text-xs text-muted-foreground">
                          {docType.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={() => handleAddDocument()}>Add</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {requestedDocuments.map((doc) => (
            <span
              key={doc.name}
              className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
              title={doc.description}
            >
              {doc.name}
              <button
                className="text-xs opacity-70"
                onClick={() => handleRemoveDocument(doc.name)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Instructions / Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Instructions / Notes
        </label>
        <textarea
          className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none min-h-[100px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional instructions for the client"
        />
      </div>

      {/* Submit */}
      <Button onClick={handleSubmit} disabled={isSubmitting}>
        Create upload link
      </Button>
    </div>
  );
}
