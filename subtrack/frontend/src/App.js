import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LandingPage from "@/pages/LandingPage";
import AuthCallback from "@/pages/AuthCallback";
import Dashboard from "@/pages/Dashboard";
import Subscriptions from "@/pages/Subscriptions";
import Analytics from "@/pages/Analytics";
import CancelAssist from "@/pages/CancelAssist";
import FamilyMode from "@/pages/FamilyMode";
import Settings from "@/pages/Settings";
import Layout from "@/components/Layout";

function LoadingScreen() {
    return (
        <div className="min-h-screen bg-[#F9F7F1] flex items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-[#42593E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[#5F635E] text-sm">Loading SubTrack...</p>
            </div>
        </div>
    );
}

function ProtectedLayout() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
        }
    }, [user, loading, navigate]);

    if (loading) return <LoadingScreen />;
    if (!user) return null;

    return (
        <Layout>
            <Outlet />
        </Layout>
    );
}

function AppRouter() {
    const location = useLocation();

    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    // Handle Google OAuth callback synchronously before rendering routes
    if (location.hash?.includes("session_id=")) {
        return <AuthCallback />;
    }

    return (
        <Routes>
            <Route path="/login" element={<LandingPage />} />
            <Route path="/" element={<ProtectedLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="cancel-assist/:id" element={<CancelAssist />} />
                <Route path="family" element={<FamilyMode />} />
                <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <AuthProvider>
                    <AppRouter />
                </AuthProvider>
            </BrowserRouter>
        </div>
    );
}

export default App;
