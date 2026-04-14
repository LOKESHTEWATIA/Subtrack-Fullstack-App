import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AddSubscriptionModal from "@/components/AddSubscriptionModal";
import { CATEGORY_CONFIG, BILLING_LABELS, PAYMENT_ICONS, PAYMENT_LABELS, getHealthConfig, formatINR, formatDate, getDaysUntil, CATEGORIES } from "@/constants";
import { Plus, Search, Edit2, Trash2, ShieldX, CheckCircle, Filter, SortAsc } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_COLORS = { active: { bg: "#EBF0EA", text: "#42593E" }, paused: { bg: "#FFF3E0", text: "#D48A42" }, cancelled: { bg: "#FDECEA", text: "#A34E36" } };

export default function Subscriptions() {
    const navigate = useNavigate();
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editSub, setEditSub] = useState(null);
    const [search, setSearch] = useState("");
    const [filterCat, setFilterCat] = useState("All");
    const [filterStatus, setFilterStatus] = useState("active");
    const [toast, setToast] = useState(null);

    const fetchSubs = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/subscriptions`, { withCredentials: true });
            setSubs(res.data || []);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchSubs(); }, []);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleMarkUsed = async (id) => {
        try {
            await axios.post(`${API}/subscriptions/${id}/mark-used`, {}, { withCredentials: true });
            setSubs(prev => prev.map(s => s.subscription_id === id ? { ...s, last_used_date: new Date().toISOString(), health_score: 100 } : s));
            showToast("Marked as used!");
        } catch { showToast("Failed to update", "error"); }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
        try {
            await axios.delete(`${API}/subscriptions/${id}`, { withCredentials: true });
            setSubs(prev => prev.filter(s => s.subscription_id !== id));
            showToast(`"${name}" deleted`);
        } catch { showToast("Failed to delete", "error"); }
    };

    const handleSaved = (savedSub, action) => {
        if (action === "created") setSubs(prev => [savedSub, ...prev]);
        else setSubs(prev => prev.map(s => s.subscription_id === savedSub.subscription_id ? savedSub : s));
        showToast(action === "created" ? "Subscription added!" : "Subscription updated!");
    };

    const filtered = useMemo(() => {
        return subs.filter(s => {
            const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
            const matchCat = filterCat === "All" || s.category === filterCat;
            const matchStatus = filterStatus === "all" || s.status === filterStatus;
            return matchSearch && matchCat && matchStatus;
        });
    }, [subs, search, filterCat, filterStatus]);

    const totalMonthly = filtered.filter(s => s.status === "active").reduce((sum, s) => sum + (s.monthly_cost || 0), 0);

    return (
        <div className="space-y-5 max-w-5xl mx-auto" data-testid="subscriptions-page">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md text-sm font-medium shadow-lg transition-all ${toast.type === "error" ? "bg-[#A34E36] text-white" : "bg-[#42593E] text-white"}`} data-testid="toast-notification">
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1C2321]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Subscriptions</h1>
                    <p className="text-[#5F635E] text-sm mt-0.5">
                        {filtered.filter(s => s.status === "active").length} active · <span className="tabular-nums font-medium">{formatINR(totalMonthly)}/month</span>
                    </p>
                </div>
                <Button
                    onClick={() => { setEditSub(null); setModalOpen(true); }}
                    className="bg-[#42593E] hover:bg-[#556B2F] text-white gap-2"
                    data-testid="add-subscription-btn"
                >
                    <Plus className="w-4 h-4" /> Add
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F635E]" />
                    <Input
                        data-testid="search-input"
                        placeholder="Search subscriptions..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 bg-white border-[#E5E0D8]"
                    />
                </div>
                <select
                    data-testid="category-filter"
                    value={filterCat}
                    onChange={e => setFilterCat(e.target.value)}
                    className="bg-white border border-[#E5E0D8] text-sm text-[#1C2321] px-3 py-2 rounded-md outline-none"
                >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                    data-testid="status-filter"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="bg-white border border-[#E5E0D8] text-sm text-[#1C2321] px-3 py-2 rounded-md outline-none"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Subscriptions list */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white border border-[#E5E0D8] rounded-md animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#E5E0D8] rounded-md" data-testid="empty-state">
                    <div className="w-12 h-12 bg-[#EBF0EA] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="w-6 h-6 text-[#42593E]" />
                    </div>
                    <p className="text-[#1C2321] font-medium mb-1">No subscriptions found</p>
                    <p className="text-[#5F635E] text-sm mb-4">{search ? "Try a different search term" : "Add your first subscription to get started"}</p>
                    {!search && (
                        <Button onClick={() => { setEditSub(null); setModalOpen(true); }} className="bg-[#42593E] hover:bg-[#556B2F] text-white" data-testid="empty-add-btn">
                            <Plus className="w-4 h-4 mr-1" /> Add Subscription
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((sub, i) => {
                        const catCfg = CATEGORY_CONFIG[sub.category] || CATEGORY_CONFIG["Other"];
                        const hCfg = getHealthConfig(sub.health_score);
                        const daysUntil = getDaysUntil(sub.next_renewal);
                        const PayIcon = PAYMENT_ICONS[sub.payment_method] || PAYMENT_ICONS.card;
                        const statusColor = STATUS_COLORS[sub.status] || STATUS_COLORS.active;

                        return (
                            <div
                                key={sub.subscription_id}
                                className="bg-white border border-[#E5E0D8] rounded-md p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 animate-fade-in-up"
                                style={{ animationDelay: `${i * 0.04}s` }}
                                data-testid={`sub-card-${sub.subscription_id}`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: catCfg.bg }}>
                                        <catCfg.icon className="w-5 h-5" style={{ color: catCfg.color }} />
                                    </div>

                                    {/* Main info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-sm font-semibold text-[#1C2321]">{sub.name}</h3>
                                                    <span className="text-xs px-1.5 py-0.5 rounded-sm" style={{ background: statusColor.bg, color: statusColor.text }}>{sub.status}</span>
                                                    {sub.is_trial && <span className="text-xs px-1.5 py-0.5 rounded-sm bg-[#E3F2FD] text-[#1565C0]">Trial</span>}
                                                </div>
                                                <p className="text-xs text-[#5F635E] mt-0.5">{sub.category}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-base font-bold text-[#1C2321] tabular-nums">
                                                    {formatINR(sub.amount)}<span className="text-xs font-normal text-[#5F635E]">{BILLING_LABELS[sub.billing_cycle]}</span>
                                                </p>
                                                <p className="text-xs text-[#5F635E] tabular-nums">{formatINR(sub.monthly_cost)}/mo</p>
                                            </div>
                                        </div>

                                        {/* Meta row */}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                                            <span className="text-xs text-[#5F635E]">
                                                Renews: <span className={`font-medium ${daysUntil !== null && daysUntil <= 3 ? "text-[#A34E36]" : "text-[#1C2321]"}`}>
                                                    {formatDate(sub.next_renewal)}{daysUntil !== null && daysUntil <= 7 ? ` (${daysUntil}d)` : ""}
                                                </span>
                                            </span>
                                            {sub.last_used_date && (
                                                <span className="text-xs text-[#5F635E]">
                                                    Used: <span className="font-medium text-[#1C2321]">{formatDate(sub.last_used_date)}</span>
                                                </span>
                                            )}
                                            <div className="flex items-center gap-1 text-xs text-[#5F635E]">
                                                <PayIcon className="w-3 h-3" /> {PAYMENT_LABELS[sub.payment_method]}{sub.payment_last4 ? ` ••${sub.payment_last4}` : ""}
                                            </div>
                                            <span className="text-xs px-1.5 py-0.5 rounded-sm font-medium" style={{ color: hCfg.color, background: hCfg.bg }}>
                                                {sub.health_score}% · {hCfg.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F0EDE8]">
                                    <button
                                        onClick={() => handleMarkUsed(sub.subscription_id)}
                                        className="flex items-center gap-1.5 text-xs text-[#42593E] hover:bg-[#EBF0EA] px-2.5 py-1.5 rounded-md transition-colors"
                                        data-testid={`mark-used-btn-${sub.subscription_id}`}
                                    >
                                        <CheckCircle className="w-3.5 h-3.5" /> Mark Used
                                    </button>
                                    <button
                                        onClick={() => navigate(`/cancel-assist/${sub.subscription_id}`)}
                                        className="flex items-center gap-1.5 text-xs text-[#A34E36] hover:bg-[#FDECEA] px-2.5 py-1.5 rounded-md transition-colors"
                                        data-testid={`cancel-assist-btn-${sub.subscription_id}`}
                                    >
                                        <ShieldX className="w-3.5 h-3.5" /> Cancel Assist
                                    </button>
                                    <div className="flex-1" />
                                    <button
                                        onClick={() => { setEditSub(sub); setModalOpen(true); }}
                                        className="p-1.5 text-[#5F635E] hover:text-[#42593E] hover:bg-[#EBF0EA] rounded-md transition-colors"
                                        data-testid={`edit-sub-btn-${sub.subscription_id}`}
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(sub.subscription_id, sub.name)}
                                        className="p-1.5 text-[#5F635E] hover:text-[#A34E36] hover:bg-[#FDECEA] rounded-md transition-colors"
                                        data-testid={`delete-sub-btn-${sub.subscription_id}`}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <AddSubscriptionModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditSub(null); }}
                onSaved={handleSaved}
                editSub={editSub}
            />
        </div>
    );
}
