"use client";

import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";

import { columns } from "./ClientColumns";
import type { Client } from "./ClientColumns";

import { ClientTableSkeleton } from "./ClientTableSkeleton";
import { QuickActions } from "./QuickActions";
import { ExpandedDetails } from "./ClientDetails";
import type { SortingState } from "@tanstack/react-table";


export function ClientTable() {
  const [data, setData] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(true);
 const [sorting, setSorting] = React.useState<SortingState>([]);

  const [expanded, setExpanded] = React.useState({});

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/admin/clients");
      const json = await res.json();
      setData(json.clients);
      setLoading(false);
    }
    load();
  }, []);
//prepared dummy table instead of fetch to make sanity check
//   React.useEffect(() => {
//   setLoading(false);
//   setData([
//     {
//       id: "1",
//       name: "Test User",
//       email: "test@example.com",
//       company: "Test Company",
//       status: "active",
//       createdAt: new Date().toISOString(),
//     },
//     {
//       id: "2",
//       name: "Another User",
//       email: "another@example.com",
//       company: "Another Co",
//       status: "inactive",
//       createdAt: new Date().toISOString(),
//     },
//   ]);
// }, []);
  const table = useReactTable({
    data,
    columns,
    state: { sorting, expanded },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  });
  console.log(table);
  if (loading) return <ClientTableSkeleton />;

  return (
    <div className="w-full overflow-x-auto">

      {/* Desktop Table */}
      <table className="hidden md:table w-full border-collapse">
        console.log("ROWS:", table.getRowModel().rows);
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="p-3 text-left cursor-pointer"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
              <th className="p-3">Actions</th>
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <React.Fragment key={row.id}>
              <tr
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => row.toggleExpanded()}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                <td className="p-3">
                  <QuickActions id={row.original.id} />
                </td>
              </tr>

              {row.getIsExpanded() && (
                <tr className="bg-gray-50">
                  <td colSpan={columns.length + 1} className="p-4">
                    <ExpandedDetails client={row.original} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((client) => (
          <div key={client.id} className="p-4 border rounded-lg shadow-sm">
            <div className="font-semibold">{client.name}</div>
            <div className="text-sm text-gray-600">{client.email}</div>
            <div className="text-sm">{client.company}</div>

            <div className="mt-2">
              <QuickActions id={client.id} />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </button>

        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>
    </div>
  );
}