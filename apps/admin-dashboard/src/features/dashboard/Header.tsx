import React from "react";
import { Button } from "@fox-finance/ui";

interface HeaderProps {
  children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => {
  return (
    <header className="flex justify-between items-center p-4 bg-background border-b border-border">
      <div className="flex items-center">
        {/* Logo Placeholder */}
        <div className="text-xl font-bold text-foreground">Logo</div>
        {children && <div className="ml-2">{children}</div>}
      </div>

      {/* User Menu Placeholder */}
      <Button variant="ghost">User Menu</Button>
    </header>
  );
};

export default Header;
