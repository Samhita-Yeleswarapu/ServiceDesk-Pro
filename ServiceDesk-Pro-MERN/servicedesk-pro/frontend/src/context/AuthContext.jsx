import { createContext, useContext, useState, useEffect } from "react";
import * as api from "../api/endpoints";

const AuthContext = createContext(null);

export const ROLE_LABELS = {
  admin: "System Admin",
  it_manager: "IT Manager",
  technician: "Technician",
  employee: "Employee",
  asset_manager: "Asset Manager",
};

export const ROLE_COLORS = {
  admin: "bg-brand-100 text-brand-800",
  it_manager: "bg-teal-100 text-teal-700",
  technician: "bg-emerald-100 text-emerald-700",
  employee: "bg-slate-200 text-slate-700",
  asset_manager: "bg-amber-100 text-amber-700",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("sdp_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("sdp_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .getMe()
      .then((res) => {
        setUser(res.data.data);
        localStorage.setItem("sdp_user", JSON.stringify(res.data.data));
      })
      .catch(() => {
        localStorage.removeItem("sdp_token");
        localStorage.removeItem("sdp_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const loginUser = async (email, password) => {
    const res = await api.login({ email, password });
    const data = res.data.data;
    localStorage.setItem("sdp_token", data.token);
    localStorage.setItem("sdp_user", JSON.stringify(data));
    setUser(data);
    return data;
  };

  const registerUser = async (payload) => {
    const res = await api.register(payload);
    const data = res.data.data;
    localStorage.setItem("sdp_token", data.token);
    localStorage.setItem("sdp_user", JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("sdp_token");
    localStorage.removeItem("sdp_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, loginUser, registerUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
