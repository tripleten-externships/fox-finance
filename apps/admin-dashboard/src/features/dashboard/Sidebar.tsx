import React from "react";
import { Button } from "@fox-finance/ui";

const Sidebar: React.FC = () => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-background border-r border-border p-4 space-y-2">
      {/* Placeholder nav links */}
      <Button variant="ghost" className="justify-start w-full">Dashboard</Button>
      <Button variant="ghost" className="justify-start w-full">Users</Button>
      <Button variant="ghost" className="justify-start w-full">Settings</Button>
    </aside>
  );
};

export default Sidebar;
