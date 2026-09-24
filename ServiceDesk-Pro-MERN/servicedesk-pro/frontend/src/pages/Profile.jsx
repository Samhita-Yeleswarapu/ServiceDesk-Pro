import { useState } from "react";
import { useAuth, ROLE_LABELS, ROLE_COLORS } from "../context/AuthContext";
import * as api from "../api/endpoints";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

const COLORS = ["#1a3150", "#3b5878", "#0f766e", "#166534", "#b48a3c", "#9a3412", "#9f1239", "#475569"];

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", password: "", avatarColor: user?.avatarColor || "#3b5878" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, phone: form.phone, avatarColor: form.avatarColor };
      if (form.password) payload.password = form.password;
      const res = await api.updateMe(payload);
      // Merge server response, and make sure the chosen colour is applied everywhere (navbar, comments)
      const updated = { ...user, ...res.data.data, avatarColor: res.data.data?.avatarColor || form.avatarColor };
      setUser(updated);
      localStorage.setItem("sdp_user", JSON.stringify(updated));
      toast.success("Profile updated successfully");
      setForm({ ...form, password: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-soft"
            style={{ backgroundColor: form.avatarColor }}
          >
            {(form.name || user?.name)?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-900 font-display">{user?.name}</h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <span className={`badge mt-1.5 ${ROLE_COLORS[user?.role]}`}>{ROLE_LABELS[user?.role]}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">New password (optional)</label>
            <input type="password" className="input" placeholder="Leave blank to keep current" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Avatar color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setForm({ ...form, avatarColor: c })}
                  className={`w-8 h-8 rounded-full border-2 ${form.avatarColor === c ? "border-brand-900 ring-2 ring-offset-2 ring-brand-300" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
