import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { Badge } from "../../../packages/ui/src/components/ui/badge";
import { fetchClients } from "../api/fetchClients";
import type { Client } from "../types/Client";
import { Skeleton } from "@repo/ui/Skeleton";

export function ClientTable() {
  const [sorting, setSorting] = useState([]);

  const { data, isLoading, error } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "name",
      header: () => "Name",
      cell: ({ row }) => <span>{row.original.name}</span>,
    },
    {
      accessorKey: "email",
      header: () => "Email",
      cell: ({ row }) => <span>{row.original.email}</span>,
    },
    {
      accessorKey: "company",
      header: () => "Company",
      cell: ({ row }) => <span>{row.original.company}</span>,
    },
    {
      accessorKey: "status",
      header: () => "Status",
      cell: ({ row }) => (
        <Badge
          color={row.original.status === "active" ? "green" : "gray"}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => "Created",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return <span>{date.toLocaleDateString()}</span>;
      },
    },
    {
      id: "actions",
      header: () => "Actions",
      cell: ({ row }) => (
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

  const table = useReactTable({
    data: data ?? [],
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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600">Failed to load clients.</div>;
  }

  return (
    <div className="w-full">
      {/* ✅ Desktop Table */}
      <div className="hidden md:block overflow-x-auto border rounded-lg">
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
              <>
                <tr
                  key={row.id}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={row.getToggleExpandedHandler()}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>

                {row.getIsExpanded() && (
                  <tr className="bg-gray-50">
                    <td colSpan={columns.length} className="p-4">
                      <ExpandedClientDetails client={row.original} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>

        {/* ✅ Pagination */}
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

      {/* ✅ Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data?.map((client) => (
          <div
            key={client.id}
            className="border rounded-lg p-4 shadow-sm bg-white"
          >
            <div className="font-semibold">{client.name}</div>
            <div className="text-sm text-gray-600">{client.email}</div>
            <div className="text-sm">{client.company}</div>

            <div className="mt-2">
              <Badge
                color={client.status === "active" ? "green" : "gray"}
              >
                {client.status}
              </Badge>
            </div>

            <div className="mt-3 flex gap-3 text-sm">
              <button className="text-blue-600">Edit</button>
              <button className="text-red-600">Delete</button>
              <button className="text-purple-600">Create Link</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ✅ Expandable row content */
function ExpandedClientDetails({ client }: { client: Client }) {
  return (
    <div className="space-y-2">
      <div className="font-medium text-gray-700">Client Details</div>
      <div className="text-sm">Email: {client.email}</div>
      <div className="text-sm">Company: {client.company}</div>
      <div className="text-sm">
        Created: {new Date(client.createdAt).toLocaleString()}
      </div>
    </div>
  );
}