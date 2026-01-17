import React, { useState } from "react";
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
  const [cascadeDelete, setCascadeDelete] = useState(false);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="delete-client-dialog">
        <DialogHeader className="delete-client-dialog__header">
          <DialogTitle className="delete-client-dialog__title">
            Delete {clientName}?
          </DialogTitle>
        </DialogHeader>

        <p className="delete-client-dialog__warning">
          This action is permanent. Deleting this client may also remove
          associated upload links and uploaded files.
        </p>

        <div className="delete-client-dialog__cascade-option">
          <input
            id="cascade-delete"
            type="checkbox"
            className="delete-client-dialog__cascade-checkbox"
            checked={cascadeDelete}
            onChange={(e) => setCascadeDelete(e.target.checked)}
          />

          <label
            htmlFor="cascade-delete"
            className="delete-client-dialog__cascade-label"
          >
            Also delete all upload links and uploaded files associated with this
            client
          </label>
        </div>

        <DialogFooter className="delete-client-dialog__actions">
          <Button
            variant="secondary"
            onClick={onClose}
            className="delete-client-dialog__cancel-button"
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            className="delete-client-dialog__confirm-button"
          >
            Delete Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};