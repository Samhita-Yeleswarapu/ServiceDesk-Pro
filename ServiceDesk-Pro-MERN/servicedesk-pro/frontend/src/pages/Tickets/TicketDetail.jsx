import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as api from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Loader";
import { StatusBadge, PriorityBadge } from "../../components/Badge";
import toast from "react-hot-toast";
import {
  ArrowLeft, Sparkles, Send, Lock, Clock, User as UserIcon, Tag, AlertTriangle,
  BookOpen, CheckCircle2, RotateCcw, Wrench, MessageSquare,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const STAFF_ROLES = ["admin", "it_manager", "technician", "asset_manager"];
const STATUS_OPTIONS = ["Open", "In Progress", "On Hold", "Escalated", "Resolved", "Closed", "Reopened"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isStaff = STAFF_ROLES.includes(user?.role);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState([]);
  const [categories, setCategories] = useState([]);

  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [posting, setPosting] = useState(false);

  const [workDesc, setWorkDesc] = useState("");
  const [workHours, setWorkHours] = useState("");
  const [loggingWork, setLoggingWork] = useState(false);

  const load = async () => {
    try {
      const res = await api.getTicket(id);
      setData(res.data.data);
    } catch (e) {
      toast.error("Failed to load ticket");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (["admin", "it_manager"].includes(user?.role)) {
      api.getTechnicianWorkload().then((res) => setTechnicians(res.data.data)).catch(() => {});
    }
    api.getCategories().then((res) => setCategories(res.data.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <Loader />;
  if (!data) return null;
  const { ticket, comments, workLogs } = data;

  const handleFieldUpdate = async (field, value) => {
    try {
      const res = await api.updateTicket(id, { [field]: value });
      setData((d) => ({ ...d, ticket: { ...d.ticket, ...res.data.data } }));
      toast.success("Ticket updated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      await api.addComment(id, { message: commentText, isInternal });
      setCommentText("");
      setIsInternal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  const handleWorkLog = async (e) => {
    e.preventDefault();
    if (!workDesc.trim()) return;
    setLoggingWork(true);
    try {
      await api.addWorkLog(id, { description: workDesc, hoursSpent: Number(workHours) || 0 });
      setWorkDesc("");
      setWorkHours("");
      load();
      toast.success("Work log added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add work log");
    } finally {
      setLoggingWork(false);
    }
  };

  const canManage = isStaff;

  return (
    <div className="space-y-5">
      <Link to="/tickets" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 font-medium">
        <ArrowLeft size={15} /> Back to Tickets
      </Link>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-5">
          <div className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-brand-500 mb-1">{ticket.ticketNumber}</p>
                <h1 className="text-xl font-bold text-slate-800 font-display">{ticket.subject}</h1>
              </div>
              <div className="flex gap-2">
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mt-4 whitespace-pre-wrap">{ticket.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-400 flex items-center gap-1"><UserIcon size={12} /> Requester</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{ticket.requester?.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 flex items-center gap-1"><Tag size={12} /> Category</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{ticket.category?.name || "Uncategorized"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12} /> Created</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{format(new Date(ticket.createdAt), "MMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12} /> Resolution Due</p>
                <p className={`text-sm font-semibold mt-0.5 ${ticket.isResolutionBreached ? "text-rose-500" : "text-slate-700"}`}>
                  {ticket.resolutionDueAt ? format(new Date(ticket.resolutionDueAt), "MMM d, h:mm a") : "—"}
                </p>
              </div>
            </div>

            {(ticket.isResponseBreached || ticket.isResolutionBreached) && (
              <div className="mt-4 rounded-xl bg-rose-50 border border-rose-100 p-3 flex items-center gap-2 text-sm text-rose-700">
                <AlertTriangle size={16} /> This ticket has breached its SLA {ticket.isResolutionBreached ? "resolution" : "response"} target.
              </div>
            )}
          </div>

          {/* AI Insights */}
          {ticket.aiProbableIssue && (
            <div className="card bg-gradient-to-br from-brand-50 to-teal-50/60 border-brand-100">
              <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
                <Sparkles size={17} className="text-teal-500" /> AI Insights
                {ticket.aiSource === "gemini" && (
                  <span className="badge bg-brand-800 text-white ml-1 text-[10px]">Powered by Gemini</span>
                )}
              </h3>
              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-white/70 rounded-xl p-3">
                  <p className="text-xs text-slate-400">Suggested Category</p>
                  <p className="text-sm font-semibold text-slate-700">{ticket.aiSuggestedCategory}</p>
                </div>
                <div className="bg-white/70 rounded-xl p-3">
                  <p className="text-xs text-slate-400">Suggested Priority</p>
                  <p className="text-sm font-semibold text-slate-700">{ticket.aiSuggestedPriority}</p>
                </div>
                <div className="bg-white/70 rounded-xl p-3">
                  <p className="text-xs text-slate-400">Confidence</p>
                  <p className="text-sm font-semibold text-slate-700">{Math.round((ticket.aiConfidence || 0) * 100)}%</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-3"><span className="font-semibold">Probable issue:</span> {ticket.aiProbableIssue}</p>
              {ticket.aiSuggestedResolution && (
                <div className="bg-white/70 rounded-xl p-3 mb-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Suggested first-line resolution</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{ticket.aiSuggestedResolution}</p>
                </div>
              )}

              {ticket.aiSuggestedArticles?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1"><BookOpen size={13} /> Suggested Knowledge Base Articles</p>
                  <div className="space-y-2">
                    {ticket.aiSuggestedArticles.map((a) => (
                      <Link key={a._id} to={`/knowledge-base/${a._id}`} className="block bg-white/70 hover:bg-white rounded-xl p-3 text-sm font-medium text-brand-700 transition">
                        {a.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="card">
            <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4"><MessageSquare size={17} /> Conversation</h3>
            <div className="space-y-4 mb-5 max-h-[420px] overflow-y-auto pr-1">
              {comments.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No comments yet. Start the conversation below.</p>}
              {comments.map((c) => (
                <div key={c._id} className={`flex gap-3 ${c.isInternal ? "bg-amber-50 border border-amber-100 rounded-xl p-3" : ""}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: c.author?.avatarColor || "#3b5878" }}>
                    {c.author?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-700">{c.author?.name}</p>
                      {c.isInternal && <span className="badge bg-amber-100 text-amber-700 text-[10px] flex items-center gap-1"><Lock size={9} /> Internal Note</span>}
                      <p className="text-[11px] text-slate-400">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</p>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap">{c.message}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleComment} className="border-t border-slate-100 pt-4">
              <textarea
                className="input"
                rows={3}
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <div className="flex items-center justify-between mt-3">
                {isStaff ? (
                  <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
                    <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="rounded accent-amber-500" />
                    Internal note (staff only)
                  </label>
                ) : <span />}
                <button type="submit" disabled={posting} className="btn-primary">
                  <Send size={15} /> {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
          </div>

          {/* Work logs (staff only) */}
          {isStaff && (
            <div className="card">
              <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4"><Wrench size={17} /> Work Logs</h3>
              <div className="space-y-3 mb-4">
                {workLogs.length === 0 && <p className="text-sm text-slate-400">No work logged yet.</p>}
                {workLogs.map((w) => (
                  <div key={w._id} className="flex items-start justify-between bg-slate-50 rounded-xl p-3">
                    <div>
                      <p className="text-sm text-slate-700">{w.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{w.technician?.name} · {formatDistanceToNow(new Date(w.createdAt), { addSuffix: true })}</p>
                    </div>
                    <span className="text-xs font-semibold text-brand-600 bg-brand-50 rounded-lg px-2 py-1">{w.hoursSpent}h</span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleWorkLog} className="flex gap-2">
                <input className="input flex-1" placeholder="What did you work on?" value={workDesc} onChange={(e) => setWorkDesc(e.target.value)} />
                <input className="input w-24" type="number" step="0.5" min="0" placeholder="Hours" value={workHours} onChange={(e) => setWorkHours(e.target.value)} />
                <button type="submit" disabled={loggingWork} className="btn-secondary">Log</button>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {canManage && (
          <div className="w-full lg:w-80 shrink-0 space-y-5">
            <div className="card">
              <h3 className="font-bold text-slate-700 mb-3">Manage Ticket</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={ticket.status} onChange={(e) => handleFieldUpdate("status", e.target.value)}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={ticket.priority} onChange={(e) => handleFieldUpdate("priority", e.target.value)}>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={ticket.category?._id || ""} onChange={(e) => handleFieldUpdate("category", e.target.value)}>
                    <option value="">Uncategorized</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                {["admin", "it_manager"].includes(user?.role) && (
                  <div>
                    <label className="label">Assign Technician</label>
                    <select className="input" value={ticket.assignedTo?._id || ""} onChange={(e) => handleFieldUpdate("assignedTo", e.target.value)}>
                      <option value="">Unassigned</option>
                      {technicians.map((t) => (
                        <option key={t._id} value={t._id}>{t.name} ({t.activeTicketCount} active)</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {ticket.status !== "Resolved" && ticket.status !== "Closed" && (
              <button onClick={() => handleFieldUpdate("status", "Resolved")} className="btn-primary w-full">
                <CheckCircle2 size={16} /> Mark as Resolved
              </button>
            )}
            {(ticket.status === "Resolved" || ticket.status === "Closed") && user?._id === ticket.requester?._id && (
              <button onClick={() => handleFieldUpdate("status", "Reopened")} className="btn-secondary w-full">
                <RotateCcw size={16} /> Reopen Ticket
              </button>
            )}

            <div className="card">
              <h3 className="font-bold text-slate-700 mb-3 text-sm">Activity History</h3>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {[...(ticket.history || [])].reverse().map((h, i) => (
                  <div key={i} className="text-xs border-l-2 border-brand-200 pl-3 py-0.5">
                    <p className="font-semibold text-slate-600">{h.action}</p>
                    {h.note && <p className="text-slate-400">{h.note}</p>}
                    <p className="text-slate-300">{h.date ? format(new Date(h.date), "MMM d, h:mm a") : ""}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!canManage && (
          <div className="w-full lg:w-80 shrink-0 space-y-5">
            {ticket.status === "Resolved" && (
              <button onClick={() => handleFieldUpdate("status", "Reopened")} className="btn-secondary w-full">
                <RotateCcw size={16} /> Not resolved? Reopen ticket
              </button>
            )}
            <div className="card">
              <h3 className="font-bold text-slate-700 mb-3 text-sm">Activity History</h3>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {[...(ticket.history || [])].reverse().map((h, i) => (
                  <div key={i} className="text-xs border-l-2 border-brand-200 pl-3 py-0.5">
                    <p className="font-semibold text-slate-600">{h.action}</p>
                    {h.note && <p className="text-slate-400">{h.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
