import React, { useEffect, useState } from "react";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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

const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { logout } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();

  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                <Button variant="ghost" size="icon">
                  <FaRegBell className="h-5 w-5" />
                </Button>
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  3
                </Badge>
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
    </div>
  );
};

export default DashboardLayout;
