import { useEffect, useState } from "react";
import * as api from "../../api/endpoints";
import Loader from "../../components/Loader";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { PriorityBadge } from "../../components/Badge";
import toast from "react-hot-toast";
import { Plus, Timer, Pencil, Trash2 } from "lucide-react";

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const emptyForm = { name: "", priority: "Medium", responseTimeHours: 4, resolutionTimeHours: 24, escalateTo: "it_manager", businessHoursOnly: true };

export default function SLAPolicies() {
  const [slas, setSlas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await api.getSLAs(); setSlas(res.data.data); }
    catch (e) { toast.error("Failed to load SLA policies"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (s) => {
    setEditingId(s._id);
    setForm({ name: s.name, priority: s.priority, responseTimeHours: s.responseTimeHours, resolutionTimeHours: s.resolutionTimeHours, escalateTo: s.escalateTo, businessHoursOnly: s.businessHoursOnly });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, responseTimeHours: Number(form.responseTimeHours), resolutionTimeHours: Number(form.resolutionTimeHours) };
      if (editingId) { await api.updateSLA(editingId, payload); toast.success("SLA policy updated"); }
      else { await api.createSLA(payload); toast.success("SLA policy created"); }
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deactivate this SLA policy?")) return;
    try { await api.deleteSLA(id); toast.success("SLA policy deactivated"); load(); }
    catch (err) { toast.error(err.response?.data?.message || "Delete failed"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="page-title">SLA Policies</h2>
          <p className="page-sub">Set response & resolution time targets, with auto-escalation rules.</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add SLA Policy</button>
      </div>

      {loading ? <Loader /> : slas.length === 0 ? (
        <div className="card"><EmptyState icon={Timer} title="No SLA policies yet" /></div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-semibold">Policy Name</th>
                  <th className="text-left px-5 py-3 font-semibold">Priority</th>
                  <th className="text-left px-5 py-3 font-semibold">Response Time</th>
                  <th className="text-left px-5 py-3 font-semibold">Resolution Time</th>
                  <th className="text-left px-5 py-3 font-semibold">Escalates To</th>
                  <th className="text-right px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {slas.map((s) => (
                  <tr key={s._id} className="border-t border-slate-50 hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-semibold text-slate-700">{s.name}</td>
                    <td className="px-5 py-3.5"><PriorityBadge priority={s.priority} /></td>
                    <td className="px-5 py-3.5 text-slate-600">{s.responseTimeHours}h</td>
                    <td className="px-5 py-3.5 text-slate-600">{s.resolutionTimeHours}h</td>
                    <td className="px-5 py-3.5 text-slate-600 capitalize">{s.escalateTo.replace("_", " ")}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openEdit(s)} className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"><Pencil size={15} /></button>
                        <button onClick={() => handleDelete(s._id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit SLA Policy" : "Add SLA Policy"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Policy Name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Response Time (hours)</label>
              <input type="number" required className="input" value={form.responseTimeHours} onChange={(e) => setForm({ ...form, responseTimeHours: e.target.value })} />
            </div>
            <div>
              <label className="label">Resolution Time (hours)</label>
              <input type="number" required className="input" value={form.resolutionTimeHours} onChange={(e) => setForm({ ...form, resolutionTimeHours: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Escalates To</label>
            <select className="input" value={form.escalateTo} onChange={(e) => setForm({ ...form, escalateTo: e.target.value })}>
              <option value="it_manager">IT Manager</option>
              <option value="admin">System Admin</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.businessHoursOnly} onChange={(e) => setForm({ ...form, businessHoursOnly: e.target.checked })} className="rounded accent-brand-500" />
            Business hours only
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
