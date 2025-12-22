import type { Client } from "./ClientColumns";

export function ExpandedDetails({ client }: { client: Client }) {
  return (
    <div className="space-y-1 text-sm">
      <div><strong>ID:</strong> {client.id}</div>
      <div><strong>Email:</strong> {client.email}</div>
      <div><strong>Company:</strong> {client.company}</div>
      <div><strong>Status:</strong> {client.status}</div>
      <div><strong>Created:</strong> {client.createdAt}</div>
    </div>
  );
}