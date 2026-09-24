import { useEffect, useState } from "react";
import * as api from "../../api/endpoints";
import Loader from "../../components/Loader";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import toast from "react-hot-toast";
import { Plus, Truck, Pencil, Trash2, Mail, Phone } from "lucide-react";

const emptyForm = { name: "", contactPerson: "", email: "", phone: "", address: "", notes: "" };

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await api.getVendors(); setVendors(res.data.data); }
    catch (e) { toast.error("Failed to load vendors"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (v) => {
    setEditingId(v._id);
    setForm({ name: v.name, contactPerson: v.contactPerson || "", email: v.email || "", phone: v.phone || "", address: v.address || "", notes: v.notes || "" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) { await api.updateVendor(editingId, form); toast.success("Vendor updated"); }
      else { await api.createVendor(form); toast.success("Vendor added"); }
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deactivate this vendor?")) return;
    try { await api.deleteVendor(id); toast.success("Vendor deactivated"); load(); }
    catch (err) { toast.error(err.response?.data?.message || "Delete failed"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="page-title">Vendors</h2>
          <p className="page-sub">Manage suppliers for hardware, software and services.</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Vendor</button>
      </div>

      {loading ? <Loader /> : vendors.length === 0 ? (
        <div className="card"><EmptyState icon={Truck} title="No vendors yet" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((v) => (
            <div key={v._id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600"><Truck size={17} /></div>
                  <div>
                    <h3 className="font-bold text-slate-800">{v.name}</h3>
                    {v.contactPerson && <p className="text-xs text-slate-400">{v.contactPerson}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(v._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                {v.email && <p className="flex items-center gap-1.5"><Mail size={12} /> {v.email}</p>}
                {v.phone && <p className="flex items-center gap-1.5"><Phone size={12} /> {v.phone}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Vendor" : "Add Vendor"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Vendor Name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Person</label>
              <input className="input" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Address</label>
            <textarea rows={2} className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea rows={2} className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
