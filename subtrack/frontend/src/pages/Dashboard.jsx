import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis } from "recharts";
import { formatINR, CHART_COLORS, getHealthConfig, CATEGORY_CONFIG, BILLING_LABELS } from "@/constants";
import { TrendingDown, AlertTriangle, CreditCard, Activity, ArrowRight, ShieldX, Clock } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatCard = ({ label, value, sub, icon: Icon, color, testId }) => (
    <div className="bg-white border border-[#E5E0D8] rounded-md p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200" data-testid={testId}>
        <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#5F635E]">{label}</p>
            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} />
            </div>
        </div>
        <p className="text-2xl font-bold text-[#1C2321] tabular-nums" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</p>
        {sub && <p className="text-xs text-[#5F635E] mt-1">{sub}</p>}
    </div>
);

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [trend, setTrend] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [aRes, tRes, nRes] = await Promise.all([
                    axios.get(`${API}/analytics/dashboard`, { withCredentials: true }),
                    axios.get(`${API}/analytics/spending-trend`, { withCredentials: true }),
                    axios.get(`${API}/notifications`, { withCredentials: true }),
                ]);
                setAnalytics(aRes.data);
                setTrend(tRes.data);
                setNotifications((nRes.data || []).filter(n => !n.is_read).slice(0, 4));
            } catch { /* ignore */ }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-white border border-[#E5E0D8] rounded-md animate-pulse" />
                ))}
            </div>
        );
    }

    const a = analytics || { monthly_spend: 0, yearly_spend: 0, wasted_spend: 0, subscription_count: 0, category_breakdown: [], health_average: 100, top_subscriptions: [] };

    return (
        <div className="space-y-6 max-w-6xl mx-auto" data-testid="dashboard-page">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1C2321]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {greeting}, {user?.name?.split(" ")[0]} 👋
                </h1>
                <p className="text-[#5F635E] text-sm mt-1">
                    {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
            </div>

            {/* Alert banner */}
            {a.wasted_spend > 0 && (
                <div className="bg-[#FAF5F2] border border-[#A34E36]/30 rounded-md p-4 flex items-start gap-3" data-testid="wasted-alert-banner">
                    <AlertTriangle className="w-5 h-5 text-[#A34E36] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-[#A34E36]">Potential savings detected!</p>
                        <p className="text-xs text-[#5F635E] mt-0.5">
                            You're spending <strong>{formatINR(a.wasted_spend)}/month</strong> on subscriptions you haven't used in 30+ days.{" "}
                            <button onClick={() => navigate("/subscriptions")} className="text-[#A34E36] underline">Review now</button>
                        </p>
                    </div>
                </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Monthly Spend" value={formatINR(a.monthly_spend)} sub={`${a.subscription_count} active`} icon={CreditCard} color="#42593E" testId="stat-monthly-spend" />
                <StatCard label="Yearly Spend" value={formatINR(a.yearly_spend)} sub="projected" icon={TrendingDown} color="#1565C0" testId="stat-yearly-spend" />
                <StatCard label="Wasted Spend" value={formatINR(a.wasted_spend)} sub="unused subs" icon={ShieldX} color="#A34E36" testId="stat-wasted-spend" />
                <StatCard label="Health Score" value={`${Math.round(a.health_average)}%`} sub="portfolio avg" icon={Activity} color={getHealthConfig(a.health_average).color} testId="stat-health-score" />
            </div>

            {/* Charts + Notifications row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Spending Trend */}
                <div className="lg:col-span-3 bg-white border border-[#E5E0D8] rounded-md p-5" data-testid="spending-trend-chart">
                    <p className="text-xs font-semibold tracking-widest uppercase text-[#5F635E] mb-4">6-Month Trend</p>
                    {trend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={160}>
                            <LineChart data={trend}>
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5F635E" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#5F635E" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(v) => [formatINR(v), "Spend"]} contentStyle={{ borderRadius: 6, border: "1px solid #E5E0D8", fontSize: 12 }} />
                                <Line type="monotone" dataKey="spend" stroke="#42593E" strokeWidth={2.5} dot={{ fill: "#42593E", r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-[#5F635E] text-sm">Add subscriptions to see trend</div>
                    )}
                </div>

                {/* Category Breakdown */}
                <div className="lg:col-span-2 bg-white border border-[#E5E0D8] rounded-md p-5" data-testid="category-breakdown-chart">
                    <p className="text-xs font-semibold tracking-widest uppercase text-[#5F635E] mb-4">By Category</p>
                    {a.category_breakdown.length > 0 ? (
                        <div className="flex flex-col items-center gap-3">
                            <ResponsiveContainer width="100%" height={130}>
                                <PieChart>
                                    <Pie data={a.category_breakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={2}>
                                        {a.category_breakdown.map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => [formatINR(v), "Spend"]} contentStyle={{ borderRadius: 6, border: "1px solid #E5E0D8", fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="w-full space-y-1.5">
                                {a.category_breakdown.slice(0, 4).map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                            <span className="text-[#5F635E]">{item.name}</span>
                                        </div>
                                        <span className="font-medium text-[#1C2321] tabular-nums">{formatINR(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-[#5F635E] text-sm">No data yet</div>
                    )}
                </div>
            </div>

            {/* Smart Alerts + Top subscriptions */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Smart Alerts */}
                <div className="lg:col-span-2 bg-white border border-[#E5E0D8] rounded-md p-5" data-testid="smart-alerts-section">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-semibold tracking-widest uppercase text-[#5F635E]">Smart Alerts</p>
                        <button onClick={() => navigate("/subscriptions")} className="text-xs text-[#42593E] hover:underline flex items-center gap-1">
                            All <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                    {notifications.length === 0 ? (
                        <div className="text-center py-6 text-[#5F635E] text-sm">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p>No alerts right now</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map(n => (
                                <div key={n.notification_id} className={`text-xs p-3 rounded-md ${n.type === "unused_alert" ? "bg-[#FFF3E0] text-[#D48A42]" : n.type === "trial_ending" ? "bg-[#FDECEA] text-[#A34E36]" : "bg-[#EBF0EA] text-[#42593E]"}`} data-testid={`alert-${n.notification_id}`}>
                                    {n.message}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Subscriptions */}
                <div className="lg:col-span-3 bg-white border border-[#E5E0D8] rounded-md p-5" data-testid="top-subscriptions-section">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-semibold tracking-widest uppercase text-[#5F635E]">Top by Spend</p>
                        <button onClick={() => navigate("/subscriptions")} className="text-xs text-[#42593E] hover:underline flex items-center gap-1">
                            Manage all <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                    {a.top_subscriptions.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-[#5F635E] text-sm mb-3">No subscriptions yet</p>
                            <button
                                onClick={() => navigate("/subscriptions")}
                                className="bg-[#42593E] hover:bg-[#556B2F] text-white text-sm px-4 py-2 rounded-md transition-colors"
                                data-testid="add-first-sub-btn"
                            >
                                Add Your First Subscription
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {a.top_subscriptions.map((sub, i) => {
                                const cfg = CATEGORY_CONFIG[sub.category] || CATEGORY_CONFIG["Other"];
                                const hCfg = getHealthConfig(sub.health_score);
                                return (
                                    <div key={sub.subscription_id} className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }} data-testid={`top-sub-${sub.subscription_id}`}>
                                        <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                                            <cfg.icon className="w-4 h-4" style={{ color: cfg.color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[#1C2321] truncate">{sub.name}</p>
                                            <p className="text-xs text-[#5F635E]">{sub.category}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-semibold text-[#1C2321] tabular-nums">{formatINR(sub.monthly_cost)}<span className="text-xs font-normal text-[#5F635E]">/mo</span></p>
                                            <span className="text-xs px-1.5 py-0.5 rounded-sm font-medium" style={{ color: hCfg.color, background: hCfg.bg }}>
                                                {hCfg.label}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/cancel-assist/${sub.subscription_id}`)}
                                            className="text-[#5F635E] hover:text-[#A34E36] transition-colors p-1"
                                            title="Cancel Assist"
                                            data-testid={`cancel-assist-btn-${sub.subscription_id}`}
                                        >
                                            <ShieldX className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
