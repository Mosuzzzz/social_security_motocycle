"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function SupportPage() {
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
                            <form className="space-y-6">
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-700 mb-2 ml-1">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter your full name"
                                        className="w-full h-14 px-6 rounded-2xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-[#004B7E] focus:ring-4 focus:ring-[#004B7E]/5 transition-all font-medium text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] font-bold text-slate-700 mb-2 ml-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="Enter your email address"
                                        className="w-full h-14 px-6 rounded-2xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-[#004B7E] focus:ring-4 focus:ring-[#004B7E]/5 transition-all font-medium text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] font-bold text-slate-700 mb-2 ml-1">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="Enter your phone number"
                                        className="w-full h-14 px-6 rounded-2xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-[#004B7E] focus:ring-4 focus:ring-[#004B7E]/5 transition-all font-medium text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] font-bold text-slate-700 mb-2 ml-1">
                                        Message <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="How can we help you today?"
                                        className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-[#004B7E] focus:ring-4 focus:ring-[#004B7E]/5 transition-all font-medium text-sm resize-none"
                                        required
                                    ></textarea>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-[#004B7E] text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:bg-[#003a61] hover:-translate-y-1 active:translate-y-0 shadow-lg shadow-[#004B7E]/20 transition-all"
                                    >
                                        Submit
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
