import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AuthCallback() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const hasProcessed = useRef(false);

    useEffect(() => {
        // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
        if (hasProcessed.current) return;
        hasProcessed.current = true;

        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace("#", "?"));
        const sessionId = params.get("session_id");

        if (!sessionId) {
            navigate("/login");
            return;
        }

        (async () => {
            try {
                const res = await axios.post(
                    `${API}/auth/google/callback`,
                    { session_id: sessionId },
                    { withCredentials: true }
                );
                login(res.data.user);
                navigate("/", { replace: true });
            } catch (err) {
                console.error("Google auth callback failed:", err);
                navigate("/login");
            }
        })();
    }, [navigate, login]);

    return (
        <div className="min-h-screen bg-[#F9F7F1] flex items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-[#42593E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[#5F635E] text-sm">Completing sign-in...</p>
            </div>
        </div>
    );
}
