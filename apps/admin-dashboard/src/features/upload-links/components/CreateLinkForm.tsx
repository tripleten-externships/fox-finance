import { useEffect, useMemo, useState } from "react";
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

// Types based on Prisma schema
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
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

const DEFAULT_EXPIRATION_DAYS = 7;

export default function CreateLinkForm() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string>("");

  const [expirationDate, setExpirationDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() + DEFAULT_EXPIRATION_DAYS);
    return d;
  });

  const [requestedDocuments, setRequestedDocuments] = useState<RequestedDocument[]>([]);
  const [documentInput, setDocumentInput] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load clients
  useEffect(() => {
  fetch("/api/admin/clients")
    .then((res) => res.json())
    .then((data: Client[]) => {
      setClients(data);
    })
    .catch(() => {
      toast("Failed to load clients");
    });
  }, []);

  // Preview URL
  const previewUrl = useMemo(() => {
    if (!clientId || !expirationDate) return "";
    const params = new URLSearchParams({
      clientId,
      expiresAt: expirationDate.toISOString(),
    });
    return `${window.location.origin}/upload?${params.toString()}`;
  }, [clientId, expirationDate]);

  // Document handlers
  const handleAddDocument = () => {
    const value = documentInput.trim();
    if (!value) return;

    if (!requestedDocuments.find((d) => d.name === value)) {
      setRequestedDocuments((prev) => [...prev, { name: value }]);
    }
    setDocumentInput("");
  };

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
      const res = await fetch("/api/admin/upload-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();

      toast(
        <>
          Upload link created
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(data.url)}
            className="ml-2"
          >
            Copy link
          </Button>
        </>
      );
    } catch {
      toast("Failed to create upload link");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
        <div className="max-w-xl space-y-6">
      {/* Client */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Client</label>
        <Select value={clientId} onValueChange={setClientId}>
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
                {client.firstName} {client.lastName} ({client.company})
                </SelectItem>
            ))
            )}
        </SelectContent>
        </Select>
      </div>

      {/* Expiration date */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Expiration date</label>
        <DatePicker
          selected={expirationDate}
          onChange={(date: Date | null) => setExpirationDate(date)}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      {/* Requested documents */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Requested documents</label>
        <div className="flex gap-2">
          <Input
            value={documentInput}
            onChange={(e) => setDocumentInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddDocument()}
            placeholder="Add document"
          />
          <Button onClick={handleAddDocument}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {requestedDocuments.map((doc) => (
            <span
              key={doc.name}
              className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
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
        <label className="text-sm font-medium">Instructions / Notes</label>
        <textarea
          className="w-full rounded-md border px-3 py-2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional instructions for the client"
        />
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Preview</label>
        <div className="flex items-center gap-2">
          <Input value={previewUrl} readOnly />
          <Button
            variant="secondary"
            onClick={() => handleCopy(previewUrl)}
            disabled={!previewUrl}
          >
            Copy
          </Button>
        </div>
      </div>

      {/* Submit */}
      <Button onClick={handleSubmit} disabled={isSubmitting}>
        Create upload link
      </Button>
    </div>
  );
}
