import React, { useState } from "react";
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
import ClientForm from "../auth/clients/ClientForm";

const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { logout } = useAuth();
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleCreateClient = () => {
    setIsClientFormOpen(true);
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Total Clients</CardTitle>
                  <FaUsers className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>

            {/* Pending Files Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Pending Files</CardTitle>
                  <FaFile className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>

            {/* Active Links Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Active Links</CardTitle>
                  <FaLink className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FaUserPlus className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <CardTitle>Add New Client</CardTitle>
                    </div>
                  </div>
                  <Button className="bg-black rounded-[8px]" onClick={handleCreateClient}>Create Client</Button>
                </div>
              </CardHeader>
            </Card>
          </div>

          {children}
        </main>
      </div>

      {/* Client Form Modal */}
      <ClientForm 
        open={isClientFormOpen} 
        onOpenChange={setIsClientFormOpen} 
      />
    </div>
  );
};

export default DashboardLayout;
