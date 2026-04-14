import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, TrendingDown, Bell, Users, Shield, Eye, EyeOff } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LandingPage() {
    const navigate = useNavigate();
    const { user, loading, login } = useAuth();
    const [tab, setTab] = useState("login");
    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [regData, setRegData] = useState({ name: "", email: "", password: "" });
    const [showPass, setShowPass] = useState(false);
    const [showRegPass, setShowRegPass] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && user) navigate("/");
    }, [user, loading, navigate]);

    const handleGoogleLogin = () => {
        // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
        const redirectUrl = window.location.origin + "/";
        window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            const res = await axios.post(`${API}/auth/login`, loginData, { withCredentials: true });
            login(res.data.user);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.detail || "Invalid email or password");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        if (regData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        setSubmitting(true);
        try {
            const res = await axios.post(`${API}/auth/register`, regData, { withCredentials: true });
            login(res.data.user);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.detail || "Registration failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-[#F9F7F1] flex flex-col lg:flex-row">
            {/* Left Panel */}
            <div className="lg:w-5/12 bg-[#42593E] p-8 lg:p-12 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-12">
                        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>SubTrack</span>
                    </div>
                    <h1 className="text-white text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Your Subscription<br />Command Centre
                    </h1>
                    <p className="text-white/70 text-lg mb-10 leading-relaxed">
                        Track every subscription, cancel the wasteful ones, and reclaim your money.
                    </p>
                    <div className="space-y-4">
                        {[
                            { icon: TrendingDown, text: "Spending Intelligence Dashboard with category charts" },
                            { icon: Bell, text: "Smart alerts for unused & renewing subscriptions" },
                            { icon: Users, text: "Family mode with split cost tracking" },
                            { icon: Shield, text: "Cancel Assist — one-click guides to cancel any service" },
                        ].map(({ icon: Icon, text }, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-7 h-7 bg-white/15 rounded-md flex items-center justify-center mt-0.5 flex-shrink-0">
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <p className="text-white/80 text-sm leading-relaxed">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-10 pt-6 border-t border-white/20">
                    <p className="text-white/50 text-xs">Made for India. Track in ₹.</p>
                </div>
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <h2 className="text-[#1C2321] text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {tab === "login" ? "Welcome back" : "Create your account"}
                        </h2>
                        <p className="text-[#5F635E] text-sm mt-1">
                            {tab === "login" ? "Sign in to manage your subscriptions" : "Start tracking your subscriptions for free"}
                        </p>
                    </div>

                    {/* Google OAuth */}
                    <button
                        data-testid="google-signin-btn"
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 border border-[#E5E0D8] bg-white hover:bg-[#F9F7F1] text-[#1C2321] text-sm font-medium py-2.5 px-4 rounded-md transition-all duration-200 mb-5"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="relative mb-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#E5E0D8]" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-[#F9F7F1] px-3 text-xs text-[#5F635E]">or continue with email</span>
                        </div>
                    </div>

                    <Tabs value={tab} onValueChange={(v) => { setTab(v); setError(""); }}>
                        <TabsList className="w-full mb-5 bg-[#F0EDE8]" data-testid="auth-tabs">
                            <TabsTrigger value="login" className="flex-1" data-testid="login-tab">Sign In</TabsTrigger>
                            <TabsTrigger value="register" className="flex-1" data-testid="register-tab">Register</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <Label htmlFor="login-email" className="text-xs font-semibold tracking-widest uppercase text-[#5F635E]">Email</Label>
                                    <Input
                                        id="login-email"
                                        data-testid="login-email-input"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={loginData.email}
                                        onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                                        required
                                        className="mt-1.5 bg-white border-[#E5E0D8]"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="login-password" className="text-xs font-semibold tracking-widest uppercase text-[#5F635E]">Password</Label>
                                    <div className="relative mt-1.5">
                                        <Input
                                            id="login-password"
                                            data-testid="login-password-input"
                                            type={showPass ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={loginData.password}
                                            onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                                            required
                                            className="bg-white border-[#E5E0D8] pr-10"
                                        />
                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F635E]">
                                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                {error && <p className="text-[#A34E36] text-sm" data-testid="auth-error">{error}</p>}
                                <Button
                                    type="submit"
                                    data-testid="login-submit-btn"
                                    disabled={submitting}
                                    className="w-full bg-[#42593E] hover:bg-[#556B2F] text-white"
                                >
                                    {submitting ? "Signing in..." : "Sign In"}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="register">
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div>
                                    <Label htmlFor="reg-name" className="text-xs font-semibold tracking-widest uppercase text-[#5F635E]">Full Name</Label>
                                    <Input
                                        id="reg-name"
                                        data-testid="register-name-input"
                                        placeholder="Your Name"
                                        value={regData.name}
                                        onChange={e => setRegData({ ...regData, name: e.target.value })}
                                        required
                                        className="mt-1.5 bg-white border-[#E5E0D8]"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="reg-email" className="text-xs font-semibold tracking-widest uppercase text-[#5F635E]">Email</Label>
                                    <Input
                                        id="reg-email"
                                        data-testid="register-email-input"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={regData.email}
                                        onChange={e => setRegData({ ...regData, email: e.target.value })}
                                        required
                                        className="mt-1.5 bg-white border-[#E5E0D8]"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="reg-password" className="text-xs font-semibold tracking-widest uppercase text-[#5F635E]">Password</Label>
                                    <div className="relative mt-1.5">
                                        <Input
                                            id="reg-password"
                                            data-testid="register-password-input"
                                            type={showRegPass ? "text" : "password"}
                                            placeholder="Min. 6 characters"
                                            value={regData.password}
                                            onChange={e => setRegData({ ...regData, password: e.target.value })}
                                            required
                                            className="bg-white border-[#E5E0D8] pr-10"
                                        />
                                        <button type="button" onClick={() => setShowRegPass(!showRegPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F635E]">
                                            {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                {error && <p className="text-[#A34E36] text-sm" data-testid="auth-error">{error}</p>}
                                <Button
                                    type="submit"
                                    data-testid="register-submit-btn"
                                    disabled={submitting}
                                    className="w-full bg-[#42593E] hover:bg-[#556B2F] text-white"
                                >
                                    {submitting ? "Creating account..." : "Create Account"}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
