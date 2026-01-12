import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
} from "@fox-finance/ui";
import {
  FaBell,
  FaFileAlt,
  FaUsers,
  FaFile,
  FaLink,
  FaUserFriends,
  FaUserPlus,
} from "react-icons/fa";
import useAuth from "../../hooks/useAuth";
import MetricsCard from "./components/MetricsCard";

const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const [metrics, setMetrics] = useState({
    totalClients: 0,
    pendingFiles: 0,
    activeLinks: 0,
  })

  //Fetch metrics data
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('API for metrics');

        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const data = await response.json();

        setMetrics({
          totalClients: data.totalClients,
          pendingFiles: data.pendingFiles,
          activeLinks: data.activeLinks,
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {

      }
    };

    fetchMetrics();
  }, []);



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
              {/* Notifications icon button with badge */}
              <div className="relative">
                <Button variant="ghost" size="icon">
                  <FaBell className="h-5 w-5" />
                </Button>
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  3
                </Badge>
              </div>

              {/* Document/file icon button */}
              <Button variant="ghost" size="icon">
                <FaFileAlt className="h-5 w-5" />
              </Button>

              {/* Sign Out button */}
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-6">
          {/* Top Section - Three Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Total Clients Card */}
            <MetricsCard
            title ="Total Clients"
            value = {metrics.totalClients}
            icon ={<FaUsers/>}
            descriptor="Active Applications"
            />

            {/* Pending Files Card */}
            <MetricsCard
            title ="Pending Files"
            value = {metrics.pendingFiles}
            icon ={<FaFile/>}
            descriptor="Awaiting review"
            />
            

            {/* Active Links Card */}
            <MetricsCard
            title ="Active Links"
            value = {metrics.activeLinks}
            icon ={<FaLink/>}
            descriptor="Secure access codes"
            />
          
          </div>

          {/* Bottom Section - Two Full-Width Cards */}
          <div className="grid grid-cols-1 gap-6">
            {/* Client Management Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <FaUserFriends className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <CardTitle>Client Management</CardTitle>
                    <CardDescription>
                      View and manage all client applications
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Add New Client Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <FaUserPlus className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <CardTitle>Add New Client</CardTitle>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
