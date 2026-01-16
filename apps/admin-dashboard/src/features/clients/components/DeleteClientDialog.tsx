import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@fox-finance/ui";
import { Button } from "@fox-finance/ui";

type DeleteClientDialogProps = {
  open: boolean;
  clientName: string;
  onClose: () => void;
};

export const DeleteClientDialog: React.FC<DeleteClientDialogProps> = ({
  open,
  clientName,
  onClose,
}) => {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Delete {clientName}?
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          This action is permanent. Deleting this client may also remove
          associated upload links and uploaded files.
        </p>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button variant="destructive">
            Delete Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};