import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  toast,
} from "@fox-finance/ui";

type DeleteClientDialogProps = {
  open: boolean;
  clientId: string;
  clientName: string;
  onClose: () => void;
  onDeleted: () => void;
};

export const DeleteClientDialog: React.FC<DeleteClientDialogProps> = ({
  open,
  clientId,
  clientName,
  onClose,
  onDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/clients/${clientId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete client");
      }

      toast.success(`Client "${clientName}" deleted`, {
        description: "The client has been permanently removed.",
        duration: 3000,
      });

      onDeleted(); 
      onClose();
    } catch (error) {
      toast.error("Failed to delete client", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete client</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <strong>{clientName}</strong>?  
          This action cannot be undone.
        </p>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            loading={isDeleting}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};