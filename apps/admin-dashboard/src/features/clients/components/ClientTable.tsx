import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, SortingState, Row } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import { Badge } from "../../../../../../packages/ui/src/components/ui/badge";

// 1. Zod-consistent Type Definitions
// It's best to define this as a Zod schema or ensure the manual type 
// matches the strict 4.1.11 'nullable' requirements.
type Client = {
  id: string;
  name: string | null;
  email: string | null;
  company?: string | null;
  phone?: string | null;
  status?: string | null;
  createdAt: string;
};

type ClientsResponse = {
  items: Client[];
  count: number;
  pageSize: number;
  totalIndices?: number; // Added for v4 compatibility if needed
  totalPages: number;
  next: string | null;
};

export function ClientTable() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading, error } = useQuery<ClientsResponse>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/admin/clients");
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const clients = data?.items ?? [];

  // 2. Explicitly type the cell parameter to resolve TS7031
  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: { row: Row<Client> }) => <span>{row.original.name ?? "N/A"}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }: { row: Row<Client> }) => <span>{row.original.email ?? "N/A"}</span>,
    },
    {
      accessorKey: "company",
      header: "Company",
      cell: ({ row }: { row: Row<Client> }) => <span>{row.original.company ?? "N/A"}</span>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }: { row: Row<Client> }) => <span>{row.original.phone ?? "N/A"}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: Row<Client> }) => (
        <Badge color={row.original.status === "active" ? "green" : "gray"}>
          {row.original.status ?? "inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }: { row: Row<Client> }) => {
        const date = new Date(row.original.createdAt);
        return <span>{date.toLocaleDateString()}</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: () => (
        <div className="flex gap-2">
          <button className="text-blue-600 hover:underline">Edit</button>
          <button className="text-red-600 hover:underline">Delete</button>
          <button className="text-purple-600 hover:underline">
            Create Link
          </button>
        </div>
      ),
    },
  ];

  const table = useReactTable<Client>({
    data: clients,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  });

  if (isLoading) return <div>Loading clients…</div>;
  if (error) return <div className="text-red-600">Failed to load clients.</div>;

  return (
    <div className="w-full overflow-x-auto border rounded-lg">
      <table className="w-full text-left">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup: any) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header: any) => (
                <th
                  key={header.id}
                  className="px-4 py-3 font-medium cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {{
                    asc: " ↑",
                    desc: " ↓",
                  }[header.column.getIsSorted() as string] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row: Row<Client>) => (
            <tr key={row.id} className="border-b hover:bg-gray-50">
              {row.getVisibleCells().map((cell: any) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination... (no changes needed here) */}
    </div>
  );
}
