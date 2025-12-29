
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import { Badge } from "../../../../../../packages/ui/src/components/ui/badge";

// -----------------------------
// Types based on your GET route
// -----------------------------
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

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span>{row.original.name}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span>{row.original.email}</span>,
    },
    {
      accessorKey: "company",
      header: "Company",
      cell: ({ row }) => <span>{row.original.company}</span>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <span>{row.original.phone}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge color={row.original.status === "active" ? "green" : "gray"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
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
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
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
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center p-4">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span>
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>

        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
