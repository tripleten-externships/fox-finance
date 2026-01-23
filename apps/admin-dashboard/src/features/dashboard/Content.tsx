import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fox-finance/ui";
import { ClientDetails } from "../clients/components/ClientDetails";
import CreateClientForm from "../clients/components/CreateClientForm";
import { apiClient } from "../../lib/api";
import { FiUsers } from "react-icons/fi";
import { FaPlus } from "react-icons/fa";
import { MdClear } from "react-icons/md";

interface ContentProps {
  loading?: boolean;
}

interface Client {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string | null;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

interface ClientsResponse {
  items: Client[];
  count: number;
  pageSize: number;
  totalPages: number;
  next: string | null;
}

const Content: React.FC<ContentProps> = ({ loading: parentLoading }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Local state for immediate search input updates (before debounce)
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || "",
  );

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query string from URL search params
      const params = new URLSearchParams();
      const search = searchParams.get("search");
      const status = searchParams.get("status");

      if (search) {
        params.append("search", search);
      }
      if (status) {
        params.append("status", status);
      }

      const queryString = params.toString();
      const url = `/api/admin/clients${queryString ? `?${queryString}` : ""}`;

      const response = await apiClient(url);
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      const data: ClientsResponse = await response.json();
      setClients(data.items);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching clients");
    } finally {
      setLoading(false);
    }
  };

  // Debounced effect for search input
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const currentSearch = searchParams.get("search") || "";
      if (searchInput !== currentSearch) {
        const newParams = new URLSearchParams(searchParams);
        if (searchInput) {
          newParams.set("search", searchInput);
        } else {
          newParams.delete("search");
        }
        setSearchParams(newParams);
      }
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  // Fetch clients whenever URL search params change
  useEffect(() => {
    fetchClients();
  }, [searchParams]);

  const handleClientCreated = () => {
    setIsDialogOpen(false);
    fetchClients(); // Refresh the client list
  };

  const handleStatusChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      newParams.set("status", value);
    } else {
      newParams.delete("status");
    }
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters =
    searchParams.get("search") ||
    (searchParams.get("status") && searchParams.get("status") !== "all");

  if (error) {
    return (
      <main className="flex-1 p-4 space-y-4 overflow-auto">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto">
      {/* Client Management Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                <FiUsers className="inline mr-2" /> Client Management
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                View and manage all client applications
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <FaPlus className="h-3 w-3" />
                    Create Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Client</DialogTitle>
                  </DialogHeader>
                  <CreateClientForm onSuccess={handleClientCreated} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search clients..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={searchParams.get("status") || "all"}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="gap-2"
              >
                <MdClear className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>

          {loading || parentLoading ? (
            <p className="text-muted-foreground">Fetching client data...</p>
          ) : (
            <>
              {clients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {hasActiveFilters
                      ? "No clients found matching your filters"
                      : "No clients found"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {hasActiveFilters
                      ? "Try adjusting your search or filter criteria."
                      : "Create a new client to get started."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clients.map((client) => (
                    <ClientDetails
                      key={client.id}
                      client={client}
                      onClientUpdated={fetchClients}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default Content;
