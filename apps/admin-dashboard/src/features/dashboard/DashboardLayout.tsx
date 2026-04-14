import React, { useEffect, useState } from "react";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@fox-finance/ui";
import { FaRegBell, FaLink, FaRegMoon, FaSun, FaUsers } from "react-icons/fa";
import { FaRegFileLines } from "react-icons/fa6";
import { useColorMode } from "@fox-finance/theme";
import useAuth from "../../hooks/useAuth";
import Content from "./Content";
import { apiClient } from "../../lib/api";

interface StatsData {
  totalClients: number;
  activeClients: number;
  uploadMetrics: {
    totalUploadLinks: number;
    activeUploadLinks: number;
    completedUploadLinks: number;
    pendingFileUploads: number;
  };
}

interface StatsResponse {
  data: StatsData;
  meta: {
    performance: {
      responseTimeMs: number;
      under200ms: boolean;
    };
    generatedAt: string;
  };
}

interface ThreatItem {
  id: string;
  fileName: string;
  scanStatus: "THREAT_DETECTED";
  scanResult: string | null;
  scannedAt: string | null;
  uploadLink: {
    client: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  } | null;
}

const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { logout } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();

  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [isThreatDialogOpen, setIsThreatDialogOpen] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient("/api/admin/clients/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data: StatsResponse = await response.json();
      setStats(data.data);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching stats");
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchThreats = async () => {
      try {
        const response = await apiClient("/api/admin/uploads/threats?limit=20");
        if (!response.ok) {
          return;
        }
        const payload: { items: ThreatItem[] } = await response.json();
        setThreats(payload.items || []);
      } catch (threatError) {
        console.error("Error fetching threats:", threatError);
      }
    };

    fetchThreats();
    const intervalId = window.setInterval(fetchThreats, 10000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Main area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="border-b bg-card shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left side: Title and Subtitle */}
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">Portal Admin</h1>
              <p className="text-sm text-muted-foreground">
                Document Management Dashboard
              </p>
            </div>

            {/* Right side: Icon Buttons */}
            <div className="flex items-center gap-2">
              {/* Theme toggle button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleColorMode}
                aria-label={`Switch to ${colorMode === "dark" ? "light" : "dark"} mode`}
              >
                {colorMode === "dark" ? (
                  <FaSun className="h-5 w-5" />
                ) : (
                  <FaRegMoon className="h-5 w-5" />
                )}
              </Button>

              {/* Notifications icon button with badge */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsThreatDialogOpen(true)}
                >
                  <FaRegBell className="h-5 w-5" />
                </Button>
                {threats.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center p-0 text-xs"
                  >
                    {threats.length}
                  </Badge>
                )}
              </div>

              {/* Document/file icon button */}
              <Button variant="ghost" size="icon">
                <FaRegFileLines className="h-5 w-5" />
              </Button>

              {/* Sign Out button */}
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-6 bg-secondary">
          {/* Top Section - Three Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Total Clients Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-md">Total Clients</CardTitle>
                  <FaUsers className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-2xl font-bold text-muted-foreground">
                    ...
                  </p>
                ) : error ? (
                  <p className="text-2xl font-bold text-destructive">--</p>
                ) : (
                  <p className="text-2xl font-bold">
                    {stats?.totalClients ?? 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Active applications
                </p>
              </CardContent>
            </Card>

            {/* Pending Files Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-md">Pending Files</CardTitle>
                  <FaRegFileLines className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-2xl font-bold text-muted-foreground">
                    ...
                  </p>
                ) : error ? (
                  <p className="text-2xl font-bold text-destructive">--</p>
                ) : (
                  <p className="text-2xl font-bold">
                    {stats?.uploadMetrics.pendingFileUploads ?? 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Pending document requests awaiting upload
                </p>
              </CardContent>
            </Card>

            {/* Active Links Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-md">Active Links</CardTitle>
                  <FaLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-2xl font-bold text-muted-foreground">
                    ...
                  </p>
                ) : error ? (
                  <p className="text-2xl font-bold text-destructive">--</p>
                ) : (
                  <p className="text-2xl font-bold">
                    {stats?.uploadMetrics.activeUploadLinks ?? 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Active upload links
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Client Management Card */}
          <Content />

          {children}
        </main>
      </div>

      <Dialog open={isThreatDialogOpen} onOpenChange={setIsThreatDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Threat Notifications ({threats.length})</DialogTitle>
          </DialogHeader>
          {threats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No threats detected.</p>
          ) : (
            <div className="space-y-2">
              {threats.map((threat) => (
                <div key={threat.id} className="rounded border border-destructive/30 bg-destructive/5 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="destructive">Threat Detected</Badge>
                    <span className="text-sm font-medium">{threat.fileName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Client:{" "}
                    {threat.uploadLink?.client
                      ? `${threat.uploadLink.client.firstName} ${threat.uploadLink.client.lastName} (${threat.uploadLink.client.email})`
                      : "Unknown"}
                  </p>
                  {threat.scanResult && (
                    <p className="text-xs text-destructive mt-1">{threat.scanResult}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardLayout;
