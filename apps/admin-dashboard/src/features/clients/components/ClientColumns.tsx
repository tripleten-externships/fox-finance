import { createColumnHelper } from "@tanstack/react-table";
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

export const columns = [
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
    cell: ({ getValue }) => {
      const status = getValue();
      return (
        <Badge color={status === "active" ? "green" : "gray"} variant="default">
          {status}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    enableSorting: true,
    cell: ({ getValue }) =>
      new Date(getValue()).toLocaleDateString(),
  }),
];