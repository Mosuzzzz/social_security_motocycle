"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
    CheckCircle2,
    ArrowRight,
    ChevronRight
} from "lucide-react";

export default function NewBookingPage() {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            await apiFetch("/api/orders", {
                method: "POST",
                body: JSON.stringify({
                    bike_id: 1,
                }),
            });
            setStep(3);
        } catch (err: unknown) {
            alert((err as Error).message || "Failed to create booking");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-10 py-10">
                {/* Progress Header */}
                <div className="flex items-center justify-center gap-4 text-sm font-bold uppercase tracking-widest text-zinc-500">
                    <span className={step >= 1 ? "text-indigo-400" : ""}>Motorcycle</span>
                    <ChevronRight size={14} />
                    <span className={step >= 2 ? "text-indigo-400" : ""}>Details</span>
                    <ChevronRight size={14} />
                    <span className={step >= 3 ? "text-indigo-400" : ""}>Done</span>
                </div>

                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold mb-4 italic">Which bike are you bringing?</h1>
                            <p className="text-zinc-500">Tell us about your motorcycle to get started.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-full">
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Motorcycle Brand</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Honda, Yamaha"
                                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Model</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Forza 350"
                                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">License Plate</label>
                                <input
                                    type="text"
                                    placeholder="1กข-1234"
                                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                            </div>
                        </div>

                        <button
                            onClick={nextStep}
                            className="w-full py-5 bg-white text-black font-bold rounded-[22px] hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group"
                        >
                            Continue to Details
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold mb-4 italic">What&apos;s the issue?</h1>
                            <p className="text-zinc-500">Provide as much detail as possible to help our mechanics.</p>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-zinc-400">Describe the problem</label>
                            <textarea
                                rows={6}
                                placeholder="e.g. Engine making noise, oil leak, need standard maintenance..."
                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={prevStep}
                                className="flex-1 py-5 border border-white/10 font-bold rounded-[22px] hover:bg-white/5 transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="flex-[2] py-5 bg-indigo-600 text-white font-bold rounded-[22px] hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20"
                            >
                                {isLoading ? "Processing..." : "Confirm Booking"}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center py-20 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-emerald-500 rounded-[32px] mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                            <CheckCircle2 size={48} className="text-white" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Booking Successful!</h1>
                        <p className="text-zinc-500 max-w-sm mx-auto mb-10 leading-relaxed">
                            Your service order has been created. A mechanic will review it and update the status shortly.
                        </p>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="px-10 py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
