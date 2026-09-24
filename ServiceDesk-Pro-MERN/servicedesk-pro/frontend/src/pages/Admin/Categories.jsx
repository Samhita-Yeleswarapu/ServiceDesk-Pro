import { useEffect, useState } from "react";
import * as api from "../../api/endpoints";
import Loader from "../../components/Loader";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import toast from "react-hot-toast";
import { Plus, FolderKanban, Pencil, Trash2 } from "lucide-react";

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const COLORS = ["#1a3150", "#3b5878", "#0f766e", "#166534", "#b48a3c", "#9a3412", "#9f1239", "#475569", "#6b21a8"];
const emptyForm = { name: "", description: "", defaultPriority: "Medium", color: "#3b5878" };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getCategories();
      setCategories(res.data.data);
    } catch (e) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c) => { setEditingId(c._id); setForm({ name: c.name, description: c.description, defaultPriority: c.defaultPriority, color: c.color }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) { await api.updateCategory(editingId, form); toast.success("Category updated"); }
      else { await api.createCategory(form); toast.success("Category created"); }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deactivate this category?")) return;
    try { await api.deleteCategory(id); toast.success("Category deactivated"); load(); }
    catch (err) { toast.error(err.response?.data?.message || "Delete failed"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="page-title">Ticket Categories</h2>
          <p className="page-sub">Define categories used for ticket classification and AI matching.</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Category</button>
      </div>

      {loading ? <Loader /> : categories.length === 0 ? (
        <div className="card"><EmptyState icon={FolderKanban} title="No categories yet" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div key={c._id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl" style={{ backgroundColor: `${c.color}20` }}>
                    <div className="w-full h-full flex items-center justify-center" style={{ color: c.color }}>
                      <FolderKanban size={17} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{c.name}</h3>
                    <span className="badge text-[10px]" style={{ backgroundColor: `${c.color}15`, color: c.color }}>{c.defaultPriority} priority</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"><Trash2 size={14} /></button>
                </div>
              </div>
              {c.description && <p className="text-sm text-slate-500 mt-3">{c.description}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Category" : "Add Category"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={2} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Default Priority</label>
            <select className="input" value={form.defaultPriority} onChange={(e) => setForm({ ...form, defaultPriority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-full border-2 ${form.color === c ? "border-slate-800" : "border-transparent"}`} style={{ backgroundColor: c }} />
              ))}
            </div>
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
