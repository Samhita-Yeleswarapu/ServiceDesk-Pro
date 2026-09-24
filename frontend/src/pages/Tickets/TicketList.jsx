import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Loader";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { StatusBadge, PriorityBadge } from "../../components/Badge";
import toast from "react-hot-toast";
import { Plus, Search, Ticket as TicketIcon, Sparkles, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_OPTIONS = ["Open", "In Progress", "On Hold", "Escalated", "Resolved", "Closed", "Reopened"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

export default function TicketList() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({ subject: "", description: "", category: "", priority: "" });
  const [creating, setCreating] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const res = await api.getTickets(params);
      setTickets(res.data.data);
    } catch (e) {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(loadTickets, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, priorityFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...form };
      if (!payload.category) delete payload.category;
      if (!payload.priority) delete payload.priority;
      const res = await api.createTicket(payload);
      toast.success(`Ticket ${res.data.data.ticketNumber} created — AI classified it as "${res.data.data.aiSuggestedCategory}"`);
      setShowCreate(false);
      setForm({ subject: "", description: "", category: "", priority: "" });
      loadTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create ticket");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="page-title">Tickets</h2>
          <p className="page-sub">
            {user?.role === "employee" ? "Track and manage your support requests." : "Manage and resolve incoming support requests."}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> New Ticket
        </button>
      </div>

      <div className="card flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search by subject, ticket number, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input md:w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input md:w-48" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : tickets.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={TicketIcon}
            title="No tickets found"
            message="Try adjusting your filters, or create a new ticket to get started."
            action={<button onClick={() => setShowCreate(true)} className="btn-primary">Create Ticket</button>}
          />
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-semibold">Ticket</th>
                  <th className="text-left px-5 py-3 font-semibold">Requester</th>
                  <th className="text-left px-5 py-3 font-semibold">Priority</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  <th className="text-left px-5 py-3 font-semibold">Assigned To</th>
                  <th className="text-left px-5 py-3 font-semibold">Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t._id} className="border-t border-slate-50 hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <Link to={`/tickets/${t._id}`} className="font-semibold text-slate-700 hover:text-brand-600">
                        {t.subject}
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        {t.ticketNumber}
                        {t.aiSuggestedCategory && (
                          <span className="inline-flex items-center gap-0.5 text-brand-400"><Sparkles size={10} /> {t.aiSuggestedCategory}</span>
                        )}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{t.requester?.name}</td>
                    <td className="px-5 py-3.5"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                    <td className="px-5 py-3.5 text-slate-600">{t.assignedTo?.name || <span className="text-slate-300">Unassigned</span>}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}</td>
                    <td className="px-5 py-3.5">
                      <Link to={`/tickets/${t._id}`} className="text-slate-300 hover:text-brand-600">
                        <ChevronRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create a New Ticket" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Subject</label>
            <input required className="input" placeholder="Briefly describe the issue" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea required rows={5} className="input" placeholder="Provide as much detail as possible — our AI will classify the category, priority, and suggest solutions automatically." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category <span className="text-slate-400 font-normal">(optional — AI will suggest)</span></label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Let AI decide</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority <span className="text-slate-400 font-normal">(optional — AI will suggest)</span></label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="">Let AI decide</option>
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="rounded-xl bg-brand-50/70 border border-brand-100 p-3 flex items-start gap-2.5">
            <Sparkles size={16} className="text-brand-500 mt-0.5 shrink-0" />
            <p className="text-xs text-brand-700 leading-relaxed">
              Our AI engine analyzes your ticket text to auto-classify the category & priority, and instantly surfaces relevant knowledge base articles for faster resolution.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary">{creating ? "Submitting..." : "Submit Ticket"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
