import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Badge } from "../../../../../../packages/ui/src/components/ui/badge";
export type Client = {
  id: string;
  name: string;
  email: string;
  company: string;
  status: "active" | "inactive";
  createdAt: string;
};

const columnHelper = createColumnHelper<Client>();

//  Change ColumnDef<Client>[] to ColumnDef<Client, any>[]
export const columns: ColumnDef<Client, any>[] = [
  columnHelper.accessor("name", {
    header: "Name",
    enableSorting: true,
  }),
  columnHelper.accessor("email", {
    header: "Email",
    enableSorting: true,
  }),
  columnHelper.accessor("company", {
    header: "Company",
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();
      return (
        <Badge 
          variant={status === "active" ? "default" : "secondary"}
          className={status === "active" ? "bg-green-500 text-white" : "bg-gray-400 text-white"}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("createdAt", {
    header: "Created Date",
    enableSorting: true,
    cell: (info) => {
      const date = info.getValue();
      return date ? new Date(date).toLocaleDateString() : "N/A";
    },
  }),
];