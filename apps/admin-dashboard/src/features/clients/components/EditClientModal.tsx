import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../../../../packages/ui/src/components/ui/dialog";

import ClientForm from "./ClientForm.tsx";
import type { ClientFormValues } from "../../../../../api/src/schemas/client.schema";

interface EditClientModalProps {
  id: string;
  open: boolean;
  onClose: () => void;
}

export function EditClientModal({ id, open, onClose }: EditClientModalProps) {
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch existing client data
  const { data, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: () => fetch(`/api/admin/clients/${id}`).then((res) => res.json()),
    enabled: open,
  });

  // Mutation with optimistic update
  const mutation = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      return res.json();
    },

    // 🔥 Optimistic UI update
    onMutate: async (updatedValues) => {
      await queryClient.cancelQueries({ queryKey: ["clients"] as const });
      await queryClient.cancelQueries({ queryKey: ["client", id] as const });

      const previousClients = queryClient.getQueryData(["clients"] as const);
      const previousClient = queryClient.getQueryData(["client", id] as const);

      // Update list
      queryClient.setQueryData(["clients"], (old: any) =>
        old
          ? old.map((client: any) =>
              client.id === id ? { ...client, ...updatedValues } : client
            )
          : old
      );

      // Update detail
      queryClient.setQueryData(["client", id], (old: any) =>
        old ? { ...old, ...updatedValues } : old
      );

      return { previousClients, previousClient };
    },

    //Graceful handling of connection issues
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousClients) {
        queryClient.setQueryData(["clients"], ctx.previousClients);
      }
      if (ctx?.previousClient) {
        queryClient.setQueryData(["client", id], ctx.previousClient);
      }
    },

    // Dashboard reflects changes within 5 seconds & No page refresh
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] as const });
      queryClient.invalidateQueries({ queryKey: ["client", id] as const });
    },
  });

  // Warn on browser navigation if unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        // Modern browsers still require setting returnValue to trigger the dialog,
        // but TS marks it deprecated, so we cast to avoid the warning.
        e.returnValue = ""; // still needed for Chrome
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  const handleSubmit = (values: ClientFormValues) => {
    if (!hasChanges) {
      const confirmSave = window.confirm("No changes detected. Save anyway?");
      if (!confirmSave) return;
    }

    mutation.mutate(values);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update the client information below.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="p-4">Loading...</div>
        ) : (
          <ClientForm
            mode="edit"
            initialValues={data}
            onSubmit={handleSubmit}
            onChange={() => setHasChanges(true)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
