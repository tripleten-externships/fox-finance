import React, { useState } from "react";
import { Button } from "@fox-finance/ui";
import { FaBars, FaTimes } from "react-icons/fa";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Content from "./Content";

const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar for desktop */}
      <Sidebar />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden">
          <div className="fixed left-0 top-0 h-full w-64 bg-background p-4 shadow-lg">
            <Button variant="ghost" onClick={toggleSidebar} className="mb-4">
              <FaTimes /> Close
            </Button>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1">
        {/* Header with hamburger button on mobile */}
        <Header>
          <Button
            variant="ghost"
            className="md:hidden mr-2"
            onClick={toggleSidebar}
          >
            <FaBars />
          </Button>
        </Header>

        {/* Content area */}
        <Content loading={loading} />
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
