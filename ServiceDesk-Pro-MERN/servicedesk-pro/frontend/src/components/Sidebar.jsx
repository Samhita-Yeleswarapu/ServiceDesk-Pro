import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  Boxes,
  BookOpen,
  Users,
  FolderKanban,
  Building2,
  Timer,
  Truck,
  X,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ALL_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "it_manager", "technician", "employee", "asset_manager"] },
  { to: "/tickets", label: "Tickets", icon: Ticket, roles: ["admin", "it_manager", "technician", "employee", "asset_manager"] },
  { to: "/assets", label: "Assets", icon: Boxes, roles: ["admin", "it_manager", "asset_manager", "technician"] },
  { to: "/knowledge-base", label: "Knowledge Base", icon: BookOpen, roles: ["admin", "it_manager", "technician", "employee", "asset_manager"] },
  { to: "/admin/users", label: "Users", icon: Users, roles: ["admin", "it_manager"] },
  { to: "/admin/categories", label: "Categories", icon: FolderKanban, roles: ["admin", "it_manager"] },
  { to: "/admin/departments", label: "Departments", icon: Building2, roles: ["admin"] },
  { to: "/admin/slas", label: "SLA Policies", icon: Timer, roles: ["admin"] },
  { to: "/admin/vendors", label: "Vendors", icon: Truck, roles: ["admin", "asset_manager"] },
];

export default function Sidebar({ open, onClose, collapsed = false, onToggleCollapse }) {
  const { user } = useAuth();
  const links = ALL_LINKS.filter((l) => l.roles.includes(user?.role));
  // "collapsed" only applies on desktop (lg+); the mobile drawer is always full width
  const hide = collapsed ? "lg:hidden" : "";

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-brand-950/60 backdrop-blur-sm z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 ${collapsed ? "lg:w-[76px]" : "lg:w-64"} shrink-0
        bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800 border-r border-white/5 z-40 transform
        transition-all duration-300 ease-in-out flex flex-col
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className={`flex items-center justify-between px-5 py-5 border-b border-white/10 ${collapsed ? "lg:px-0 lg:justify-center" : ""}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-teal-300 to-teal-600 flex items-center justify-center text-brand-950 font-bold text-base shadow-soft">
              SD
            </div>
            <div className={hide}>
              <p className="font-display font-bold text-white leading-tight">ServiceDesk</p>
              <p className="text-[11px] text-teal-300 font-semibold tracking-[0.25em]">PRO</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-brand-300 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  collapsed ? "lg:justify-center lg:px-0" : ""
                } ${
                  isActive
                    ? "bg-white/10 text-white shadow-inner before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-teal-400"
                    : "text-brand-200 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className={`truncate ${hide}`}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-white/10 space-y-3">
          <div className={`rounded-lg bg-white/5 border border-white/10 p-3.5 text-xs text-brand-200 ${hide}`}>
            <p className="font-semibold text-white mb-0.5 flex items-center gap-1.5">
              <Sparkles size={13} className="text-teal-300" /> AI-Enabled Helpdesk
            </p>
            <p>Tickets are auto-classified & matched to KB articles.</p>
          </div>
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Minimize sidebar"}
            className={`hidden lg:flex w-full items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium text-brand-300 hover:bg-white/5 hover:text-white transition ${
              collapsed ? "justify-center px-0" : ""
            }`}
          >
            {collapsed ? <ChevronsRight size={18} /> : <><ChevronsLeft size={18} /> Minimize</>}
          </button>
        </div>
      </aside>
    </>
  );
}
