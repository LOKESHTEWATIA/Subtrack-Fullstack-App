import { useState, useEffect } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import {
    Leaf, LayoutDashboard, CreditCard, BarChart2, Users, Settings,
    LogOut, Bell, X, Menu, CheckCheck, Trash2, AlertTriangle, Clock, RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NAV_ITEMS = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/subscriptions", icon: CreditCard, label: "Subscriptions" },
    { to: "/analytics", icon: BarChart2, label: "Analytics" },
    { to: "/family", icon: Users, label: "Family Mode" },
    { to: "/settings", icon: Settings, label: "Settings" },
];

const NOTIF_ICONS = {
    renewal_reminder: { icon: Clock, color: "#42593E", bg: "#EBF0EA" },
    unused_alert: { icon: AlertTriangle, color: "#D48A42", bg: "#FFF3E0" },
    trial_ending: { icon: AlertTriangle, color: "#A34E36", bg: "#FDECEA" },
};

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const fetchNotifications = async () => {
        setLoadingNotifs(true);
        try {
            const res = await axios.get(`${API}/notifications`, { withCredentials: true });
            setNotifications(res.data || []);
        } catch { /* ignore */ }
        finally { setLoadingNotifs(false); }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAllRead = async () => {
        try {
            await axios.put(`${API}/notifications/read-all`, {}, { withCredentials: true });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch { /* ignore */ }
    };

    const deleteNotif = async (id) => {
        try {
            await axios.delete(`${API}/notifications/${id}`, { withCredentials: true });
            setNotifications(prev => prev.filter(n => n.notification_id !== id));
        } catch { /* ignore */ }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const initials = user?.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U";

    return (
        <div className="flex h-screen bg-[#F9F7F1] overflow-hidden">
            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-[#E5E0D8] flex flex-col
                transform transition-transform duration-200 ease-out
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                lg:relative lg:translate-x-0
            `}>
                {/* Logo */}
                <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#E5E0D8]">
                    <div className="w-8 h-8 bg-[#42593E] rounded-lg flex items-center justify-center">
                        <Leaf className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#1C2321] text-lg font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>SubTrack</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === "/"}
                            data-testid={`nav-${label.toLowerCase().replace(" ", "-")}`}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${isActive
                                    ? "bg-[#42593E] text-white"
                                    : "text-[#5F635E] hover:bg-[#F0EDE8] hover:text-[#1C2321]"
                                }`
                            }
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* User footer */}
                <div className="p-3 border-t border-[#E5E0D8]">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={user?.picture} />
                            <AvatarFallback className="bg-[#42593E] text-white text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#1C2321] truncate">{user?.name}</p>
                            <p className="text-xs text-[#5F635E] truncate">{user?.email}</p>
                        </div>
                        <button
                            data-testid="logout-btn"
                            onClick={handleLogout}
                            className="text-[#5F635E] hover:text-[#A34E36] transition-colors p-1"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="sticky top-0 z-30 h-14 bg-white/80 backdrop-blur-xl border-b border-[#E5E0D8] flex items-center px-4 gap-3">
                    <button
                        data-testid="hamburger-menu"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden text-[#5F635E] hover:text-[#1C2321] p-1"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex-1" />

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            data-testid="notifications-bell"
                            onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications(); }}
                            className="relative p-2 text-[#5F635E] hover:text-[#1C2321] hover:bg-[#F0EDE8] rounded-md transition-all"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-[#A34E36] text-white text-[10px] rounded-full flex items-center justify-center font-bold" data-testid="unread-notif-count">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Panel */}
                        {notifOpen && (
                            <div className="absolute right-0 top-full mt-1 w-80 sm:w-96 bg-white border border-[#E5E0D8] rounded-lg shadow-lg overflow-hidden z-50" data-testid="notifications-panel">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E0D8]">
                                    <h3 className="text-sm font-semibold text-[#1C2321]">Notifications</h3>
                                    <div className="flex items-center gap-2">
                                        {unreadCount > 0 && (
                                            <button onClick={markAllRead} className="text-xs text-[#42593E] hover:underline flex items-center gap-1" data-testid="mark-all-read-btn">
                                                <CheckCheck className="w-3 h-3" /> Mark all read
                                            </button>
                                        )}
                                        <button onClick={() => setNotifOpen(false)} className="text-[#5F635E] hover:text-[#1C2321]">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="max-h-80 overflow-y-auto">
                                    {loadingNotifs ? (
                                        <div className="p-6 text-center">
                                            <RefreshCw className="w-5 h-5 animate-spin text-[#5F635E] mx-auto" />
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="p-6 text-center text-[#5F635E] text-sm">
                                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p>No notifications</p>
                                        </div>
                                    ) : (
                                        notifications.map(notif => {
                                            const cfg = NOTIF_ICONS[notif.type] || NOTIF_ICONS.renewal_reminder;
                                            const Icon = cfg.icon;
                                            return (
                                                <div
                                                    key={notif.notification_id}
                                                    data-testid={`notification-${notif.notification_id}`}
                                                    className={`flex items-start gap-3 px-4 py-3 border-b border-[#F0EDE8] hover:bg-[#F9F7F1] transition-colors ${!notif.is_read ? "bg-[#F9F7F1]" : ""}`}
                                                >
                                                    <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                                                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs leading-relaxed ${notif.is_read ? "text-[#5F635E]" : "text-[#1C2321] font-medium"}`}>
                                                            {notif.message}
                                                        </p>
                                                        {!notif.is_read && <span className="inline-block w-1.5 h-1.5 bg-[#42593E] rounded-full mt-1" />}
                                                    </div>
                                                    <button onClick={() => deleteNotif(notif.notification_id)} className="text-[#5F635E] hover:text-[#A34E36] flex-shrink-0">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
