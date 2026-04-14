import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, BILLING_CYCLES, BILLING_DISPLAY, PAYMENT_METHODS, PAYMENT_LABELS } from "@/constants";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FIELD = ({ label, children }) => (
    <div>
        <Label className="text-xs font-semibold tracking-widest uppercase text-[#5F635E]">{label}</Label>
        <div className="mt-1.5">{children}</div>
    </div>
);

export default function AddSubscriptionModal({ open, onClose, onSaved, editSub }) {
    const isEdit = Boolean(editSub);
    const [form, setForm] = useState({
        name: "", category: "Streaming", amount: "", billing_cycle: "monthly",
        next_renewal: "", last_used_date: "", cancel_url: "", payment_method: "card",
        payment_last4: "", is_trial: false, trial_end_date: "", notes: "", logo_color: "#42593E"
    });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (editSub) {
            setForm({
                name: editSub.name || "",
                category: editSub.category || "Streaming",
                amount: editSub.amount?.toString() || "",
                billing_cycle: editSub.billing_cycle || "monthly",
                next_renewal: editSub.next_renewal ? editSub.next_renewal.slice(0, 10) : "",
                last_used_date: editSub.last_used_date ? editSub.last_used_date.slice(0, 10) : "",
                cancel_url: editSub.cancel_url || "",
                payment_method: editSub.payment_method || "card",
                payment_last4: editSub.payment_last4 || "",
                is_trial: editSub.is_trial || false,
                trial_end_date: editSub.trial_end_date ? editSub.trial_end_date.slice(0, 10) : "",
                notes: editSub.notes || "",
                logo_color: editSub.logo_color || "#42593E",
            });
        } else {
            setForm({
                name: "", category: "Streaming", amount: "", billing_cycle: "monthly",
                next_renewal: "", last_used_date: "", cancel_url: "", payment_method: "card",
                payment_last4: "", is_trial: false, trial_end_date: "", notes: "", logo_color: "#42593E"
            });
        }
        setError("");
    }, [editSub, open]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.name.trim()) { setError("Name is required"); return; }
        if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) { setError("Enter a valid amount"); return; }
        if (!form.next_renewal) { setError("Next renewal date is required"); return; }

        const payload = {
            ...form,
            amount: parseFloat(form.amount),
            last_used_date: form.last_used_date || null,
            cancel_url: form.cancel_url || null,
            payment_last4: form.payment_last4 || null,
            trial_end_date: form.trial_end_date || null,
            notes: form.notes || null,
        };

        setSubmitting(true);
        try {
            if (isEdit) {
                const res = await axios.put(`${API}/subscriptions/${editSub.subscription_id}`, payload, { withCredentials: true });
                onSaved(res.data, "updated");
            } else {
                const res = await axios.post(`${API}/subscriptions`, payload, { withCredentials: true });
                onSaved(res.data, "created");
            }
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to save subscription");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white border-[#E5E0D8]" data-testid="add-sub-modal">
                <DialogHeader>
                    <DialogTitle className="text-[#1C2321]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {isEdit ? "Edit Subscription" : "Add Subscription"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {/* Basic fields */}
                    <FIELD label="Service Name">
                        <Input
                            data-testid="sub-name-input"
                            placeholder="e.g. Netflix, Spotify"
                            value={form.name}
                            onChange={e => set("name", e.target.value)}
                            className="bg-[#F9F7F1] border-[#E5E0D8]"
                            required
                        />
                    </FIELD>

                    <div className="grid grid-cols-2 gap-3">
                        <FIELD label="Category">
                            <Select value={form.category} onValueChange={v => set("category", v)}>
                                <SelectTrigger className="bg-[#F9F7F1] border-[#E5E0D8]" data-testid="sub-category-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FIELD>

                        <FIELD label="Billing Cycle">
                            <Select value={form.billing_cycle} onValueChange={v => set("billing_cycle", v)}>
                                <SelectTrigger className="bg-[#F9F7F1] border-[#E5E0D8]" data-testid="sub-billing-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {BILLING_CYCLES.map(c => <SelectItem key={c} value={c}>{BILLING_DISPLAY[c]}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FIELD>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <FIELD label="Amount (₹)">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F635E] text-sm">₹</span>
                                <Input
                                    data-testid="sub-amount-input"
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={e => set("amount", e.target.value)}
                                    className="bg-[#F9F7F1] border-[#E5E0D8] pl-7"
                                    required
                                />
                            </div>
                        </FIELD>

                        <FIELD label="Next Renewal">
                            <Input
                                data-testid="sub-renewal-input"
                                type="date"
                                value={form.next_renewal}
                                onChange={e => set("next_renewal", e.target.value)}
                                className="bg-[#F9F7F1] border-[#E5E0D8]"
                                required
                            />
                        </FIELD>
                    </div>

                    {/* Advanced toggle */}
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-xs text-[#42593E] hover:underline font-medium"
                        data-testid="toggle-advanced-btn"
                    >
                        {showAdvanced ? "— Hide advanced options" : "+ Show advanced options"}
                    </button>

                    {showAdvanced && (
                        <div className="space-y-4 pt-2 border-t border-[#E5E0D8]">
                            <div className="grid grid-cols-2 gap-3">
                                <FIELD label="Payment Method">
                                    <Select value={form.payment_method} onValueChange={v => set("payment_method", v)}>
                                        <SelectTrigger className="bg-[#F9F7F1] border-[#E5E0D8]" data-testid="sub-payment-select">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{PAYMENT_LABELS[m]}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </FIELD>

                                <FIELD label="Card Last 4">
                                    <Input
                                        data-testid="sub-last4-input"
                                        placeholder="1234"
                                        maxLength={4}
                                        value={form.payment_last4}
                                        onChange={e => set("payment_last4", e.target.value.replace(/\D/, ""))}
                                        className="bg-[#F9F7F1] border-[#E5E0D8]"
                                    />
                                </FIELD>
                            </div>

                            <FIELD label="Last Used Date">
                                <Input
                                    data-testid="sub-last-used-input"
                                    type="date"
                                    value={form.last_used_date}
                                    onChange={e => set("last_used_date", e.target.value)}
                                    className="bg-[#F9F7F1] border-[#E5E0D8]"
                                />
                            </FIELD>

                            <FIELD label="Cancel URL (optional)">
                                <Input
                                    data-testid="sub-cancel-url-input"
                                    type="url"
                                    placeholder="https://..."
                                    value={form.cancel_url}
                                    onChange={e => set("cancel_url", e.target.value)}
                                    className="bg-[#F9F7F1] border-[#E5E0D8]"
                                />
                            </FIELD>

                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={form.is_trial}
                                    onCheckedChange={v => set("is_trial", v)}
                                    data-testid="sub-trial-switch"
                                />
                                <Label className="text-sm text-[#1C2321]">This is a free trial</Label>
                            </div>

                            {form.is_trial && (
                                <FIELD label="Trial End Date">
                                    <Input
                                        data-testid="sub-trial-end-input"
                                        type="date"
                                        value={form.trial_end_date}
                                        onChange={e => set("trial_end_date", e.target.value)}
                                        className="bg-[#F9F7F1] border-[#E5E0D8]"
                                    />
                                </FIELD>
                            )}

                            <FIELD label="Notes">
                                <Textarea
                                    data-testid="sub-notes-input"
                                    placeholder="Any notes about this subscription..."
                                    value={form.notes}
                                    onChange={e => set("notes", e.target.value)}
                                    className="bg-[#F9F7F1] border-[#E5E0D8] text-sm resize-none"
                                    rows={2}
                                />
                            </FIELD>
                        </div>
                    )}

                    {error && <p className="text-[#A34E36] text-sm" data-testid="modal-error">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 border-[#E5E0D8]"
                            data-testid="modal-cancel-btn"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 bg-[#42593E] hover:bg-[#556B2F] text-white"
                            data-testid="modal-save-btn"
                        >
                            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Subscription"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
