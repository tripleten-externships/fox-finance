import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@fox-finance/ui";
import { Button } from "@fox-finance/ui";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";

type DeleteClientDialogProps = {
  open: boolean;
  clientName: string;
  clientId: string;
  hasActiveUploads: boolean;
  onClose: () => void;
  onDeleteSuccess: () => void;
};

export const DeleteClientDialog: React.FC<DeleteClientDialogProps> = ({
  open,
  clientName,
  clientId,
  hasActiveUploads,
  onClose,
  onDeleteSuccess,
}) => {
  //  Task: State to track if related uploads should be deleted together
  // Task: State to display success message after deletion
   // Task: React Query's query client to update cached client list after deletion
  const [cascadeDelete, setCascadeDelete] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();


 // Task: Mutation to call DELETE API and handle success/error
  const mutation: UseMutationResult<void, Error, void, unknown> = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cascade: cascadeDelete }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete client");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setSuccessMessage(`Client "${clientName}" successfully deleted.`);
      onDeleteSuccess();
      // Delay closing the dialog so user can see the success message briefly
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    },
  });

  if (!open) return null;

  const isLoading = mutation.status === "pending";

 // Determine loading state for disabling buttons and showing feedback
 // Task: Confirmation dialog shows client name and warns about consequences
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {clientName}?</DialogTitle>
        </DialogHeader>

        <p>
          This action is permanent. Deleting this client may also remove
          associated upload links and uploaded files.
        </p>

        {hasActiveUploads && (
          <p style={{ color: "red" }}>
            Cannot delete client: active uploads in progress.
          </p>
        )}

        <div>
          <input
            id="cascade-delete"
            type="checkbox"
            checked={cascadeDelete}
            onChange={(e) => setCascadeDelete(e.target.checked)}
            disabled={hasActiveUploads}
          />
          <label htmlFor="cascade-delete">
            Also delete all upload links and uploaded files associated with this
            client
          </label>
        </div>

        {mutation.isError && (
          <p style={{ color: "red" }}>
            {(mutation.error as Error)?.message || "An error occurred"}
          </p>
        )}

        {successMessage && (
          <p style={{ color: "green" }}>
            {successMessage}
          </p>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>

          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={hasActiveUploads || isLoading}
          >
            {isLoading ? "Deleting..." : "Delete Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};