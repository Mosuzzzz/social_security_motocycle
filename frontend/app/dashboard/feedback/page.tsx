"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import {
    MessageSquare,
    User,
    Mail,
    Phone,
    Calendar,
    Search,
    Trash2
} from "lucide-react";

interface Feedback {
    feedback_id: number;
    user_id: number | null;
    name: string;
    email: string;
    phone: string;
    message: string;
    created_at: string;
}

export default function FeedbackAdminPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchFeedbacks = async () => {
            try {
                const data = await apiFetch("/api/feedback");
                setFeedbacks(data);
            } catch (err) {
                console.error("Failed to fetch feedbacks", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeedbacks();
    }, []);

    const handleDeleteFeedback = async (id: number) => {
        if (!confirm("Are you sure you want to delete this feedback?")) return;

        try {
            await apiFetch(`/api/feedback/${id}`, { method: "DELETE" });
            setFeedbacks(feedbacks.filter(f => f.feedback_id !== id));
        } catch (err) {
            console.error("Failed to delete feedback", err);
        }
    };

    const filteredFeedbacks = feedbacks.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <div className="w-12 h-12 border-4 border-[#004B7E]/20 border-t-[#004B7E] rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading feedback messages...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-10 pt-4 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#004B7E]/5 text-[#004B7E] text-[10px] font-black uppercase tracking-wider border border-[#004B7E]/10">
                            <MessageSquare size={14} />
                            Customer Satisfaction
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-800 uppercase tracking-tighter">
                            Customer Feedback
                        </h1>
                        <p className="text-slate-400 font-bold text-sm max-w-md">Manage and review messages from your customers and visitors.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#004B7E] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search feedback..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:border-[#004B7E]/30 focus:shadow-lg transition-all text-sm font-medium w-64 shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Feedback List */}
                <div className="grid grid-cols-1 gap-6">
                    {filteredFeedbacks.length > 0 ? (
                        filteredFeedbacks.map((f) => (
                            <div key={f.feedback_id} className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
                                {/* Decorative Badge */}
                                <div className="absolute top-0 right-0 p-8">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-[#FFD700]/10 group-hover:text-[#004B7E] group-hover:border-[#FFD700]/20 transition-all">
                                        <MessageSquare size={20} />
                                    </div>
                                    <button
                                        onClick={() => handleDeleteFeedback(f.feedback_id)}
                                        className="mt-4 w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-300 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                        title="Delete Feedback"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                                    {/* Sender Info */}
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#004B7E]/5 flex items-center justify-center text-[#004B7E]">
                                                    <User size={18} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sender</span>
                                                    <span className="text-sm font-black text-slate-800">{f.name}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-slate-500">
                                                <Mail size={16} />
                                                <span className="text-xs font-bold">{f.email}</span>
                                            </div>

                                            <div className="flex items-center gap-3 text-slate-500">
                                                <Phone size={16} />
                                                <span className="text-xs font-bold">{f.phone}</span>
                                            </div>

                                            <div className="flex items-center gap-3 text-slate-400 pt-2 border-t border-slate-50">
                                                <Calendar size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-wider">
                                                    {new Date(f.created_at).toLocaleDateString()} at {new Date(f.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            {f.user_id ? (
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100 uppercase tracking-widest">
                                                    Registered User
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black rounded-lg border border-slate-100 uppercase tracking-widest">
                                                    Guest
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Message Content */}
                                    <div className="lg:col-span-3 space-y-4 relative">
                                        <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100 relative group-hover:bg-white group-hover:shadow-inner transition-all">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Feedback Message</div>
                                            <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                                                {f.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-20 shadow-xl flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                <MessageSquare size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">No feedback messages found</h3>
                                <p className="text-slate-400 font-bold text-sm">When customers send you messages, they will appear here.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
