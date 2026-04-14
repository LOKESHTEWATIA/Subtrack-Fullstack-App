import { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatINR, CHART_COLORS, getHealthConfig, CATEGORY_CONFIG } from "@/constants";
import { TrendingDown, TrendingUp, AlertTriangle, Activity, Sparkles } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Analytics() {
    const [analytics, setAnalytics] = useState(null);
    const [trend, setTrend] = useState([]);
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [aRes, tRes, sRes] = await Promise.all([
                    axios.get(`${API}/analytics/dashboard`, { withCredentials: true }),
                    axios.get(`${API}/analytics/spending-trend`, { withCredentials: true }),
                    axios.get(`${API}/subscriptions`, { withCredentials: true }),
                ]);
                setAnalytics(aRes.data);
                setTrend(tRes.data || []);
                setSubs(sRes.data || []);
            } catch { /* ignore */ }
            finally { setLoading(false); }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="space-y-4 max-w-5xl mx-auto">
                {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-white border border-[#E5E0D8] rounded-md animate-pulse" />)}
            </div>
        );
    }

    const a = analytics || { monthly_spend: 0, yearly_spend: 0, wasted_spend: 0, subscription_count: 0, category_breakdown: [], health_average: 100 };
    const activeSubs = subs.filter(s => s.status === "active");

    // Health score distribution
    const healthDist = [
        { name: "Excellent (80-100)", value: activeSubs.filter(s => s.health_score >= 80).length, color: "#16a34a" },
        { name: "Good (60-79)", value: activeSubs.filter(s => s.health_score >= 60 && s.health_score < 80).length, color: "#42593E" },
        { name: "At Risk (40-59)", value: activeSubs.filter(s => s.health_score >= 40 && s.health_score < 60).length, color: "#D48A42" },
        { name: "Cancel? (0-39)", value: activeSubs.filter(s => s.health_score < 40).length, color: "#A34E36" },
    ].filter(d => d.value > 0);

    const cancelCandidates = activeSubs.filter(s => s.health_score < 50).sort((a, b) => b.monthly_cost - a.monthly_cost);
    const potentialSavings = cancelCandidates.reduce((sum, s) => sum + (s.monthly_cost || 0), 0);

    return (
        <div className="space-y-6 max-w-5xl mx-auto" data-testid="analytics-page">
            <div>
                <h1 className="text-2xl font-bold text-[#1C2321]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Analytics</h1>
                <p className="text-[#5F635E] text-sm mt-0.5">Understand your subscription spending patterns</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Monthly Spend", value: formatINR(a.monthly_spend), icon: TrendingUp, color: "#42593E", sub: `${a.subscription_count} subs`, testId: "analytics-monthly" },
                    { label: "Yearly Projection", value: formatINR(a.yearly_spend), icon: TrendingDown, color: "#1565C0", sub: "at current rate", testId: "analytics-yearly" },
                    { label: "Wasted (30+ days)", value: formatINR(a.wasted_spend), icon: AlertTriangle, color: "#A34E36", sub: "unused subs", testId: "analytics-wasted" },
                    { label: "Portfolio Health", value: `${Math.round(a.health_average)}%`, icon: Activity, color: getHealthConfig(a.health_average).color, sub: "avg score", testId: "analytics-health" },
                ].map(({ label, value, icon: Icon, color, sub, testId }) => (
                    <div key={testId} className="bg-white border border-[#E5E0D8] rounded-md p-4" data-testid={testId}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold tracking-widest uppercase text-[#5F635E]">{label}</p>
                            <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <p className="text-xl font-bold text-[#1C2321] tabular-nums">{value}</p>
                        <p className="text-xs text-[#5F635E] mt-0.5">{sub}</p>
                    </div>
                ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Spending trend */}
                <div className="lg:col-span-2 bg-white border border-[#E5E0D8] rounded-md p-5" data-testid="trend-chart">
                    <p className="text-xs font-semibold tracking-widest uppercase text-[#5F635E] mb-5">6-Month Spending Trend</p>
                    {trend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={trend}>
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5F635E" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#5F635E" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={v => [formatINR(v), "Spend"]} contentStyle={{ borderRadius: 6, border: "1px solid #E5E0D8", fontSize: 12 }} />
                                <Bar dataKey="spend" fill="#42593E" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-[#5F635E] text-sm">Add subscriptions to see trend</div>
                    )}
                </div>

                {/* Category breakdown */}
                <div className="bg-white border border-[#E5E0D8] rounded-md p-5" data-testid="category-chart">
                    <p className="text-xs font-semibold tracking-widest uppercase text-[#5F635E] mb-5">Category Breakdown</p>
                    {a.category_breakdown.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie data={a.category_breakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                                        {a.category_breakdown.map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={v => [formatINR(v), "Spend"]} contentStyle={{ borderRadius: 6, border: "1px solid #E5E0D8", fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-2">
                                {a.category_breakdown.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                            <span className="text-[#5F635E]">{item.name}</span>
                                        </div>
                                        <span className="font-medium text-[#1C2321] tabular-nums">{formatINR(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-[#5F635E] text-sm">No data yet</div>
                    )}
                </div>
            </div>

            {/* Health + Cancel candidates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Health distribution */}
                <div className="bg-white border border-[#E5E0D8] rounded-md p-5" data-testid="health-distribution">
                    <p className="text-xs font-semibold tracking-widest uppercase text-[#5F635E] mb-4">Health Distribution</p>
                    {healthDist.length > 0 ? (
                        <div className="space-y-3">
                            {healthDist.map((d, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-[#5F635E]">{d.name}</span>
                                        <span className="font-medium" style={{ color: d.color }}>{d.value} subs</span>
                                    </div>
                                    <div className="h-2 bg-[#F0EDE8] rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${activeSubs.length ? (d.value / activeSubs.length) * 100 : 0}%`, background: d.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[#5F635E] text-sm text-center py-8">No subscriptions to analyze</p>
                    )}
                </div>

                {/* AI Insight / Cancel candidates */}
                <div className="bg-[#FAF5F2] border border-[#A34E36]/30 rounded-md p-5" data-testid="cancel-candidates">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-[#A34E36]" />
                        <p className="text-xs font-semibold tracking-widest uppercase text-[#A34E36]">Cancel Candidates</p>
                    </div>
                    {cancelCandidates.length === 0 ? (
                        <div className="text-center py-6">
                            <Activity className="w-8 h-8 text-[#42593E] mx-auto mb-2" />
                            <p className="text-sm font-medium text-[#42593E]">All subscriptions look healthy!</p>
                            <p className="text-xs text-[#5F635E] mt-1">Keep marking subscriptions as used to maintain scores.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-[#5F635E] mb-3">
                                Cancelling these could save you <strong className="text-[#A34E36]">{formatINR(potentialSavings)}/month</strong>:
                            </p>
                            <div className="space-y-2">
                                {cancelCandidates.slice(0, 4).map(sub => {
                                    const cfg = CATEGORY_CONFIG[sub.category] || CATEGORY_CONFIG["Other"];
                                    return (
                                        <div key={sub.subscription_id} className="flex items-center gap-2 p-2 bg-white rounded-md border border-[#E5E0D8]" data-testid={`cancel-candidate-${sub.subscription_id}`}>
                                            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: cfg.bg }}>
                                                <cfg.icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-[#1C2321] truncate">{sub.name}</p>
                                                <p className="text-xs text-[#5F635E]">Score: {sub.health_score}%</p>
                                            </div>
                                            <span className="text-xs font-semibold text-[#A34E36] tabular-nums">{formatINR(sub.monthly_cost)}/mo</span>
                                        </div>
                                    );
                                })}
                            </div>
                            {potentialSavings > 0 && (
                                <div className="mt-3 p-2 bg-[#A34E36]/10 rounded-md">
                                    <p className="text-xs text-[#A34E36] font-medium">
                                        Yearly savings potential: <span className="font-bold">{formatINR(potentialSavings * 12)}</span>
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* All subscriptions health scores */}
            {activeSubs.length > 0 && (
                <div className="bg-white border border-[#E5E0D8] rounded-md p-5" data-testid="all-health-scores">
                    <p className="text-xs font-semibold tracking-widest uppercase text-[#5F635E] mb-4">Subscription Health Scores</p>
                    <div className="space-y-3">
                        {activeSubs.sort((a, b) => a.health_score - b.health_score).map(sub => {
                            const hCfg = getHealthConfig(sub.health_score);
                            const cfg = CATEGORY_CONFIG[sub.category] || CATEGORY_CONFIG["Other"];
                            return (
                                <div key={sub.subscription_id} className="flex items-center gap-3" data-testid={`health-row-${sub.subscription_id}`}>
                                    <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                                        <cfg.icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium text-[#1C2321] truncate">{sub.name}</span>
                                            <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: hCfg.color }}>{sub.health_score}% · {hCfg.label}</span>
                                        </div>
                                        <div className="h-1.5 bg-[#F0EDE8] rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${sub.health_score}%`, background: hCfg.color }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
