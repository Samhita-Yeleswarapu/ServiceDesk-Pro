import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, LifeBuoy } from "lucide-react";

export default function Login() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { role: "Admin", email: "admin@servicedesk.com", password: "Admin@123" },
    { role: "IT Manager", email: "manager@servicedesk.com", password: "Manager@123" },
    { role: "Technician", email: "tech1@servicedesk.com", password: "Tech@123" },
    { role: "Employee", email: "employee@servicedesk.com", password: "Employee@123" },
    { role: "Asset Manager", email: "assets@servicedesk.com", password: "Asset@123" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginUser(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc) => setForm({ email: acc.email, password: acc.password });

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left visual panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-300/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center font-bold text-lg">SD</div>
          <span className="font-display font-bold text-xl">ServiceDesk Pro</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold font-display leading-tight mb-4">
            IT Support, <br /> Streamlined & Smart.
          </h2>
          <p className="text-brand-100 text-base leading-relaxed">
            Manage tickets, assets, and knowledge — with AI that classifies issues and
            suggests solutions automatically, backed by real-time SLA tracking.
          </p>
          <div className="flex gap-6 mt-8">
            <div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs text-brand-100">Role-based portals</p>
            </div>
            <div>
              <p className="text-2xl font-bold">AI</p>
              <p className="text-xs text-brand-100">Ticket classification</p>
            </div>
            <div>
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-xs text-brand-100">SLA monitoring</p>
            </div>
          </div>
        </div>
        <p className="relative z-10 text-xs text-brand-100">© {new Date().getFullYear()} ServiceDesk Pro. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-800 to-teal-500 flex items-center justify-center text-white font-bold">SD</div>
            <span className="font-display font-bold text-lg text-slate-800">ServiceDesk Pro</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 font-display">Welcome back 👋</h1>
          <p className="text-slate-500 text-sm mt-1 mb-6">Sign in to access your helpdesk dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  className="input pl-10"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Don't have an account?{" "}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-8 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4">
            <p className="text-xs font-semibold text-brand-700 flex items-center gap-1.5 mb-2">
              <LifeBuoy size={14} /> Quick demo access (click to autofill)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => fillDemo(acc)}
                  className="text-[11px] font-semibold bg-white text-brand-600 border border-brand-200 rounded-lg px-2.5 py-1.5 hover:bg-brand-100 transition"
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
