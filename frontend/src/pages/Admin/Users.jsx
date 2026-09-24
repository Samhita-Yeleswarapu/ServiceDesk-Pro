import { useEffect, useState } from "react";
import * as api from "../../api/endpoints";
import { useAuth, ROLE_LABELS, ROLE_COLORS } from "../../context/AuthContext";
import Loader from "../../components/Loader";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import toast from "react-hot-toast";
import { Plus, Search, Users as UsersIcon, Pencil, ShieldOff, ShieldCheck } from "lucide-react";

const ROLES = ["admin", "it_manager", "technician", "employee", "asset_manager"];

const emptyForm = { name: "", email: "", password: "", role: "employee", department: "", phone: "" };

export default function Users() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await api.getUsers(params);
      setUsers(res.data.data);
    } catch (e) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getDepartments().then((res) => setDepartments(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (u) => {
    setEditingId(u._id);
    setForm({ name: u.name, email: u.email, password: "", role: u.role, department: u.department?._id || "", phone: u.phone || "" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.department) delete payload.department;
      if (editingId) {
        if (!payload.password) delete payload.password;
        delete payload.email;
        await api.updateUser(editingId, payload);
        toast.success("User updated");
      } else {
        await api.createUser(payload);
        toast.success("User created");
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      if (u.isActive) {
        await api.deleteUser(u._id);
        toast.success("User deactivated");
      } else {
        await api.updateUser(u._id, { isActive: true });
        toast.success("User reactivated");
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="page-title">User Management</h2>
          <p className="page-sub">Manage staff and employee accounts, and assign roles.</p>
        </div>
        {isAdmin && <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add User</button>}
      </div>

      <div className="card flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input md:w-56" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>

      {loading ? <Loader /> : users.length === 0 ? (
        <div className="card"><EmptyState icon={UsersIcon} title="No users found" /></div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-semibold">User</th>
                  <th className="text-left px-5 py-3 font-semibold">Role</th>
                  <th className="text-left px-5 py-3 font-semibold">Department</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  {isAdmin && <th className="text-right px-5 py-3 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-t border-slate-50 hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: u.avatarColor }}>{u.name.charAt(0)}</div>
                        <div>
                          <p className="font-semibold text-slate-700">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className={`badge ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span></td>
                    <td className="px-5 py-3.5 text-slate-600">{u.department?.name || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                        {u.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => openEdit(u)} className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"><Pencil size={15} /></button>
                          <button onClick={() => toggleActive(u)} className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50">
                            {u.isActive ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit User" : "Add New User"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          {!editingId && (
            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          )}
          <div>
            <label className="label">{editingId ? "New Password (optional)" : "Password"}</label>
            <input type="password" required={!editingId} minLength={6} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
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
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : editingId ? "Update User" : "Create User"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
