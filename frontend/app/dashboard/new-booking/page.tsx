"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import {
    CheckCircle2,
    ChevronRight,
    Loader2,
    Wrench,
    FileText
} from "lucide-react";

export default function NewBookingPage() {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [licensePlate, setLicensePlate] = useState("");
    const [walkInDate, setWalkInDate] = useState("");
    const [problem, setProblem] = useState("");

    const router = useRouter();
    const { showToast } = useToast();

    const nextStep = () => {
        if (step === 1 && (!brand || !model || !licensePlate)) {
            showToast("Please fill in all vehicle details", "error");
            return;
        }
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    const handleSubmit = async () => {
        if (!walkInDate) {
            showToast("Please select a walk-in date", "error");
            return;
        }
        if (!problem) {
            showToast("Please describe the problem", "error");
            return;
        }

        setIsLoading(true);
        try {
            await apiFetch("/api/orders", {
                method: "POST",
                body: JSON.stringify({
                    brand,
                    model,
                    license_plate: licensePlate,
                    problem_description: problem,
                    walk_in_date: walkInDate
                }),
            });
            showToast("Protocol initialized successfully!", "success");
            setStep(3);
        } catch (err: unknown) {
            showToast((err as Error).message || "Failed to initialize protocol", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-xl mx-auto space-y-8 animate-in relative z-10 pt-4">

                {/* Form Container */}
                <div className="bg-black/40 border border-white/10 backdrop-blur-2xl rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 md:p-10 relative overflow-hidden">
                    {/* Subtle Glow Background */}
                    <div className="absolute -top-32 -left-32 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                    <div className="relative z-10">
                        {/* Progress Header */}
                        <div className="flex items-center justify-between mb-10">
                            <p className="text-gray-400 font-bold text-[11px] uppercase tracking-widest">Phase {step} <span className="text-gray-600 mx-1">/</span> 3</p>
                            <div className="flex gap-2">
                                {[1, 2, 3].map(s => (
                                    <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? "w-8 bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)]" : "w-4 bg-white/10"}`} />
                                ))}
                            </div>
                        </div>

                        {/* Step 1: Vehicle Details */}
                        {step === 1 && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                <section>
                                    <h1 className="text-3xl font-medium tracking-tight mb-2 text-white flex items-center gap-3">
                                        <div className="p-2 bg-white/5 rounded-xl border border-white/10 text-pink-400">
                                            <Wrench size={24} />
                                        </div>
                                        Vehicle Specs
                                    </h1>
                                    <p className="text-gray-400 font-light">Input the technical parameters of your machine.</p>
                                </section>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-[13px] text-gray-300 font-medium mb-2 uppercase tracking-wide">Brand Manufacturer</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Honda, Yamaha"
                                            value={brand}
                                            onChange={(e) => setBrand(e.target.value)}
                                            className="ios-input"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-300 font-medium mb-2 uppercase tracking-wide">Model Designation</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Forza 350, MT-07"
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            className="ios-input"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-300 font-medium mb-2 uppercase tracking-wide">License Plate</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 1กข-1234"
                                            value={licensePlate}
                                            onChange={(e) => setLicensePlate(e.target.value)}
                                            className="ios-input font-mono"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={nextStep}
                                    className="w-full px-6 py-4 mt-2 rounded-full bg-white text-black font-semibold hover:bg-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center gap-2 text-[15px]"
                                >
                                    Initialize Phase 2
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}

                        {/* Step 2: Issue Description */}
                        {step === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                <section>
                                    <h1 className="text-3xl font-medium tracking-tight mb-2 text-white flex items-center gap-3">
                                        <div className="p-2 bg-white/5 rounded-xl border border-white/10 text-pink-400">
                                            <FileText size={24} />
                                        </div>
                                        Diagnostic Report
                                    </h1>
                                    <p className="text-gray-400 font-light">Detail the required maintenance or anamolies detected.</p>
                                </section>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-[13px] text-gray-300 font-medium mb-2 uppercase tracking-wide">Expected Walk-in Date</label>
                                        <input
                                            type="date"
                                            value={walkInDate}
                                            onChange={(e) => setWalkInDate(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all text-white backdrop-blur-sm [color-scheme:dark]"
                                            required
                                            min={new Date().toISOString().split("T")[0]}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-300 font-medium mb-2 uppercase tracking-wide">Issue Log</label>
                                        <textarea
                                            rows={6}
                                            placeholder="Outline the symptoms, errors, or service expectations..."
                                            value={problem}
                                            onChange={(e) => setProblem(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all text-white placeholder:text-gray-500 backdrop-blur-sm resize-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        onClick={prevStep}
                                        className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-full hover:bg-white/10 transition-colors"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                        className="flex-[2] py-4 rounded-full bg-pink-500 text-white font-semibold hover:bg-pink-400 hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Transmitting...
                                            </>
                                        ) : (
                                            "Deploy Order"
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Confirmation */}
                        {step === 3 && (
                            <div className="text-center py-10 animate-in zoom-in-95 fade-in duration-500">
                                <div className="w-24 h-24 bg-green-500/10 border border-green-500/30 rounded-full mx-auto mb-8 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                    <CheckCircle2 size={48} className="text-green-400" />
                                </div>
                                <h1 className="text-3xl font-medium tracking-tight mb-4 text-white">Pipeline Established</h1>
                                <p className="text-gray-400 font-light max-w-sm mx-auto mb-10 leading-relaxed">
                                    Your maintenance request has been successfully transmitted to our engineering team. You can monitor its status via the dashboard.
                                </p>
                                <button
                                    onClick={() => router.push("/dashboard")}
                                    className="px-8 py-4 rounded-full border border-white/20 text-white font-semibold hover:bg-white/10 hover:border-white/40 transition-all"
                                >
                                    Return to Overview
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
