import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, BILLING_CYCLES, BILLING_DISPLAY, formatINR, formatDate, CHART_COLORS } from "@/constants";
import { Users, Plus, Trash2, UserPlus, CreditCard, Divide, X } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AVATARS = [
    "https://images.unsplash.com/photo-1577760960310-c49bbb09161e?w=64&h=64&fit=crop",
    "https://images.unsplash.com/photo-1774814325557-5d2f88744906?w=64&h=64&fit=crop",
    "https://images.unsplash.com/photo-1774437678715-fb40846dc252?w=64&h=64&fit=crop",
];

export default function FamilyMode() {
    const [family, setFamily] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [showAddSub, setShowAddSub] = useState(false);
    const [familyName, setFamilyName] = useState("");
    const [newMember, setNewMember] = useState({ name: "", email: "" });
    const [newSub, setNewSub] = useState({ name: "", category: "Streaming", amount: "", billing_cycle: "monthly", next_renewal: "", num_members: 2 });
    const [toast, setToast] = useState(null);

    const showMsg = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const load = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/family`, { withCredentials: true });
            setFamily(res.data);
        } catch { setFamily(null); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const createFamily = async (e) => {
        e.preventDefault();
        if (!familyName.trim()) return;
        try {
            const res = await axios.post(`${API}/family`, { name: familyName }, { withCredentials: true });
            setFamily(res.data);
            setShowCreate(false);
            setFamilyName("");
            showMsg("Family group created!");
        } catch (err) { showMsg(err.response?.data?.detail || "Failed to create", "error"); }
    };

    const addMember = async (e) => {
        e.preventDefault();
        if (!newMember.name || !newMember.email) return;
        try {
            await axios.post(`${API}/family/members`, newMember, { withCredentials: true });
            await load();
            setShowAddMember(false);
            setNewMember({ name: "", email: "" });
            showMsg(`${newMember.name} added!`);
        } catch (err) { showMsg(err.response?.data?.detail || "Failed to add member", "error"); }
    };

    const addSharedSub = async (e) => {
        e.preventDefault();
        if (!newSub.name || !newSub.amount || !newSub.next_renewal) return;
        try {
            await axios.post(`${API}/family/subscriptions`, { ...newSub, amount: parseFloat(newSub.amount) }, { withCredentials: true });
            await load();
            setShowAddSub(false);
            setNewSub({ name: "", category: "Streaming", amount: "", billing_cycle: "monthly", next_renewal: "", num_members: 2 });
            showMsg("Shared subscription added!");
        } catch (err) { showMsg(err.response?.data?.detail || "Failed to add", "error"); }
    };

    const deleteSharedSub = async (id) => {
        try {
            await axios.delete(`${API}/family/subscriptions/${id}`, { withCredentials: true });
            await load();
            showMsg("Removed");
        } catch { showMsg("Failed to remove", "error"); }
    };

    const removeMember = async (userId) => {
        if (!window.confirm("Remove this member?")) return;
        try {
            await axios.delete(`${API}/family/members/${userId}`, { withCredentials: true });
            await load();
            showMsg("Member removed");
        } catch { showMsg("Failed to remove", "error"); }
    };

    if (loading) {
        return (
            <div className="space-y-4 max-w-3xl mx-auto">
                {[...Array(2)].map((_, i) => <div key={i} className="h-32 bg-white border border-[#E5E0D8] rounded-md animate-pulse" />)}
            </div>
        );
    }

    return (
        <div className="space-y-5 max-w-3xl mx-auto" data-testid="family-mode-page">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md text-sm font-medium shadow-lg ${toast.type === "error" ? "bg-[#A34E36]" : "bg-[#42593E]"} text-white`}>
                    {toast.msg}
                </div>
            )}

            <div>
                <h1 className="text-2xl font-bold text-[#1C2321]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Family Mode</h1>
                <p className="text-[#5F635E] text-sm mt-0.5">Share subscription costs with family members</p>
            </div>

            {!family ? (
                /* No family yet */
                <div className="bg-white border border-[#E5E0D8] rounded-md p-8 text-center" data-testid="no-family-state">
                    <div className="w-14 h-14 bg-[#EBF0EA] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-7 h-7 text-[#42593E]" />
                    </div>
                    <h2 className="text-lg font-semibold text-[#1C2321] mb-2">Create Your Family Group</h2>
                    <p className="text-[#5F635E] text-sm mb-6 max-w-xs mx-auto">Add family members and split subscription costs fairly between everyone.</p>

                    {!showCreate ? (
                        <Button onClick={() => setShowCreate(true)} className="bg-[#42593E] hover:bg-[#556B2F] text-white" data-testid="create-family-btn">
                            <Users className="w-4 h-4 mr-2" /> Create Family Group
                        </Button>
                    ) : (
                        <form onSubmit={createFamily} className="max-w-xs mx-auto space-y-3">
                            <Input
                                data-testid="family-name-input"
                                placeholder="e.g. The Sharma Family"
                                value={familyName}
                                onChange={e => setFamilyName(e.target.value)}
                                className="bg-[#F9F7F1] border-[#E5E0D8]"
                                required
                            />
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="flex-1 border-[#E5E0D8]">Cancel</Button>
                                <Button type="submit" className="flex-1 bg-[#42593E] hover:bg-[#556B2F] text-white" data-testid="create-family-submit">Create</Button>
                            </div>
                        </form>
                    )}
                </div>
            ) : (
                <>
                    {/* Family header */}
                    <div className="bg-white border border-[#E5E0D8] rounded-md p-5" data-testid="family-header">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#42593E] rounded-full flex items-center justify-center">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-[#1C2321]">{family.name}</h2>
                                    <p className="text-xs text-[#5F635E]">{family.members?.length || 0} members</p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowAddMember(!showAddMember)}
                                className="border-[#E5E0D8] text-[#42593E] gap-1"
                                data-testid="add-member-btn"
                            >
                                <UserPlus className="w-3.5 h-3.5" /> Add Member
                            </Button>
                        </div>

                        {/* Members */}
                        <div className="flex flex-wrap gap-3 mb-3">
                            {(family.members || []).map((member, i) => (
                                <div key={member.user_id} className="flex items-center gap-2 bg-[#F9F7F1] border border-[#E5E0D8] rounded-md px-3 py-2" data-testid={`member-${member.user_id}`}>
                                    <div
                                        className="w-7 h-7 rounded-full bg-cover bg-center"
                                        style={{ backgroundImage: `url(${AVATARS[i % AVATARS.length]})`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                                    />
                                    <div>
                                        <p className="text-xs font-medium text-[#1C2321]">{member.name}</p>
                                        <p className="text-xs text-[#5F635E]">{member.role}</p>
                                    </div>
                                    {member.role !== "owner" && (
                                        <button onClick={() => removeMember(member.user_id)} className="text-[#5F635E] hover:text-[#A34E36] ml-1">
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add member form */}
                        {showAddMember && (
                            <form onSubmit={addMember} className="border-t border-[#E5E0D8] pt-4 mt-2 grid grid-cols-2 gap-3">
                                <Input
                                    data-testid="member-name-input"
                                    placeholder="Name"
                                    value={newMember.name}
                                    onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                                    className="bg-[#F9F7F1] border-[#E5E0D8] text-sm"
                                    required
                                />
                                <Input
                                    data-testid="member-email-input"
                                    type="email"
                                    placeholder="Email"
                                    value={newMember.email}
                                    onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                                    className="bg-[#F9F7F1] border-[#E5E0D8] text-sm"
                                    required
                                />
                                <Button type="submit" size="sm" className="bg-[#42593E] hover:bg-[#556B2F] text-white col-span-2" data-testid="add-member-submit">
                                    Add Member
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Shared Subscriptions */}
                    <div className="bg-white border border-[#E5E0D8] rounded-md p-5" data-testid="shared-subscriptions">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-semibold tracking-widest uppercase text-[#5F635E]">Shared Subscriptions</p>
                            <Button
                                size="sm"
                                onClick={() => setShowAddSub(!showAddSub)}
                                className="bg-[#42593E] hover:bg-[#556B2F] text-white gap-1"
                                data-testid="add-shared-sub-btn"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add
                            </Button>
                        </div>

                        {/* Add shared sub form */}
                        {showAddSub && (
                            <form onSubmit={addSharedSub} className="bg-[#F9F7F1] border border-[#E5E0D8] rounded-md p-4 mb-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs text-[#5F635E] uppercase tracking-widest font-semibold">Service Name</Label>
                                        <Input
                                            data-testid="shared-sub-name"
                                            placeholder="Netflix, Spotify..."
                                            value={newSub.name}
                                            onChange={e => setNewSub({ ...newSub, name: e.target.value })}
                                            className="mt-1 bg-white border-[#E5E0D8] text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-[#5F635E] uppercase tracking-widest font-semibold">Amount (₹)</Label>
                                        <Input
                                            data-testid="shared-sub-amount"
                                            type="number"
                                            placeholder="499"
                                            value={newSub.amount}
                                            onChange={e => setNewSub({ ...newSub, amount: e.target.value })}
                                            className="mt-1 bg-white border-[#E5E0D8] text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-[#5F635E] uppercase tracking-widest font-semibold">Billing</Label>
                                        <Select value={newSub.billing_cycle} onValueChange={v => setNewSub({ ...newSub, billing_cycle: v })}>
                                            <SelectTrigger className="mt-1 bg-white border-[#E5E0D8] text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {BILLING_CYCLES.map(c => <SelectItem key={c} value={c}>{BILLING_DISPLAY[c]}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-[#5F635E] uppercase tracking-widest font-semibold">Split Between</Label>
                                        <Input
                                            data-testid="shared-sub-members"
                                            type="number"
                                            min={1}
                                            max={20}
                                            value={newSub.num_members}
                                            onChange={e => setNewSub({ ...newSub, num_members: parseInt(e.target.value) || 1 })}
                                            className="mt-1 bg-white border-[#E5E0D8] text-sm"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-xs text-[#5F635E] uppercase tracking-widest font-semibold">Next Renewal</Label>
                                        <Input
                                            data-testid="shared-sub-renewal"
                                            type="date"
                                            value={newSub.next_renewal}
                                            onChange={e => setNewSub({ ...newSub, next_renewal: e.target.value })}
                                            className="mt-1 bg-white border-[#E5E0D8] text-sm"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddSub(false)} className="flex-1 border-[#E5E0D8]">Cancel</Button>
                                    <Button type="submit" size="sm" className="flex-1 bg-[#42593E] hover:bg-[#556B2F] text-white" data-testid="shared-sub-submit">Add</Button>
                                </div>
                            </form>
                        )}

                        {/* Shared subs list */}
                        {(!family.shared_subscriptions || family.shared_subscriptions.length === 0) ? (
                            <div className="text-center py-8 text-[#5F635E] text-sm" data-testid="no-shared-subs">
                                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p>No shared subscriptions yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {family.shared_subscriptions.map(sub => (
                                    <div key={sub.shared_sub_id} className="border border-[#E5E0D8] rounded-md p-4" data-testid={`shared-sub-${sub.shared_sub_id}`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-[#1C2321] text-sm">{sub.name}</h3>
                                                <p className="text-xs text-[#5F635E]">{sub.category} · Renews {formatDate(sub.next_renewal)}</p>
                                            </div>
                                            <button onClick={() => deleteSharedSub(sub.shared_sub_id)} className="text-[#5F635E] hover:text-[#A34E36]">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="mt-3 flex items-center gap-3 flex-wrap">
                                            <div className="flex items-center gap-1.5 text-xs bg-[#F9F7F1] border border-[#E5E0D8] rounded-md px-2.5 py-1.5">
                                                <CreditCard className="w-3.5 h-3.5 text-[#5F635E]" />
                                                <span className="text-[#1C2321] font-semibold tabular-nums">{formatINR(sub.amount)}</span>
                                                <span className="text-[#5F635E]">total</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs bg-[#EBF0EA] border border-[#42593E]/20 rounded-md px-2.5 py-1.5">
                                                <Divide className="w-3.5 h-3.5 text-[#42593E]" />
                                                <span className="text-[#42593E] font-semibold tabular-nums">{formatINR(sub.monthly_per_member)}/mo</span>
                                                <span className="text-[#5F635E]">per person ({sub.num_members} people)</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Summary */}
                                <div className="border-t border-[#E5E0D8] pt-3 mt-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[#5F635E]">Total shared monthly</span>
                                        <span className="font-bold text-[#1C2321] tabular-nums">
                                            {formatINR(family.shared_subscriptions.reduce((s, sub) => s + sub.monthly_per_member, 0))}/person/mo
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
