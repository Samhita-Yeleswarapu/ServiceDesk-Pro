import { useEffect, useState } from "react";
import * as api from "../../api/endpoints";
import Loader from "../../components/Loader";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import toast from "react-hot-toast";
import { Plus, Building2, Pencil, Trash2 } from "lucide-react";

const emptyForm = { name: "", description: "" };

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await api.getDepartments(); setDepartments(res.data.data); }
    catch (e) { toast.error("Failed to load departments"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (d) => { setEditingId(d._id); setForm({ name: d.name, description: d.description }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) { await api.updateDepartment(editingId, form); toast.success("Department updated"); }
      else { await api.createDepartment(form); toast.success("Department created"); }
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deactivate this department?")) return;
    try { await api.deleteDepartment(id); toast.success("Department deactivated"); load(); }
    catch (err) { toast.error(err.response?.data?.message || "Delete failed"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="page-title">Departments</h2>
          <p className="page-sub">Organize users and tickets by department.</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Department</button>
      </div>

      {loading ? <Loader /> : departments.length === 0 ? (
        <div className="card"><EmptyState icon={Building2} title="No departments yet" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <div key={d._id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500"><Building2 size={17} /></div>
                  <h3 className="font-bold text-slate-800">{d.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(d._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"><Trash2 size={14} /></button>
                </div>
              </div>
              {d.description && <p className="text-sm text-slate-500 mt-3">{d.description}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Department" : "Add Department"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={2} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
