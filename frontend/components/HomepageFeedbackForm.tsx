"use client";

import React, { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Send } from "lucide-react";

export default function HomepageFeedbackForm() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.username || "",
        phone: user?.phone || "",
        message: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await apiFetch("/api/feedback", {
                method: "POST",
                body: JSON.stringify({
                    ...formData,
                    user_id: user?.user_id
                }),
            });
            showToast("Feedback sent! Thank you for your support.", "success");
            setFormData(prev => ({ ...prev, message: "" }));
        } catch (err: any) {
            showToast(err.message || "Failed to send feedback", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input
                        type="text"
                        placeholder="John Doe"
                        className="w-full h-12 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 focus:outline-none focus:border-[#004B7E]/30 focus:bg-white transition-all font-bold text-xs"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input
                        type="email"
                        placeholder="john@example.com"
                        className="w-full h-12 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 focus:outline-none focus:border-[#004B7E]/30 focus:bg-white transition-all font-bold text-xs"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={isSubmitting}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input
                    type="tel"
                    placeholder="08X-XXX-XXXX"
                    className="w-full h-12 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 focus:outline-none focus:border-[#004B7E]/30 focus:bg-white transition-all font-bold text-xs"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    required
                    disabled={isSubmitting}
                />
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Message</label>
                <textarea
                    rows={3}
                    placeholder="Tell us what you think..."
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 focus:outline-none focus:border-[#004B7E]/30 focus:bg-white transition-all font-bold text-xs resize-none"
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    required
                    disabled={isSubmitting}
                ></textarea>
            </div>

            <div className="pt-2">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#004B7E] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#003a61] hover:-translate-y-1 active:translate-y-0 shadow-xl shadow-[#004B7E]/20 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send size={16} />
                            Send Message
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
