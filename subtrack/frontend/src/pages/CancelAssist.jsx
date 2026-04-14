import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { CATEGORY_CONFIG, formatINR, formatDate, getHealthConfig } from "@/constants";
import { ArrowLeft, ExternalLink, Copy, CheckCircle, TrendingDown, ShieldX, Clock, AlertTriangle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CancelAssist() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [simulator, setSimulator] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [confirmedSteps, setConfirmedSteps] = useState([]);
    const [cancelled, setCancelled] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [caRes, simRes] = await Promise.all([
                    axios.get(`${API}/subscriptions/${id}/cancel-assist`, { withCredentials: true }),
                    axios.get(`${API}/subscriptions/${id}/cancel-simulator`, { withCredentials: true }),
                ]);
                setData(caRes.data);
                setSimulator(simRes.data);
            } catch { navigate("/subscriptions"); }
            finally { setLoading(false); }
        };
        load();
    }, [id, navigate]);

    const handleCopyEmail = async () => {
        if (!data?.email_template) return;
        await navigator.clipboard.writeText(data.email_template);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleStep = (i) => {
        setConfirmedSteps(prev => prev.includes(i) ? prev.filter(s => s !== i) : [...prev, i]);
    };

    const handleMarkCancelled = async () => {
        try {
            await axios.put(`${API}/subscriptions/${id}`, { status: "cancelled" }, { withCredentials: true });
            setCancelled(true);
            setTimeout(() => navigate("/subscriptions"), 2000);
        } catch { /* ignore */ }
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto space-y-4">
                {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white border border-[#E5E0D8] rounded-md animate-pulse" />)}
            </div>
        );
    }

    if (!data) return null;

    const sub = data.subscription;
    const catCfg = CATEGORY_CONFIG[sub.category] || CATEGORY_CONFIG["Other"];
    const hCfg = getHealthConfig(sub.health_score);
    const allDone = data.steps && confirmedSteps.length === data.steps.length;

    if (cancelled) {
        return (
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-64 gap-4" data-testid="cancellation-success">
                <div className="w-16 h-16 bg-[#EBF0EA] rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-[#42593E]" />
                </div>
                <h2 className="text-xl font-bold text-[#1C2321]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Subscription Cancelled</h2>
                <p className="text-[#5F635E] text-sm">"{sub.name}" has been marked as cancelled. Redirecting...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-5" data-testid="cancel-assist-page">
            {/* Back */}
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[#5F635E] hover:text-[#1C2321] transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {/* Header */}
            <div className="bg-[#FAF5F2] border border-[#A34E36]/30 rounded-md p-5">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-md flex items-center justify-center" style={{ background: catCfg.bg }}>
                        <catCfg.icon className="w-6 h-6" style={{ color: catCfg.color }} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-xl font-bold text-[#1C2321]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{sub.name}</h1>
                            <ShieldX className="w-5 h-5 text-[#A34E36]" />
                        </div>
                        <p className="text-sm text-[#5F635E]">{sub.category}</p>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-base font-bold text-[#1C2321] tabular-nums">{formatINR(sub.amount)}</span>
                            <span className="text-xs px-2 py-0.5 rounded-sm font-medium" style={{ color: hCfg.color, background: hCfg.bg }}>
                                {sub.health_score}% · {hCfg.label}
                            </span>
                            {sub.next_renewal && (
                                <span className="text-xs text-[#5F635E] flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Renews {formatDate(sub.next_renewal)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Simulator */}
            {simulator && (
                <div className="bg-white border border-[#E5E0D8] rounded-md p-5" data-testid="cancel-simulator">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingDown className="w-4 h-4 text-[#42593E]" />
                        <p className="text-xs font-semibold tracking-widest uppercase text-[#5F635E]">What If I Cancel?</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Monthly Savings", value: formatINR(simulator.monthly_savings) },
                            { label: "Yearly Savings", value: formatINR(simulator.yearly_savings) },
                            { label: "5-Year Savings", value: formatINR(simulator.five_year_savings) },
                        ].map(({ label, value }) => (
                            <div key={label} className="text-center p-3 bg-[#EBF0EA] rounded-md">
                                <p className="text-lg font-bold text-[#42593E] tabular-nums">{value}</p>
                                <p className="text-xs text-[#5F635E] mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-[#5F635E] mt-3 text-center">
                        Cancel {sub.name} and save <strong className="text-[#42593E]">{formatINR(simulator.yearly_savings)}</strong> this year!
                    </p>
                </div>
            )}

            {/* Step-by-step guide */}
            <div className="bg-white border border-[#E5E0D8] rounded-md p-5" data-testid="cancel-steps">
                <p className="text-xs font-semibold tracking-widest uppercase text-[#5F635E] mb-4">Step-by-Step Guide</p>
                <div className="space-y-3">
                    {(data.steps || []).map((step, i) => (
                        <button
                            key={i}
                            onClick={() => toggleStep(i)}
                            className="w-full flex items-start gap-3 p-3 rounded-md text-left transition-colors hover:bg-[#F9F7F1]"
                            data-testid={`cancel-step-${i}`}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${confirmedSteps.includes(i) ? "bg-[#42593E] border-[#42593E]" : "border-[#C8C2B8]"}`}>
                                {confirmedSteps.includes(i) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-[#5F635E] uppercase tracking-widest">Step {i + 1}</span>
                                <p className={`text-sm mt-0.5 ${confirmedSteps.includes(i) ? "line-through text-[#5F635E]" : "text-[#1C2321]"}`}>{step}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Cancel URL */}
                <div className="mt-4">
                    <a
                        href={data.cancel_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="cancel-url-btn"
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#A34E36] hover:bg-[#8A3F2A] text-white text-sm font-medium rounded-md transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" /> Open Cancel Page
                    </a>
                </div>
            </div>

            {/* Email Template */}
            <div className="bg-white border border-[#E5E0D8] rounded-md p-5" data-testid="email-template-section">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold tracking-widest uppercase text-[#5F635E]">Cancellation Email Template</p>
                    <button
                        onClick={handleCopyEmail}
                        className="flex items-center gap-1.5 text-xs text-[#42593E] hover:bg-[#EBF0EA] px-3 py-1.5 rounded-md transition-colors"
                        data-testid="copy-email-btn"
                    >
                        {copied ? <><CheckCircle className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Email</>}
                    </button>
                </div>
                <pre className="text-xs text-[#5F635E] whitespace-pre-wrap bg-[#F9F7F1] p-4 rounded-md font-mono leading-relaxed border border-[#E5E0D8]">
                    {data.email_template}
                </pre>
            </div>

            {/* Mark as cancelled */}
            <div className="bg-white border border-[#E5E0D8] rounded-md p-5">
                <p className="text-sm text-[#5F635E] mb-3">
                    {allDone ? "All steps completed! Mark this subscription as cancelled in SubTrack." : "Complete all steps above, then mark as cancelled."}
                </p>
                <Button
                    onClick={handleMarkCancelled}
                    disabled={!allDone}
                    className={`w-full ${allDone ? "bg-[#A34E36] hover:bg-[#8A3F2A] text-white" : "bg-[#F0EDE8] text-[#5F635E] cursor-not-allowed"}`}
                    data-testid="mark-cancelled-btn"
                >
                    <ShieldX className="w-4 h-4 mr-2" />
                    {allDone ? "Mark as Cancelled" : `Complete ${data.steps.length - confirmedSteps.length} more step(s)`}
                </Button>
            </div>
        </div>
    );
}
