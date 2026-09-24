import { useEffect, useState } from "react";
import * as api from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Loader";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { AssetStatusBadge } from "../../components/Badge";
import toast from "react-hot-toast";
import { Plus, Search, Boxes, Pencil, Calendar } from "lucide-react";
import { format } from "date-fns";

const TYPES = ["Laptop", "Desktop", "Monitor", "Server", "Printer", "Networking", "Software License", "Mobile", "Other"];
const STATUSES = ["In Stock", "Assigned", "Under Repair", "Retired", "Lost"];

const emptyForm = {
  assetTag: "", name: "", type: "Laptop", serialNumber: "", vendor: "", purchaseDate: "",
  warrantyExpiry: "", cost: "", status: "In Stock", assignedTo: "", department: "", location: "", notes: "",
};

export default function AssetList() {
  const { user } = useAuth();
  const canManage = ["admin", "asset_manager"].includes(user?.role);

  const [assets, setAssets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const res = await api.getAssets(params);
      setAssets(res.data.data);
    } catch (e) {
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getVendors().then((res) => setVendors(res.data.data)).catch(() => {});
    api.getDepartments().then((res) => setDepartments(res.data.data)).catch(() => {});
    if (canManage) api.getUsers().then((res) => setUsers(res.data.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(loadAssets, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, typeFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (asset) => {
    setEditingId(asset._id);
    setForm({
      assetTag: asset.assetTag, name: asset.name, type: asset.type, serialNumber: asset.serialNumber || "",
      vendor: asset.vendor?._id || "", purchaseDate: asset.purchaseDate ? asset.purchaseDate.slice(0, 10) : "",
      warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.slice(0, 10) : "", cost: asset.cost || "",
      status: asset.status, assignedTo: asset.assignedTo?._id || "", department: asset.department?._id || "",
      location: asset.location || "", notes: asset.notes || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((k) => { if (payload[k] === "") delete payload[k]; });
      if (payload.cost) payload.cost = Number(payload.cost);

      if (editingId) {
        await api.updateAsset(editingId, payload);
        toast.success("Asset updated");
      } else {
        await api.createAsset(payload);
        toast.success("Asset added to inventory");
      }
      setShowModal(false);
      loadAssets();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="page-title">IT Assets</h2>
          <p className="page-sub">Track hardware, software licenses and their lifecycle.</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Asset</button>
        )}
      </div>

      <div className="card flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search by name, tag or serial number..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input md:w-48" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input md:w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : assets.length === 0 ? (
        <div className="card"><EmptyState icon={Boxes} title="No assets found" message="Add your first asset to start tracking inventory." /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((a) => (
            <div key={a._id} className="card hover:-translate-y-0.5 transition-transform">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-brand-500">{a.assetTag}</p>
                  <h3 className="font-bold text-slate-800 mt-0.5">{a.name}</h3>
                  <p className="text-xs text-slate-400">{a.type}</p>
                </div>
                <AssetStatusBadge status={a.status} />
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                {a.assignedTo && <p>👤 Assigned to <span className="font-semibold text-slate-600">{a.assignedTo.name}</span></p>}
                {a.location && <p>📍 {a.location}</p>}
                {a.vendor && <p>🏢 {a.vendor.name}</p>}
                {a.warrantyExpiry && (
                  <p className="flex items-center gap-1"><Calendar size={12} /> Warranty until {format(new Date(a.warrantyExpiry), "MMM yyyy")}</p>
                )}
              </div>
              {canManage && (
                <button onClick={() => openEdit(a)} className="btn-ghost w-full mt-4 !py-2 text-xs">
                  <Pencil size={13} /> Edit / Update Lifecycle
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "Update Asset" : "Add New Asset"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Asset Tag</label>
              <input required className="input" value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} />
            </div>
            <div>
              <label className="label">Name</label>
              <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Serial Number</label>
              <input className="input" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
            </div>
            <div>
              <label className="label">Vendor</label>
              <select className="input" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}>
                <option value="">None</option>
                {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Purchase Date</label>
              <input type="date" className="input" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Warranty Expiry</label>
              <input type="date" className="input" value={form.warrantyExpiry} onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })} />
            </div>
            <div>
              <label className="label">Cost (₹)</label>
              <input type="number" className="input" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <label className="label">Assigned To</label>
              <select className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                <option value="">None</option>
                {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea rows={2} className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : editingId ? "Update Asset" : "Add Asset"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
