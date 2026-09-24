import { useEffect, useRef, useState } from "react";
import { Menu, Bell, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth, ROLE_LABELS, ROLE_COLORS } from "../context/AuthContext";
import * as api from "../api/endpoints";
import { formatDistanceToNow } from "date-fns";

export default function Topbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef();
  const profileRef = useRef();

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    loadNotifications();
  };

  const handleNotifClick = async (n) => {
    await api.markNotificationRead(n._id);
    loadNotifications();
    if (n.link) navigate(n.link);
    setNotifOpen(false);
  };

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_0_rgba(11,26,47,0.03)]">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} title="Toggle sidebar" className="text-slate-500 hover:text-brand-700 hover:bg-brand-50 rounded-lg p-1.5 transition">
            <Menu size={22} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-brand-900 font-display">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 min-w-[18px] h-[18px] flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-slide-up">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <p className="font-semibold text-slate-700 text-sm">Notifications</p>
                  <button onClick={handleMarkAllRead} className="text-xs text-brand-600 font-semibold hover:underline">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 && (
                    <p className="text-center text-sm text-slate-400 py-8">No notifications yet</p>
                  )}
                  {notifications.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition ${
                        !n.isRead ? "bg-brand-50" : ""
                      }`}
                    >
                      <p className="text-sm text-slate-700 leading-snug">{n.message}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-white shadow-sm"
                style={{ backgroundColor: user?.avatarColor || "#3b5878" }}
              >
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-700 leading-tight">{user?.name}</p>
                <p className="text-[11px] text-slate-400">{ROLE_LABELS[user?.role]}</p>
              </div>
              <ChevronDown size={15} className="text-slate-400" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-slide-up">
                <div className="px-4 py-3 border-b border-slate-100">
                  <span className={`badge ${ROLE_COLORS[user?.role]}`}>{ROLE_LABELS[user?.role]}</span>
                </div>
                <button
                  onClick={() => { navigate("/profile"); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <UserIcon size={16} /> My Profile
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
