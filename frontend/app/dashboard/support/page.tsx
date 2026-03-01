"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function SupportPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.username || "", // In this app username seems to be email-like or at least we use it here
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
            showToast("Feedback sent! We'll get back to you soon.", "success");
            setFormData(prev => ({ ...prev, message: "" }));
        } catch (err: unknown) {
            showToast((err as Error).message || "Failed to send feedback", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 animate-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left Content */}
                    <div className="space-y-8">
                        <div>
                            <p className="text-[#004B7E] font-black text-sm uppercase tracking-widest mb-6">Support Center</p>
                            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
                                Need help?<br />Contact us
                            </h1>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">
                                Reach out to us if you have any issues or frequently asked questions.
                            </p>
                        </div>
                    </div>

                    {/* Right Form */}
                    <div className="bg-white p-2 border border-slate-50 rounded-4xl">
                        <div className="bg-white p-8 md:p-12 rounded-4xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100">
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-700 mb-2 ml-1">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter your full name"
                                        className="w-full h-14 px-6 rounded-2xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-[#004B7E] focus:ring-4 focus:ring-[#004B7E]/5 transition-all font-medium text-sm disabled:opacity-50"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] font-bold text-slate-700 mb-2 ml-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="Enter your email address"
                                        className="w-full h-14 px-6 rounded-2xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-[#004B7E] focus:ring-4 focus:ring-[#004B7E]/5 transition-all font-medium text-sm disabled:opacity-50"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] font-bold text-slate-700 mb-2 ml-1">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="Enter your phone number"
                                        className="w-full h-14 px-6 rounded-2xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-[#004B7E] focus:ring-4 focus:ring-[#004B7E]/5 transition-all font-medium text-sm disabled:opacity-50"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] font-bold text-slate-700 mb-2 ml-1">
                                        Message <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="How can we help you today?"
                                        className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-[#004B7E] focus:ring-4 focus:ring-[#004B7E]/5 transition-all font-medium text-sm resize-none disabled:opacity-50"
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        required
                                        disabled={isSubmitting}
                                    ></textarea>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-[#004B7E] text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:bg-[#003a61] hover:-translate-y-1 active:translate-y-0 shadow-lg shadow-[#004B7E]/20 transition-all disabled:opacity-50 disabled:translate-y-0"
                                    >
                                        {isSubmitting ? "Submitting..." : "Submit"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

