import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useLocation } from "react-router-dom";

const TITLES = {
  "/dashboard": "Dashboard",
  "/tickets": "Tickets",
  "/assets": "Asset Management",
  "/knowledge-base": "Knowledge Base",
  "/admin/users": "User Management",
  "/admin/categories": "Categories",
  "/admin/departments": "Departments",
  "/admin/slas": "SLA Policies",
  "/admin/vendors": "Vendors",
  "/profile": "My Profile",
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sdp_sidebar_collapsed") === "1";
    } catch (e) {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      try {
        localStorage.setItem("sdp_sidebar_collapsed", v ? "0" : "1");
      } catch (e) {
        // ignore storage errors
      }
      return !v;
    });
  };

  // On desktop the menu button minimizes/expands the sidebar; on mobile it opens the drawer
  const handleMenuClick = () => {
    if (window.innerWidth >= 1024) toggleCollapsed();
    else setSidebarOpen(true);
  };
  const location = useLocation();
  const title =
    TITLES[location.pathname] ||
    Object.entries(TITLES).find(([path]) => location.pathname.startsWith(path))?.[1] ||
    "ServiceDesk Pro";

  return (
    <div className="min-h-screen flex">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onMenuClick={handleMenuClick} title={title} />
        <main className="flex-1 p-4 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
