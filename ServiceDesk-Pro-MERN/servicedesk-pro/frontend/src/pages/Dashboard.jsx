import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import * as api from "../api/endpoints";
import Loader from "../components/Loader";
import StatCard from "../components/StatCard";
import {
  Ticket, Clock, CheckCircle2, AlertTriangle, Boxes, Users, Gauge, TrendingUp,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { Link } from "react-router-dom";

const STATUS_COLORS = { Open: "#3b5878", "In Progress": "#f59e0b", "On Hold": "#94a3b8", Escalated: "#f43f5e", Resolved: "#10b981", Closed: "#cbd5e1", Reopened: "#b48a3c" };
const PRIORITY_COLORS = { Low: "#94a3b8", Medium: "#3b5878", High: "#f97316", Critical: "#f43f5e" };

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then((res) => setStats(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!stats) return null;

  const statusData = (stats.statusBreakdown || []).map((s) => ({ name: s._id, value: s.count }));
  const priorityData = (stats.priorityBreakdown || []).map((p) => ({ name: p._id, value: p.count }));

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="page-title">{greeting()}, {user?.name?.split(" ")[0]} 👋</h2>
          <p className="page-sub">Here's what's happening with your helpdesk today.</p>
        </div>
        <Link to="/tickets" className="btn-primary">
          <Ticket size={16} /> {user?.role === "employee" ? "Raise a Ticket" : "View Tickets"}
        </Link>
      </div>

      {/* Core stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tickets" value={stats.totalTickets} icon={Ticket} color="brand" />
        <StatCard label="Open" value={stats.openTickets} icon={Clock} color="amber" />
        <StatCard label="In Progress" value={stats.inProgressTickets} icon={TrendingUp} color="teal" />
        <StatCard label="Resolved" value={stats.resolvedTickets} icon={CheckCircle2} color="emerald" />
      </div>

      {(stats.escalatedTickets > 0 || stats.breachedTickets > 0) && (
        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <p className="text-sm text-rose-700">
            <span className="font-bold">{stats.escalatedTickets}</span> ticket(s) escalated and{" "}
            <span className="font-bold">{stats.breachedTickets}</span> have breached their SLA. Please review immediately.
          </p>
        </div>
      )}

      {/* Manager / Admin analytics */}
      {(user?.role === "admin" || user?.role === "it_manager") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="SLA Compliance" value={`${stats.slaCompliance}%`} icon={Gauge} color="teal" />
          <StatCard label="Avg. Resolution Time" value={`${stats.avgResolutionHours}h`} icon={Clock} color="coral" />
          <StatCard label="Active Technicians" value={stats.technicianCount} icon={Users} color="brand" />
          <StatCard label="Total Assets" value={stats.totalAssets} icon={Boxes} color="rose" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-bold text-slate-700 mb-4">Tickets by Status</h3>
          {statusData.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No ticket data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="font-bold text-slate-700 mb-4">Tickets by Priority</h3>
          {priorityData.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No ticket data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={PRIORITY_COLORS[entry.name] || "#3b5878"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {(user?.role === "admin" || user?.role === "it_manager") && stats.technicianWorkload?.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-slate-700 mb-4">Technician Workload</h3>
          <div className="space-y-3">
            {stats.technicianWorkload.map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <p className="w-32 text-sm font-medium text-slate-600 truncate">{t.name}</p>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-teal-500 rounded-full"
                    style={{ width: `${Math.min(100, t.activeTickets * 12)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-700 w-8 text-right">{t.activeTickets}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(user?.role === "admin" || user?.role === "asset_manager") && stats.assetsByStatus?.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-slate-700 mb-4">Assets by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.assetsByStatus.map((a) => ({ name: a._id, value: a.count }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="value" fill="#b48a3c" radius={[0, 8, 8, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
