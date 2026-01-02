
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../../../packages/ui/src/components/ui/dialog";
import ClientForm from "./ClientForm";
import type { Client } from "../types";

interface EditClientModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditClientModal({
  client,
  isOpen,
  onClose,
  onSuccess,
}: EditClientModalProps) {
  if (!client) return null;

  const handleSubmit = async (values: any) => {
    // Logic to call your API update endpoint
    console.log("Updating client:", values);
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Client: {`${client.firstName} ${client.lastName}`}</DialogTitle>
        </DialogHeader>
        <ClientForm
          mode="edit"
          initialValues={client}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
