import { Tv, Music, Briefcase, Gamepad2, Heart, Newspaper, Cloud, BookOpen, TrendingUp, MoreHorizontal, CreditCard, Smartphone, Wallet, Building2 } from "lucide-react";

export const CATEGORY_CONFIG = {
    "Streaming": { color: "#E74C3C", bg: "#FDECEA", icon: Tv },
    "Music": { color: "#1DB954", bg: "#E8F8EE", icon: Music },
    "Productivity": { color: "#42593E", bg: "#EBF0EA", icon: Briefcase },
    "Gaming": { color: "#7B2FBE", bg: "#F3ECFA", icon: Gamepad2 },
    "Health & Fitness": { color: "#E91E63", bg: "#FCE4EC", icon: Heart },
    "News & Media": { color: "#F57C00", bg: "#FFF3E0", icon: Newspaper },
    "Cloud Storage": { color: "#1565C0", bg: "#E3F2FD", icon: Cloud },
    "Education": { color: "#FF5722", bg: "#FBE9E7", icon: BookOpen },
    "Finance": { color: "#2E7D32", bg: "#E8F5E9", icon: TrendingUp },
    "Other": { color: "#5F635E", bg: "#F5F5F5", icon: MoreHorizontal },
};

export const CATEGORIES = Object.keys(CATEGORY_CONFIG);

export const BILLING_CYCLES = ["monthly", "quarterly", "yearly"];
export const BILLING_LABELS = { monthly: "/mo", quarterly: "/qtr", yearly: "/yr" };
export const BILLING_DISPLAY = { monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly" };

export const PAYMENT_METHODS = ["card", "upi", "wallet", "netbanking"];
export const PAYMENT_LABELS = { card: "Card", upi: "UPI", wallet: "Wallet", netbanking: "Net Banking" };
export const PAYMENT_ICONS = { card: CreditCard, upi: Smartphone, wallet: Wallet, netbanking: Building2 };

export const HEALTH_CONFIG = {
    excellent: { label: "Excellent", color: "#16a34a", bg: "#dcfce7", min: 80 },
    good: { label: "Good", color: "#42593E", bg: "#EBF0EA", min: 60 },
    atrisk: { label: "At Risk", color: "#D48A42", bg: "#FFF3E0", min: 40 },
    cancel: { label: "Cancel?", color: "#A34E36", bg: "#FDECEA", min: 0 },
};

export const getHealthConfig = (score) => {
    if (score >= 80) return HEALTH_CONFIG.excellent;
    if (score >= 60) return HEALTH_CONFIG.good;
    if (score >= 40) return HEALTH_CONFIG.atrisk;
    return HEALTH_CONFIG.cancel;
};

export const formatINR = (amount) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

export const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
        return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
        return "—";
    }
};

export const getDaysUntil = (dateStr) => {
    if (!dateStr) return null;
    try {
        const diff = new Date(dateStr) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    } catch {
        return null;
    }
};

export const CHART_COLORS = ["#42593E", "#A34E36", "#D48A42", "#1565C0", "#7B2FBE", "#1DB954", "#E74C3C", "#F57C00", "#2E7D32", "#5F635E"];
