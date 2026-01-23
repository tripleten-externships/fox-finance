import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@fox-finance/ui";
import { ClientDetails } from "../clients/components/ClientDetails";
import { apiClient } from "../../lib/api";
import { FiUsers } from "react-icons/fi";

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

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient("/api/admin/clients");
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

    fetchClients();
  }, []);

  if (loading || parentLoading) {
    return (
      <main className="flex-1 p-4 space-y-4 overflow-auto">
        <Card className="animate-pulse">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Fetching client data...</p>
          </CardContent>
        </Card>
      </main>
    );
  }

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
            <span className="text-sm text-muted-foreground">
              {clients.length} {clients.length === 1 ? "client" : "clients"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No clients found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create a new client to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => (
                <ClientDetails key={client.id} client={client} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default Content;
