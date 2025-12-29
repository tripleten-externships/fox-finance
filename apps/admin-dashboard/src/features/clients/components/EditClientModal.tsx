// // ⭐ ADD THIS BLOCK ⭐
// console.log("➡️  Setting Firebase custom claims…");

// await admin.auth().setCustomUserClaims(uid, {
//   role: role.toLowerCase(),
// });

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// I created features/clients/components/clientForm.tsx & EdieClientModal.tsx
// I created two new files form.stories.tsx and form.tsx
// issue Cannot find module '@tanstack/react-query' poped up.
// I did cd apps/admin-dashboard & pnpm add @tanstack/react-query
// Added into tsconfig.app.json  [ /* REQUIRED for pnpm monorepos */ "baseUrl": ".",]
// after adding "baseUrl": ".": 1. restarted TS server "Ctrl + Shift + P → TypeScript: Restart TS Server"
//2. - Restart VS Code
// 3. - Run pnpm dev
// now  Cannot find module '@tanstack/react-query' issue solved

//In ui/src/package.json, I added to "peerDependencies" react-hook-form:^7.49.3 & removed
// react-hook-form:^7.49.3 from "dependencies" & added to "devDependencies" so storybook can use it
// then did "pnpm istall" & "ctrl + shift + p" -> "TypeScript: Restart TS Server"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../../../../packages/ui/src/components/ui/dialog";

import ClientForm from "./ClientForm";
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

    // ❌ Rollback on error
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousClients) {
        queryClient.setQueryData(["clients"], ctx.previousClients);
      }
      if (ctx?.previousClient) {
        queryClient.setQueryData(["client", id], ctx.previousClient);
      }
    },

    // 🔄 Revalidate after success
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
