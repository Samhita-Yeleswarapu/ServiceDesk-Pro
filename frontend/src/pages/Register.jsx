import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as api from "../api/endpoints";
import toast from "react-hot-toast";
import { User, Mail, Lock, Phone, Building2 } from "lucide-react";

export default function Register() {
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", department: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .getDepartments()
      .then((res) => setDepartments(res.data.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerUser(form);
      toast.success("Account created! Welcome to ServiceDesk Pro.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-brand-50/40 to-teal-50/40 p-6">
      <div className="w-full max-w-md card shadow-soft animate-slide-up">
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-800 to-teal-500 flex items-center justify-center text-white font-bold">SD</div>
          <span className="font-display font-bold text-lg text-slate-800">ServiceDesk Pro</span>
        </div>

        <h1 className="text-xl font-bold text-slate-800 font-display text-center">Create your account</h1>
        <p className="text-slate-500 text-sm text-center mt-1 mb-6">
          New accounts start as <span className="font-semibold text-brand-600">Employee</span> — an admin can grant additional roles.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="label">Full name</label>
            <div className="relative">
              <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input required className="input pl-10" placeholder="Jane Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Email address</label>
            <div className="relative">
              <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" required className="input pl-10" placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" required minLength={6} className="input pl-10" placeholder="Min 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <div className="relative">
                <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-10" placeholder="Optional" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Department</label>
              <div className="relative">
                <Building2 size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                <select className="input pl-10" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  <option value="">Select</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
