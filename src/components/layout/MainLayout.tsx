
import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/supabase";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";

type MainLayoutProps = {
  user: User | null;
  onSignOut: () => void;
};

const MainLayout: React.FC<MainLayoutProps> = ({ user, onSignOut }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="rounded-full shadow-md"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-200 ease-in-out z-40`}
      >
        <Sidebar user={user} onSignOut={onSignOut} />
      </div>

      {/* Main content */}
      <div
        className={`flex-1 transition-all duration-200 ease-in-out ${
          sidebarOpen ? "md:ml-[280px]" : "ml-0"
        }`}
      >
        <main className="h-screen overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
